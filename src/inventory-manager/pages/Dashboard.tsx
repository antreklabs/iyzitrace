import React, { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    AppstoreOutlined,
    BranchesOutlined,
    CloudOutlined,
    ContainerOutlined,
    DatabaseOutlined,
    DesktopOutlined,
    ApiOutlined,
    MessageOutlined,
    ArrowRightOutlined,
    PartitionOutlined,
} from '@ant-design/icons';
import { useStats, useEntities } from '../hooks/useInventory';
import StatsCard from '../components/StatsCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { EntityBadge } from '../components/EntityIcon';
import { useNavigation } from '../components/NavigationContext';
import type { EntityType, Entity } from '../types/inventory';

const Dashboard: React.FC = () => {
    const { stats, loading: statsLoading, error: statsError, refresh: refreshStats } = useStats();
    const { data: entitiesData, loading: entitiesLoading } = useEntities({ limit: 5000 });
    const navigate = useNavigate();
    const { selectEntity } = useNavigation();

    const entityBreakdowns = useMemo(() => {
        if (!entitiesData?.entities) return null;
        const entities = entitiesData.entities;

        return {
            hostsByOS: groupByAttribute(entities.filter(e => e.type === 'host'), 'os.type', 'Unknown OS'),
            containersByRuntime: groupByAttribute(entities.filter(e => e.type === 'container'), 'container.runtime', 'Unknown Runtime'),
            servicesByNamespace: groupByAttribute(entities.filter(e => e.type === 'service'), 'service.namespace', 'default'),
            dbsBySystem: groupByAttribute(entities.filter(e => e.type === 'db.instance' || e.type === 'cache.instance'), 'db.system', 'Unknown'),
            messagingBySystem: groupByAttribute(entities.filter(e => e.type === 'messaging.system'), 'messaging.system', 'Unknown'),
        };
    }, [entitiesData]);

    const goToFiltered = (type: EntityType) => {
        navigate(`../table?type=${type}`);
    };

    if (statsLoading || entitiesLoading) {
        return <LoadingSpinner tip="Loading dashboard..." />;
    }

    if (statsError) {
        return <ErrorMessage message={statsError.message} onRetry={refreshStats} />;
    }

    return (
        <div className="dashboard">
            {/* Header */}
            <div className="dashboard__header">
                <h1 className="dashboard__title">Infrastructure Inventory</h1>
                <p className="dashboard__subtitle">
                    Overview of discovered entities and relationships
                </p>
            </div>

            {/* Main Stats */}
            <div className="dashboard__stats-grid">
                <StatsCard title="Total Entities" value={stats?.EntityCount || 0} icon={<AppstoreOutlined className="dashboard__stats-icon" />} color="primary" />
                <StatsCard title="Total Relations" value={stats?.RelationCount || 0} icon={<BranchesOutlined className="dashboard__stats-icon" />} color="purple" />
                <StatsCard title="Entity Types" value={Object.keys(stats?.EntityTypes || {}).length} icon={<PartitionOutlined className="dashboard__stats-icon" />} color="green" />
                <StatsCard title="Relation Types" value={Object.keys(stats?.RelationTypes || {}).length} icon={<BranchesOutlined className="dashboard__stats-icon" />} color="orange" />
            </div>

            {/* Entity Breakdown Cards */}
            <div className="dashboard__breakdown-grid">
                <BreakdownCard title="Hosts" icon={<DesktopOutlined />} total={stats?.EntityTypes?.['host'] || 0} items={entityBreakdowns?.hostsByOS || []} color="#3b82f6" onClick={() => goToFiltered('host')} />
                <BreakdownCard title="Containers" icon={<ContainerOutlined />} total={stats?.EntityTypes?.['container'] || 0} items={entityBreakdowns?.containersByRuntime || []} color="#8b5cf6" onClick={() => goToFiltered('container')} />
                <BreakdownCard title="Kubernetes Pods" icon={<CloudOutlined />} total={stats?.EntityTypes?.['k8s.pod'] || 0} items={[]} color="#10b981" onClick={() => goToFiltered('k8s.pod')} />
                <BreakdownCard title="Services" icon={<ApiOutlined />} total={stats?.EntityTypes?.['service'] || 0} items={entityBreakdowns?.servicesByNamespace || []} color="#ec4899" onClick={() => goToFiltered('service')} />
                <BreakdownCard title="Databases &amp; Cache" icon={<DatabaseOutlined />} total={(stats?.EntityTypes?.['db.instance'] || 0) + (stats?.EntityTypes?.['cache.instance'] || 0)} items={entityBreakdowns?.dbsBySystem || []} color="#f97316" onClick={() => goToFiltered('db.instance')} />
                <BreakdownCard title="Messaging Systems" icon={<MessageOutlined />} total={stats?.EntityTypes?.['messaging.system'] || 0} items={entityBreakdowns?.messagingBySystem || []} color="#a855f7" onClick={() => goToFiltered('messaging.system')} />
            </div>

            {/* All Entity Types and Recent Entities */}
            <div className="dashboard__two-col">
                {/* All Entity Types */}
                <div className="dashboard__panel">
                    <h2 className="dashboard__panel-title">All Entity Types</h2>
                    <div className="dashboard__scrollable">
                        {stats?.EntityTypes && Object.entries(stats.EntityTypes)
                            .sort(([, a], [, b]) => b - a)
                            .map(([type, count]) => (
                                <button
                                    key={type}
                                    onClick={() => goToFiltered(type as EntityType)}
                                    className="dashboard__list-btn"
                                >
                                    <EntityBadge type={type as EntityType} />
                                    <span className="dashboard__entity-count">{count}</span>
                                </button>
                            ))
                        }
                    </div>
                </div>

                {/* Recent Entities */}
                <div className="dashboard__panel">
                    <div className="dashboard__panel-header">
                        <h2 className="dashboard__panel-header-title">Recent Entities</h2>
                        <Link to="../table" className="dashboard__view-all">
                            View all <ArrowRightOutlined />
                        </Link>
                    </div>
                    <div className="dashboard__scrollable">
                        {entitiesData?.entities.slice(0, 5).map((entity) => (
                            <button
                                key={entity.id}
                                onClick={() => selectEntity(entity.id)}
                                className="dashboard__list-btn--entity"
                            >
                                <div className="dashboard__entity-row">
                                    <EntityBadge type={entity.type} />
                                    <span className="dashboard__entity-name">{entity.name}</span>
                                </div>
                                <span className="dashboard__entity-time">
                                    {new Date(entity.last_seen).toLocaleTimeString()}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

function groupByAttribute(
    entities: Entity[],
    attrKey: string,
    defaultValue: string
): { value: string; count: number }[] {
    const groups = new Map<string, number>();
    entities.forEach(entity => {
        const value = entity.attrs[attrKey] || defaultValue;
        groups.set(value, (groups.get(value) || 0) + 1);
    });
    return Array.from(groups.entries())
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count);
}

interface BreakdownCardProps {
    title: string;
    icon: React.ReactNode;
    total: number;
    items: { value: string; count: number }[];
    color: string;
    onClick: () => void;
}

const BreakdownCard: React.FC<BreakdownCardProps> = ({ title, icon, total, items, color, onClick }) => {
    return (
        <div onClick={onClick} className="breakdown-card">
            <div className="breakdown-card__header">
                <div className="breakdown-card__icon-title">
                    <div className="breakdown-card__icon-wrap" style={{ background: `${color}15`, color }}>{icon}</div>
                    <h3 className="breakdown-card__title">{title}</h3>
                </div>
                <span className="breakdown-card__total" style={{ color }}>{total}</span>
            </div>
            {items.length > 0 && (
                <div>
                    {items.slice(0, 3).map(({ value, count }) => (
                        <div key={value} className="breakdown-card__item">
                            <span className="breakdown-card__item-label">{value}</span>
                            <span className="breakdown-card__item-count">{count}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Dashboard;
