import React, { useMemo, useState, useCallback } from 'react';
import { Tree, Input, Empty, Button, Segmented, Tooltip, Collapse } from 'antd';
import type { DataNode } from 'antd/es/tree';
import {
    SearchOutlined,
    DesktopOutlined,
    ContainerOutlined,
    ApiOutlined,
    DatabaseOutlined,
    CloudOutlined,
    AppstoreOutlined,
    FolderOutlined,
    UnorderedListOutlined,
    ExpandAltOutlined,
    ShrinkOutlined,
    ReloadOutlined,
    DownOutlined,
} from '@ant-design/icons';
import { useEntities } from '../hooks/useInventory';
import { useNavigation } from '../components/NavigationContext';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { EntityIcon } from '../components/EntityIcon';
import type { Entity, EntityType } from '../types/inventory';
import { ENTITY_CATEGORIES, ENTITY_COLORS } from '../types/inventory';

type ViewMode = 'category' | 'tree';

const TreeView: React.FC = () => {
    const { data, loading, error, refresh } = useEntities({ limit: 5000 });
    const { selectEntity } = useNavigation();
    const [searchValue, setSearchValue] = useState('');
    const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
    const [viewMode, setViewMode] = useState<ViewMode>('category');
    const [activePanels, setActivePanels] = useState<string[]>(['infrastructure', 'kubernetes', 'services', 'databases', 'messaging', 'mobile']);

    // Filter entities by search
    const filteredEntities = useMemo(() => {
        if (!data?.entities) return [];
        if (!searchValue) return data.entities;
        return data.entities.filter(e => e.name.toLowerCase().includes(searchValue.toLowerCase()));
    }, [data, searchValue]);

    // Group entities by category and type for Category View
    const categoryData = useMemo(() => {
        const result: Record<string, { types: Map<EntityType, Entity[]>; total: number }> = {};

        Object.entries(ENTITY_CATEGORIES).forEach(([category, types]) => {
            const categoryEntities = filteredEntities.filter(e => types.includes(e.type));
            if (categoryEntities.length > 0) {
                const typeGroups = new Map<EntityType, Entity[]>();
                categoryEntities.forEach(entity => {
                    if (!typeGroups.has(entity.type)) {
                        typeGroups.set(entity.type, []);
                    }
                    typeGroups.get(entity.type)!.push(entity);
                });
                result[category] = { types: typeGroups, total: categoryEntities.length };
            }
        });

        return result;
    }, [filteredEntities]);

    // Get all possible keys for expand/collapse (tree mode)
    const allKeys = useMemo((): React.Key[] => {
        if (!data?.entities) return [];
        const keys: React.Key[] = [];
        const typeGroups = new Set(data.entities.map(e => e.type));
        typeGroups.forEach(type => keys.push(type));
        return keys;
    }, [data]);

    // Build tree data for Tree View mode
    const treeData = useMemo((): DataNode[] => {
        if (!filteredEntities.length) return [];

        const typeGroups = new Map<EntityType, Entity[]>();
        filteredEntities.forEach(entity => {
            if (!typeGroups.has(entity.type)) {
                typeGroups.set(entity.type, []);
            }
            typeGroups.get(entity.type)!.push(entity);
        });

        return Array.from(typeGroups.entries())
            .sort(([, a], [, b]) => b.length - a.length)
            .map(([type, typeEntities]) => ({
                title: (
                    <span style={{ color: ENTITY_COLORS[type] || '#94a3b8', fontWeight: 600 }}>
                        {type} ({typeEntities.length})
                    </span>
                ),
                key: type,
                children: typeEntities.map(entity => ({
                    title: (
                        <span
                            style={{ cursor: 'pointer', color: '#f1f5f9' }}
                            onClick={() => selectEntity(entity.id)}
                        >
                            {entity.name}
                        </span>
                    ),
                    key: entity.id,
                    isLeaf: true,
                })),
            }));
    }, [filteredEntities, selectEntity]);

    const handleExpandAll = useCallback(() => {
        if (viewMode === 'category') {
            setActivePanels(Object.keys(categoryData));
        } else {
            setExpandedKeys(allKeys);
        }
    }, [allKeys, categoryData, viewMode]);

    const handleCollapseAll = useCallback(() => {
        if (viewMode === 'category') {
            setActivePanels([]);
        } else {
            setExpandedKeys([]);
        }
    }, [viewMode]);

    React.useEffect(() => {
        if (searchValue && viewMode === 'tree') {
            setExpandedKeys(allKeys);
        }
    }, [searchValue, allKeys, viewMode]);

    if (loading) {
        return <LoadingSpinner tip="Loading entities..." />;
    }

    if (error) {
        return <ErrorMessage message={error.message} onRetry={refresh} />;
    }

    // Entity Card component - Dark theme
    const EntityCard = ({ entity }: { entity: Entity }) => (
        <div
            onClick={() => selectEntity(entity.id)}
            style={{
                background: '#1a1a1a',
                border: '1px solid #2a2a2a',
                borderRadius: '8px',
                padding: '12px 16px',
                cursor: 'pointer',
                color: '#e2e8f0',
                fontSize: '14px',
                fontWeight: 500,
                transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.background = '#2a2a2a';
                e.currentTarget.style.borderColor = '#475569';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.background = '#1a1a1a';
                e.currentTarget.style.borderColor = '#2a2a2a';
            }}
        >
            {entity.name}
        </div>
    );

    // Type Section component for Category View
    const TypeSection = ({ type, entities }: { type: EntityType; entities: Entity[] }) => (
        <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <EntityIcon type={type} size={18} />
                <span style={{ fontWeight: 600, color: ENTITY_COLORS[type] || '#94a3b8' }}>{type}</span>
                <span style={{ color: '#60a5fa', fontWeight: 500 }}>{entities.length}</span>
            </div>
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px',
                paddingLeft: '4px',
            }}>
                {entities.map(entity => (
                    <EntityCard key={entity.id} entity={entity} />
                ))}
            </div>
        </div>
    );

    // Category Panel component
    const CategoryPanel = ({ category, types }: { category: string; types: Map<EntityType, Entity[]> }) => (
        <div style={{ padding: '16px 0' }}>
            {Array.from(types.entries())
                .sort(([, a], [, b]) => b.length - a.length)
                .map(([type, entities]) => (
                    <TypeSection key={type} type={type} entities={entities} />
                ))}
        </div>
    );

    return (
        <div style={{ padding: '24px', background: '#111111', minHeight: 'calc(100vh - 64px)' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#f1f5f9', margin: 0 }}>Entity Tree</h1>
                    <p style={{ fontSize: '14px', color: '#94a3b8', marginTop: '4px' }}>
                        Hierarchical view of infrastructure entities
                    </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Segmented
                        value={viewMode}
                        onChange={(value) => setViewMode(value as ViewMode)}
                        options={[
                            { value: 'category', icon: <FolderOutlined />, label: 'Category View' },
                            { value: 'tree', icon: <UnorderedListOutlined />, label: 'Tree View' },
                        ]}
                        style={{ background: '#2a2a2a' }}
                    />
                    <Tooltip title="Refresh">
                        <Button
                            icon={<ReloadOutlined />}
                            onClick={refresh}
                            style={{ background: '#2a2a2a', border: 'none', color: '#94a3b8' }}
                        />
                    </Tooltip>
                </div>
            </div>

            {/* Search and Controls */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', alignItems: 'center' }}>
                <Input
                    placeholder="Search entities..."
                    prefix={<SearchOutlined style={{ color: '#64748b' }} />}
                    value={searchValue}
                    onChange={e => setSearchValue(e.target.value)}
                    style={{
                        flex: 1,
                        background: '#1a1a1a',
                        border: '1px solid #2a2a2a',
                        color: '#f1f5f9',
                    }}
                />
                <Button
                    icon={<ExpandAltOutlined />}
                    onClick={handleExpandAll}
                    style={{ background: '#2a2a2a', border: 'none', color: '#94a3b8' }}
                >
                    Expand All
                </Button>
                <Button
                    icon={<ShrinkOutlined />}
                    onClick={handleCollapseAll}
                    style={{ background: '#2a2a2a', border: 'none', color: '#94a3b8' }}
                >
                    Collapse All
                </Button>
            </div>

            {/* Content */}
            <div style={{
                background: '#111111',
                borderRadius: '12px',
                border: '1px solid #2a2a2a',
                minHeight: '400px',
                overflow: 'hidden',
            }}>
                {viewMode === 'category' ? (
                    // Category View with collapsible panels and grid layout
                    Object.keys(categoryData).length > 0 ? (
                        <Collapse
                            activeKey={activePanels}
                            onChange={(keys) => setActivePanels(keys as string[])}
                            expandIcon={({ isActive }) => <DownOutlined rotate={isActive ? 0 : -90} style={{ color: '#94a3b8' }} />}
                            style={{ background: 'transparent', border: 'none' }}
                            items={Object.entries(categoryData).map(([category, { types, total }]) => ({
                                key: category,
                                label: (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '16px', fontWeight: 700, color: '#f1f5f9', textTransform: 'capitalize' }}>
                                            {category}
                                        </span>
                                        <span style={{ fontSize: '14px', color: '#60a5fa', fontWeight: 600 }}>{total}</span>
                                    </div>
                                ),
                                children: <CategoryPanel category={category} types={types} />,
                                style: {
                                    background: '#111111',
                                    borderBottom: '1px solid #2a2a2a',
                                    borderRadius: 0,
                                },
                            }))}
                        />
                    ) : (
                        <Empty
                            description={<span style={{ color: '#64748b' }}>No entities found</span>}
                            style={{ padding: '48px' }}
                        />
                    )
                ) : (
                    // Tree View
                    <div style={{ padding: '16px' }}>
                        {treeData.length > 0 ? (
                            <Tree
                                treeData={treeData}
                                expandedKeys={expandedKeys}
                                onExpand={(keys) => setExpandedKeys(keys)}
                                showLine={{ showLeafIcon: false }}
                                style={{ background: 'transparent', color: '#f1f5f9' }}
                            />
                        ) : (
                            <Empty
                                description={<span style={{ color: '#64748b' }}>No entities found</span>}
                                style={{ padding: '48px' }}
                            />
                        )}
                    </div>
                )}
            </div>

            {/* Custom styles for Ant Design Collapse in dark theme */}
            <style>{`
        .ant-collapse > .ant-collapse-item > .ant-collapse-header {
          color: #f1f5f9 !important;
          background: #1a1a1a !important;
          border-radius: 0 !important;
        }
        .ant-collapse > .ant-collapse-item > .ant-collapse-header:hover {
          background: #2a2a2a !important;
        }
        .ant-collapse-content {
          background: #111111 !important;
          border-top: 1px solid #2a2a2a !important;
        }
        .ant-collapse-content > .ant-collapse-content-box {
          padding: 16px 24px !important;
        }
      `}</style>
        </div>
    );
};

export default TreeView;
