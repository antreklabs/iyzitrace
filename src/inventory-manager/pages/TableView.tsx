import React, { useState, useMemo } from 'react';
import { Table, Input, Select, Tag, Space, Segmented } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
    SearchOutlined,
    ArrowRightOutlined,
    SwapOutlined,
    ClockCircleOutlined,
    UnorderedListOutlined,
    BranchesOutlined,
    ExportOutlined,
} from '@ant-design/icons';
import { useSearchParams } from 'react-router-dom';
import { useEntities, useRelations, useTopology } from '../hooks/useInventory';
import { useNavigation } from '../components/NavigationContext';
import { EntityIcon, StatusBadge, EntityBadge } from '../components/EntityIcon';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import type { Entity, EntityType, Relation, TopologyNode } from '../types/inventory';
import { ENTITY_COLORS, ENTITY_CATEGORIES } from '../types/inventory';

const allEntityTypes = Object.values(ENTITY_CATEGORIES).flat();

type TabType = 'entities' | 'relations';

const RELATION_STYLE: Record<string, { label: string; color: string; bg: string }> = {
    runs_on: { label: 'runs on', color: '#60a5fa', bg: '#3b82f620' },
    runs_in: { label: 'runs in', color: '#a78bfa', bg: '#7c3aed20' },
    located_in: { label: 'located in', color: '#fbbf24', bg: '#f59e0b20' },
    uses: { label: 'uses', color: '#fb923c', bg: '#f9731620' },
    publishes_to: { label: 'publishes to', color: '#4ade80', bg: '#16a34a20' },
    consumes_from: { label: 'consumes from', color: '#38bdf8', bg: '#0284c720' },
    belongs_to: { label: 'belongs to', color: '#94a3b8', bg: '#94a3b820' },
    part_of: { label: 'part of', color: '#94a3b8', bg: '#94a3b820' },
    managed_by: { label: 'managed by', color: '#c084fc', bg: '#8b5cf620' },
    instance_of: { label: 'instance of', color: '#94a3b8', bg: '#94a3b820' },
};

function formatRelativeTime(iso: string) {
    const diffMs = Date.now() - new Date(iso).getTime();
    const diffSec = Math.max(0, Math.floor(diffMs / 1000));
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 48) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    return `${diffDay}d ago`;
}

const TableView: React.FC = () => {
    const [searchParams] = useSearchParams();
    const initialType = searchParams.get('type') as EntityType | null;

    const [activeTab, setActiveTab] = useState<TabType>('entities');
    const [searchValue, setSearchValue] = useState('');
    const [selectedTypes, setSelectedTypes] = useState<EntityType[]>(initialType ? [initialType] : []);

    const { data, loading: entitiesLoading, error: entitiesError, refresh: refreshEntities } = useEntities({ limit: 5000 });
    const { data: relationsData, loading: relationsLoading, error: relationsError, refresh: refreshRelations } = useRelations({ limit: 5000 });
    const { topology } = useTopology();
    const { selectEntity } = useNavigation();

    const loading = activeTab === 'entities' ? entitiesLoading : relationsLoading;
    const error = activeTab === 'entities' ? entitiesError : relationsError;
    const refresh = activeTab === 'entities' ? refreshEntities : refreshRelations;

    const nodeById = useMemo(() => {
        const map = new Map<string, TopologyNode>();
        for (const n of topology?.nodes || []) map.set(n.id, n);
        return map;
    }, [topology]);

    const resolveNode = (id: string): TopologyNode | null => nodeById.get(id) || null;

    const filteredEntities = useMemo(() => {
        if (!data?.entities) return [];
        let result = data.entities;
        if (selectedTypes.length > 0) {
            result = result.filter(e => selectedTypes.includes(e.type));
        }
        if (searchValue) {
            const search = searchValue.toLowerCase();
            result = result.filter(e =>
                e.name.toLowerCase().includes(search) ||
                e.id.toLowerCase().includes(search) ||
                e.type.toLowerCase().includes(search)
            );
        }
        return result;
    }, [data, selectedTypes, searchValue]);

    const filteredRelations = useMemo(() => {
        const rels = relationsData?.relations || [];
        if (!rels.length) return [];
        const term = searchValue.trim().toLowerCase();

        return rels.filter((r) => {
            const fromNode = resolveNode(r.from_id);
            const toNode = resolveNode(r.to_id);

            if (selectedTypes.length > 0) {
                const fromType = fromNode?.type;
                const toType = toNode?.type;
                if (!fromType && !toType) return false;
                if (!selectedTypes.includes(fromType as EntityType) && !selectedTypes.includes(toType as EntityType)) {
                    return false;
                }
            }

            if (!term) return true;

            const haystack = [
                r.type, r.from_id, r.to_id,
                fromNode?.name || '', fromNode?.type || '',
                toNode?.name || '', toNode?.type || '',
            ].join(' ').toLowerCase();

            return haystack.includes(term);
        });
    }, [relationsData, searchValue, selectedTypes, nodeById]);

    const columns: ColumnsType<Entity> = [
        {
            title: 'ENTITY INFO',
            key: 'entity_info',
            width: '40%',
            render: (_, record: Entity) => (
                <div className="table-view__entity-info" onClick={() => selectEntity(record.id)}>
                    <EntityIcon type={record.type} size={20} />
                    <div>
                        <div className="table-view__entity-name">{record.name}</div>
                        <div className="table-view__entity-id">{record.id.substring(0, 24)}…</div>
                    </div>
                </div>
            ),
            sorter: (a, b) => a.name.localeCompare(b.name),
        },
        {
            title: 'TYPE',
            dataIndex: 'type',
            key: 'type',
            width: '15%',
            render: (type: EntityType) => <EntityBadge type={type} />,
            filters: allEntityTypes.map(t => ({ text: t, value: t })),
            onFilter: (value, record) => record.type === value,
        },
        {
            title: 'STATUS',
            dataIndex: 'status',
            key: 'status',
            width: '10%',
            render: (status) => <StatusBadge status={status} />,
            filters: [
                { text: 'Active', value: 'active' },
                { text: 'Stale', value: 'stale' },
                { text: 'Stopped', value: 'stopped' },
            ],
            onFilter: (value, record) => record.status === value,
        },
        {
            title: 'LAST SEEN',
            dataIndex: 'last_seen',
            key: 'last_seen',
            width: '20%',
            render: (value: string) => (
                <span className="table-view__timestamp">
                    {new Date(value).toLocaleString()}
                </span>
            ),
            sorter: (a, b) => new Date(b.last_seen).getTime() - new Date(a.last_seen).getTime(),
            defaultSortOrder: 'descend',
        },
        {
            title: 'ACTION',
            key: 'action',
            width: '8%',
            render: (_, record: Entity) => (
                <button onClick={() => selectEntity(record.id)} className="table-view__action-btn">
                    <ExportOutlined className="table-view__action-icon" />
                </button>
            ),
        },
    ];

    if (loading) {
        return <LoadingSpinner tip={`Loading ${activeTab}...`} />;
    }

    if (error) {
        return <ErrorMessage message={error.message} onRetry={refresh} />;
    }

    return (
        <div className="table-view">
            {/* Header */}
            <div className="table-view__header">
                <h1 className="table-view__title">Data Explorer</h1>
                <p className="table-view__subtitle">
                    Browse and search entities and relationships
                </p>
            </div>

            {/* Tabs + Filters */}
            <div className="table-view__filters">
                <Segmented
                    value={activeTab}
                    onChange={(value) => setActiveTab(value as TabType)}
                    options={[
                        { value: 'entities', label: 'Entities' },
                        { value: 'relations', label: 'Relations' },
                    ]}
                    className="table-view__segmented"
                />
                <Input
                    placeholder={`Search ${activeTab}...`}
                    prefix={<SearchOutlined className="table-view__search-icon" />}
                    value={searchValue}
                    onChange={e => setSearchValue(e.target.value)}
                    className="table-view__search-input"
                />
                {activeTab === 'entities' && (
                    <Select
                        mode="multiple"
                        placeholder="Filter by type..."
                        value={selectedTypes}
                        onChange={setSelectedTypes}
                        className="table-view__type-filter"
                        options={allEntityTypes.map(t => ({ label: t, value: t }))}
                        allowClear
                    />
                )}
            </div>

            {/* Metadata */}
            <div className="table-view__meta">
                {activeTab === 'entities'
                    ? `${filteredEntities.length} of ${data?.total || 0} entities`
                    : `${filteredRelations.length} relations`
                }
            </div>

            {/* Content */}
            <div className="table-view__content">
                {activeTab === 'entities' ? (
                    <Table
                        columns={columns}
                        dataSource={filteredEntities}
                        rowKey="id"
                        pagination={{
                            pageSize: 20,
                            showSizeChanger: true,
                            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
                        }}
                        size="middle"
                    />
                ) : (
                    <RelationsList
                        relations={filteredRelations}
                        resolveNode={resolveNode}
                        onOpenEntity={selectEntity}
                    />
                )}
            </div>
        </div>
    );
};

// Relations List component — dark theme version matching original UI layout
const RelationsList: React.FC<{
    relations: Relation[];
    resolveNode: (id: string) => TopologyNode | null;
    onOpenEntity: (id: string) => void;
}> = ({ relations, resolveNode, onOpenEntity }) => {
    const [page, setPage] = useState(0);
    const pageSize = 20;

    const paginatedRelations = useMemo(() => {
        const start = page * pageSize;
        return relations.slice(start, start + pageSize);
    }, [relations, page]);

    const totalPages = Math.ceil(relations.length / pageSize);

    if (relations.length === 0) {
        return (
            <div className="relations-list__empty">
                No relations found
            </div>
        );
    }

    return (
        <div>
            <div className="relations-list__body">
                {paginatedRelations.map((relation, idx) => {
                    const from = resolveNode(relation.from_id);
                    const to = resolveNode(relation.to_id);
                    const relInfo = RELATION_STYLE[relation.type] || { label: relation.type, color: '#a78bfa', bg: '#7c3aed20' };

                    const fromLabel = from?.name || `${relation.from_id.substring(0, 12)}…`;
                    const toLabel = to?.name || `${relation.to_id.substring(0, 12)}…`;
                    const fromType = from?.type;
                    const toType = to?.type;

                    return (
                        <div key={idx} className="relations-list__item">
                            {/* From Entity */}
                            <div onClick={() => onOpenEntity(relation.from_id)} className="relations-list__entity">
                                <EntityBadge type={(fromType || 'unknown') as EntityType} />
                                <div className="relations-list__entity-inner">
                                    <div className="relations-list__entity-name">{fromLabel}</div>
                                    <div className="relations-list__entity-meta">
                                        {fromType || 'unknown'} • {relation.from_id.substring(0, 16)}…
                                    </div>
                                </div>
                            </div>

                            {/* Relation Badge */}
                            <div className="relations-list__badge-container">
                                <span
                                    className="relations-list__badge"
                                    style={{
                                        backgroundColor: relInfo.bg,
                                        color: relInfo.color,
                                        border: `1px solid ${relInfo.color}30`,
                                    }}
                                >
                                    <SwapOutlined className="inv-sort-icon" />
                                    {relInfo.label}
                                </span>
                                <ArrowRightOutlined className="relations-list__arrow" />
                            </div>

                            {/* To Entity */}
                            <div onClick={() => onOpenEntity(relation.to_id)} className="relations-list__entity">
                                <EntityBadge type={(toType || 'unknown') as EntityType} />
                                <div className="relations-list__entity-inner">
                                    <div className="relations-list__entity-name">{toLabel}</div>
                                    <div className="relations-list__entity-meta">
                                        {toType || 'unknown'} • {relation.to_id.substring(0, 16)}…
                                    </div>
                                </div>
                            </div>

                            {/* Timestamp */}
                            <div className="relations-list__timestamp">
                                <div className="relations-list__time-row">
                                    <ClockCircleOutlined className="relations-list__time-icon" />
                                    <span className="relations-list__time-value">
                                        {formatRelativeTime(relation.last_seen)}
                                    </span>
                                </div>
                                <div className="relations-list__time-full">
                                    {new Date(relation.last_seen).toLocaleString()}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="relations-list__pagination">
                    <span className="relations-list__page-info">
                        Page {page + 1} of {totalPages} ({relations.length} total)
                    </span>
                    <div className="relations-list__page-btns">
                        <button
                            disabled={page === 0}
                            onClick={() => setPage(p => p - 1)}
                            className="relations-list__page-btn"
                        >
                            Previous
                        </button>
                        <button
                            disabled={page >= totalPages - 1}
                            onClick={() => setPage(p => p + 1)}
                            className="relations-list__page-btn"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TableView;
