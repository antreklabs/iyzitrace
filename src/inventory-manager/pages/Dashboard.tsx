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
    TableOutlined,
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

    // Group entities by various attributes
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
        navigate(`table?type=${type}`);
    };

    if (statsLoading || entitiesLoading) {
        return <LoadingSpinner tip="Loading dashboard..." />;
    }

    if (statsError) {
        return <ErrorMessage message={statsError.message} onRetry={refreshStats} />;
    }

    const containerStyle: React.CSSProperties = {
        padding: '24px',
        maxWidth: '1400px',
        margin: '0 auto',
    };

    const headerStyle: React.CSSProperties = {
        marginBottom: '32px',
    };

    const gridStyle: React.CSSProperties = {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '16px',
        marginBottom: '32px',
    };

    const cardStyle: React.CSSProperties = {
        background: '#1a1a1a',
        borderRadius: '12px',
        border: '1px solid #2a2a2a',
        padding: '20px',
    };

    const breakdownCardStyle: React.CSSProperties = {
        ...cardStyle,
        cursor: 'pointer',
    };

    return (
        <div style={containerStyle}>
            {/* Header */}
            <div style={headerStyle}>
                <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#f1f5f9', margin: 0 }}>Infrastructure Inventory</h1>
                <p style={{ fontSize: '14px', color: '#94a3b8', marginTop: '4px' }}>
                    Overview of discovered entities and relationships
                </p>
            </div>

            {/* Main Stats */}
            <div style={gridStyle}>
                <StatsCard
                    title="Total Entities"
                    value={stats?.EntityCount || 0}
                    icon={<AppstoreOutlined style={{ fontSize: '24px' }} />}
                    color="primary"
                />
                <StatsCard
                    title="Total Relations"
                    value={stats?.RelationCount || 0}
                    icon={<BranchesOutlined style={{ fontSize: '24px' }} />}
                    color="purple"
                />
                <StatsCard
                    title="Entity Types"
                    value={Object.keys(stats?.EntityTypes || {}).length}
                    icon={<PartitionOutlined style={{ fontSize: '24px' }} />}
                    color="green"
                />
                <StatsCard
                    title="Relation Types"
                    value={Object.keys(stats?.RelationTypes || {}).length}
                    icon={<BranchesOutlined style={{ fontSize: '24px' }} />}
                    color="orange"
                />
            </div>

            {/* Entity Breakdown Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                <BreakdownCard
                    title="Hosts"
                    icon={<DesktopOutlined />}
                    total={stats?.EntityTypes?.['host'] || 0}
                    items={entityBreakdowns?.hostsByOS || []}
                    color="#3b82f6"
                    onClick={() => goToFiltered('host')}
                />
                <BreakdownCard
                    title="Containers"
                    icon={<ContainerOutlined />}
                    total={stats?.EntityTypes?.['container'] || 0}
                    items={entityBreakdowns?.containersByRuntime || []}
                    color="#8b5cf6"
                    onClick={() => goToFiltered('container')}
                />
                <BreakdownCard
                    title="Kubernetes Pods"
                    icon={<CloudOutlined />}
                    total={stats?.EntityTypes?.['k8s.pod'] || 0}
                    items={[]}
                    color="#10b981"
                    onClick={() => goToFiltered('k8s.pod')}
                />
                <BreakdownCard
                    title="Services"
                    icon={<ApiOutlined />}
                    total={stats?.EntityTypes?.['service'] || 0}
                    items={entityBreakdowns?.servicesByNamespace || []}
                    color="#ec4899"
                    onClick={() => goToFiltered('service')}
                />
                <BreakdownCard
                    title="Databases & Cache"
                    icon={<DatabaseOutlined />}
                    total={(stats?.EntityTypes?.['db.instance'] || 0) + (stats?.EntityTypes?.['cache.instance'] || 0)}
                    items={entityBreakdowns?.dbsBySystem || []}
                    color="#f97316"
                    onClick={() => goToFiltered('db.instance')}
                />
                <BreakdownCard
                    title="Messaging Systems"
                    icon={<MessageOutlined />}
                    total={stats?.EntityTypes?.['messaging.system'] || 0}
                    items={entityBreakdowns?.messagingBySystem || []}
                    color="#a855f7"
                    onClick={() => goToFiltered('messaging.system')}
                />
            </div>

            {/* All Entity Types and Quick Actions */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                {/* All Entity Types */}
                <div style={cardStyle}>
                    <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#f1f5f9', marginBottom: '16px' }}>All Entity Types</h2>
                    <div style={{ maxHeight: '256px', overflowY: 'auto' }}>
                        {stats?.EntityTypes && Object.entries(stats.EntityTypes)
                            .sort(([, a], [, b]) => b - a)
                            .map(([type, count]) => (
                                <button
                                    key={type}
                                    onClick={() => goToFiltered(type as EntityType)}
                                    style={{
                                        width: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '8px 12px',
                                        borderRadius: '8px',
                                        background: 'transparent',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: '#f1f5f9',
                                    }}
                                >
                                    <EntityBadge type={type as EntityType} />
                                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#60a5fa' }}>{count}</span>
                                </button>
                            ))
                        }
                    </div>
                </div>

                {/* Quick Actions */}
                <div style={cardStyle}>
                    <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#f1f5f9', marginBottom: '16px' }}>Quick Actions</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <QuickLink to="topology" icon={<CloudOutlined />} label="View Topology Graph" />
                        <QuickLink to="tree" icon={<PartitionOutlined />} label="Browse Entity Tree" />
                        <QuickLink to="table" icon={<TableOutlined />} label="View All Entities" />
                    </div>
                </div>
            </div>

            {/* Recent Entities */}
            <div style={{ ...cardStyle, marginTop: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#f1f5f9', margin: 0 }}>Recent Entities</h2>
                    <Link to="table" style={{ color: '#60a5fa', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        View all <ArrowRightOutlined />
                    </Link>
                </div>
                <div>
                    {entitiesData?.entities.slice(0, 5).map((entity) => (
                        <button
                            key={entity.id}
                            onClick={() => selectEntity(entity.id)}
                            style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '12px',
                                borderRadius: '8px',
                                background: 'transparent',
                                border: 'none',
                                borderBottom: '1px solid #2a2a2a',
                                cursor: 'pointer',
                                color: '#f1f5f9',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <EntityBadge type={entity.type} />
                                <span style={{ fontSize: '14px', fontWeight: 500 }}>{entity.name}</span>
                            </div>
                            <span style={{ fontSize: '12px', color: '#64748b' }}>
                                {new Date(entity.last_seen).toLocaleTimeString()}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

// Helper function to group entities by attribute
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

// Breakdown Card Component
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
        <div
            onClick={onClick}
            style={{
                background: '#1a1a1a',
                borderRadius: '12px',
                border: '1px solid #2a2a2a',
                padding: '20px',
                cursor: 'pointer',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ padding: '8px', borderRadius: '8px', background: `${color}15`, color }}>
                        {icon}
                    </div>
                    <h3 style={{ fontWeight: 600, color: '#f1f5f9', margin: 0 }}>{title}</h3>
                </div>
                <span style={{ fontSize: '24px', fontWeight: 700, color }}>{total}</span>
            </div>
            {items.length > 0 && (
                <div>
                    {items.slice(0, 3).map(({ value, count }) => (
                        <div key={value} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #2a2a2a' }}>
                            <span style={{ fontSize: '13px', color: '#94a3b8', textTransform: 'capitalize' }}>{value}</span>
                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#f1f5f9' }}>{count}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// Quick Link Component
const QuickLink: React.FC<{ to: string; icon: React.ReactNode; label: string }> = ({ to, icon, label }) => {
    return (
        <Link
            to={to}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                borderRadius: '8px',
                background: '#2a2a2a',
                color: '#f1f5f9',
                textDecoration: 'none',
            }}
        >
            <div style={{ padding: '8px', borderRadius: '8px', background: '#3b82f615', color: '#60a5fa' }}>
                {icon}
            </div>
            <span style={{ fontSize: '14px', fontWeight: 500 }}>{label}</span>
            <ArrowRightOutlined style={{ marginLeft: 'auto', color: '#64748b' }} />
        </Link>
    );
};

export default Dashboard;
