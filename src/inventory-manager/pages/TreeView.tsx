import React, { useMemo, useState, useCallback } from 'react';
import { Tree, Input, Empty, Button, Segmented } from 'antd';
import type { DataNode } from 'antd/es/tree';
import {
    SearchOutlined,
    FolderOutlined,
    UnorderedListOutlined,
    DownOutlined,
} from '@ant-design/icons';
import { useEntities, useTopology } from '../hooks/useInventory';
import { useNavigation } from '../components/NavigationContext';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { EntityIcon } from '../components/EntityIcon';
import type { Entity, EntityType, TopologyNode, TopologyEdge } from '../types/inventory';
import { ENTITY_CATEGORIES, ENTITY_COLORS } from '../types/inventory';

type ViewMode = 'category' | 'tree';

const HIDDEN_TYPES = new Set(['process']);

const GROUPABLE_TYPES: Record<string, string> = {
    container: 'group.containers',
    service: 'group.services',
    'k8s.pod': 'group.pods',
};

const GROUP_INFO: Record<string, { label: string; color: string }> = {
    'group.containers': { label: 'Containers', color: '#8b5cf6' },
    'group.services': { label: 'Services', color: '#ec4899' },
    'group.pods': { label: 'Pods', color: '#22d3d1' },
};

interface HierarchyNode {
    id: string;
    name: string;
    type: string;
    entity?: TopologyNode;
    children: HierarchyNode[];
    level: number;
    isGroup?: boolean;
    count?: number;
}

function buildTree(nodes: TopologyNode[], edges: TopologyEdge[]): HierarchyNode[] {
    const childrenMap = new Map<string, string[]>();
    const hasParent = new Set<string>();

    edges.forEach(edge => {
        if (['part_of', 'runs_on', 'runs_in', 'located_in', 'belongs_to', 'managed_by'].includes(edge.type)) {
            if (!childrenMap.has(edge.to)) {
                childrenMap.set(edge.to, []);
            }
            childrenMap.get(edge.to)!.push(edge.from);
            hasParent.add(edge.from);
        }
    });

    const roots = nodes.filter(n => !hasParent.has(n.id));
    const nodeMap = new Map(nodes.map(n => [n.id, n]));

    function buildNode(entity: TopologyNode, level: number, visited: Set<string>): HierarchyNode {
        if (visited.has(entity.id)) {
            return { id: entity.id, name: entity.name, type: entity.type, entity, children: [], level };
        }
        visited.add(entity.id);

        const childIds = childrenMap.get(entity.id) || [];
        const childEntities = childIds
            .map(id => nodeMap.get(id))
            .filter((n): n is TopologyNode => n !== undefined);

        const groupedChildren: Record<string, TopologyNode[]> = {};
        const ungroupedChildren: TopologyNode[] = [];

        childEntities.forEach(child => {
            const groupType = GROUPABLE_TYPES[child.type];
            if (groupType) {
                if (!groupedChildren[groupType]) groupedChildren[groupType] = [];
                groupedChildren[groupType].push(child);
            } else {
                ungroupedChildren.push(child);
            }
        });

        const children: HierarchyNode[] = [];

        Object.entries(groupedChildren).forEach(([groupType, groupNodes]) => {
            const groupInfo = GROUP_INFO[groupType];
            children.push({
                id: `${entity.id}-${groupType}`,
                name: groupInfo.label,
                type: groupType,
                children: groupNodes.map(n => buildNode(n, level + 2, visited)),
                level: level + 1,
                isGroup: true,
                count: groupNodes.length,
            });
        });

        ungroupedChildren.forEach(child => {
            children.push(buildNode(child, level + 1, visited));
        });

        return { id: entity.id, name: entity.name, type: entity.type, entity, children, level };
    }

    return roots.map(r => buildNode(r, 0, new Set()));
}

function toDataNodes(nodes: HierarchyNode[], selectEntity: (id: string) => void): DataNode[] {
    return nodes.map(node => {
        const isGroup = node.isGroup;
        const groupInfo = isGroup ? GROUP_INFO[node.type] : null;
        const color = isGroup ? groupInfo?.color : ENTITY_COLORS[node.type] || '#64748b';

        return {
            title: (
                <span
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                    onClick={(e) => {
                        if (node.entity && node.children.length === 0) {
                            e.stopPropagation();
                            selectEntity(node.entity.id);
                        }
                    }}
                >
                    <EntityIcon type={node.type as EntityType} size={16} />
                    <span style={{ color: '#f1f5f9', fontWeight: isGroup ? 600 : 500, fontSize: '14px' }}>
                        {node.name}
                    </span>
                    {isGroup && node.count !== undefined && (
                        <span style={{
                            padding: '1px 8px',
                            fontSize: '11px',
                            fontWeight: 600,
                            borderRadius: '10px',
                            backgroundColor: `${color}20`,
                            color: color,
                        }}>
                            {node.count}
                        </span>
                    )}
                    {!isGroup && (
                        <span style={{ fontSize: '12px', color: '#64748b', marginLeft: 'auto' }}>
                            {node.type}
                        </span>
                    )}
                </span>
            ),
            key: node.id,
            isLeaf: node.children.length === 0,
            children: node.children.length > 0 ? toDataNodes(node.children, selectEntity) : undefined,
        };
    });
}

function collectAllKeys(nodes: HierarchyNode[]): React.Key[] {
    const keys: React.Key[] = [];
    function walk(list: HierarchyNode[]) {
        list.forEach(n => {
            if (n.children.length > 0) {
                keys.push(n.id);
                walk(n.children);
            }
        });
    }
    walk(nodes);
    return keys;
}

const CATEGORY_LABELS: Record<string, string> = {
    infrastructure: 'Infrastructure',
    kubernetes: 'Kubernetes',
    services: 'Services',
    databases: 'Databases & Cache',
    messaging: 'Messaging',
    mobile: 'Mobile',
};

const TreeView: React.FC = () => {
    const { data: entitiesData, loading: entitiesLoading, error: entitiesError, refresh: refreshEntities } = useEntities({ limit: 5000 });
    const { topology, loading: topoLoading, error: topoError, refresh: refreshTopology } = useTopology();
    const { selectEntity } = useNavigation();
    const [searchValue, setSearchValue] = useState('');
    const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
    const [viewMode, setViewMode] = useState<ViewMode>('tree');
    const [activePanels, setActivePanels] = useState<string[]>([]);

    const loading = viewMode === 'tree' ? topoLoading : entitiesLoading;
    const error = viewMode === 'tree' ? topoError : entitiesError;

    const refresh = useCallback(() => {
        refreshTopology();
        refreshEntities();
    }, [refreshTopology, refreshEntities]);

    const filteredEntities = useMemo(() => {
        if (!entitiesData?.entities) return [];
        const entities = entitiesData.entities.filter(e => !HIDDEN_TYPES.has(e.type));
        if (!searchValue) return entities;
        return entities.filter(e => e.name.toLowerCase().includes(searchValue.toLowerCase()));
    }, [entitiesData, searchValue]);

    const categoryData = useMemo(() => {
        const result: Record<string, { types: Map<EntityType, Entity[]>; total: number }> = {};

        Object.entries(ENTITY_CATEGORIES).forEach(([category, types]) => {
            const categoryEntities = filteredEntities.filter(e => types.includes(e.type));
            if (categoryEntities.length > 0) {
                const typeGroups = new Map<EntityType, Entity[]>();
                categoryEntities.forEach(entity => {
                    if (!typeGroups.has(entity.type)) typeGroups.set(entity.type, []);
                    typeGroups.get(entity.type)!.push(entity);
                });
                result[category] = { types: typeGroups, total: categoryEntities.length };
            }
        });

        return result;
    }, [filteredEntities]);

    const hierarchyTree = useMemo(() => {
        if (!topology) return [];
        const filteredNodes = topology.nodes.filter(n => !HIDDEN_TYPES.has(n.type));
        const filteredEdges = topology.edges.filter(e => {
            const fromNode = topology.nodes.find(n => n.id === e.from);
            const toNode = topology.nodes.find(n => n.id === e.to);
            return fromNode && toNode && !HIDDEN_TYPES.has(fromNode.type) && !HIDDEN_TYPES.has(toNode.type);
        });
        return buildTree(filteredNodes, filteredEdges);
    }, [topology]);

    const filteredTree = useMemo(() => {
        if (!searchValue) return hierarchyTree;
        const term = searchValue.toLowerCase();

        function filterNode(node: HierarchyNode): HierarchyNode | null {
            const matchesSelf = node.name.toLowerCase().includes(term) || node.type.toLowerCase().includes(term);
            const childMatches = node.children.map(c => filterNode(c)).filter((c): c is HierarchyNode => c !== null);
            if (matchesSelf || childMatches.length > 0) {
                return { ...node, children: matchesSelf ? node.children : childMatches };
            }
            return null;
        }

        return hierarchyTree.map(n => filterNode(n)).filter((n): n is HierarchyNode => n !== null);
    }, [hierarchyTree, searchValue]);

    const treeData = useMemo((): DataNode[] => toDataNodes(filteredTree, selectEntity), [filteredTree, selectEntity]);
    const allTreeKeys = useMemo(() => collectAllKeys(filteredTree), [filteredTree]);

    const handleExpandAll = useCallback(() => {
        if (viewMode === 'category') {
            setActivePanels(Object.keys(categoryData));
        } else {
            setExpandedKeys(allTreeKeys);
        }
    }, [allTreeKeys, categoryData, viewMode]);

    const handleCollapseAll = useCallback(() => {
        if (viewMode === 'category') {
            setActivePanels([]);
        } else {
            setExpandedKeys([]);
        }
    }, [viewMode]);

    React.useEffect(() => {
        if (searchValue && viewMode === 'tree') {
            setExpandedKeys(allTreeKeys);
        }
    }, [searchValue, allTreeKeys, viewMode]);

    if (loading) return <LoadingSpinner tip="Loading entities..." />;
    if (error) return <ErrorMessage message={error.message} onRetry={refresh} />;

    return (
        <div style={{ padding: '24px 32px', minHeight: 'calc(100vh - 64px)' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#f1f5f9', margin: 0 }}>Entity Tree</h1>
                    <p style={{ fontSize: '14px', color: '#94a3b8', marginTop: '4px' }}>
                        Hierarchical view of infrastructure entities
                    </p>
                </div>
                <Segmented
                    value={viewMode}
                    onChange={(value) => setViewMode(value as ViewMode)}
                    options={[
                        { value: 'tree', icon: <UnorderedListOutlined />, label: 'Tree View' },
                        { value: 'category', icon: <FolderOutlined />, label: 'Category View' },
                    ]}
                    style={{ background: '#2a2a2a' }}
                />
            </div>

            {/* Search and Controls */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'center' }}>
                <Input
                    placeholder="Search entities..."
                    prefix={<SearchOutlined style={{ color: '#64748b' }} />}
                    value={searchValue}
                    onChange={e => setSearchValue(e.target.value)}
                    style={{ flex: 1, background: '#1a1a1a', border: '1px solid #2a2a2a' }}
                    size="large"
                />
                <Button onClick={handleExpandAll} style={{ color: '#94a3b8', flexShrink: 0 }}>
                    Expand All
                </Button>
                <Button onClick={handleCollapseAll} style={{ color: '#94a3b8', flexShrink: 0 }}>
                    Collapse All
                </Button>
            </div>

            {/* Content */}
            <div style={{
                background: '#1a1a1a',
                borderRadius: '16px',
                border: '1px solid #2a2a2a',
                minHeight: '400px',
                overflow: 'hidden',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            }}>
                {viewMode === 'category' ? (
                    Object.keys(categoryData).length > 0 ? (
                        <div style={{ padding: '8px' }}>
                            {Object.entries(categoryData).map(([category, { types, total }]) => (
                                <div
                                    key={category}
                                    style={{
                                        background: '#1a1a1a',
                                        borderRadius: '12px',
                                        border: '1px solid #2a2a2a',
                                        marginBottom: '8px',
                                        overflow: 'hidden',
                                    }}
                                >
                                    <button
                                        onClick={() => {
                                            setActivePanels(prev =>
                                                prev.includes(category)
                                                    ? prev.filter(p => p !== category)
                                                    : [...prev, category]
                                            );
                                        }}
                                        style={{
                                            width: '100%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            padding: '16px 20px',
                                            background: 'transparent',
                                            border: 'none',
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                        }}
                                    >
                                        <DownOutlined
                                            style={{
                                                fontSize: '12px',
                                                color: '#64748b',
                                                transform: activePanels.includes(category) ? 'rotate(0deg)' : 'rotate(-90deg)',
                                                transition: 'transform 0.2s',
                                            }}
                                        />
                                        <span style={{ fontSize: '16px', fontWeight: 600, color: '#f1f5f9' }}>
                                            {CATEGORY_LABELS[category] || category}
                                        </span>
                                        <span style={{
                                            fontSize: '13px',
                                            fontWeight: 500,
                                            color: '#60a5fa',
                                        }}>
                                            {total}
                                        </span>
                                    </button>
                                    {activePanels.includes(category) && (
                                        <div style={{ padding: '0 20px 16px' }}>
                                            {Array.from(types.entries())
                                                .sort(([, a], [, b]) => b.length - a.length)
                                                .map(([type, entities]) => (
                                                    <div key={type} style={{ marginBottom: '20px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                                                            <EntityIcon type={type} size={16} />
                                                            <span style={{ fontWeight: 600, color: ENTITY_COLORS[type] || '#64748b', fontSize: '13px' }}>{type}</span>
                                                            <span style={{
                                                                fontSize: '12px',
                                                                fontWeight: 500,
                                                                color: '#60a5fa',
                                                                padding: '1px 8px',
                                                                borderRadius: '10px',
                                                                background: '#3b82f620',
                                                            }}>
                                                                {entities.length}
                                                            </span>
                                                        </div>
                                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', paddingLeft: '4px' }}>
                                                            {entities.map(entity => (
                                                                <button
                                                                    key={entity.id}
                                                                    onClick={() => selectEntity(entity.id)}
                                                                    style={{
                                                                        background: '#222222',
                                                                        border: '1px solid #2a2a2a',
                                                                        borderRadius: '8px',
                                                                        padding: '10px 14px',
                                                                        cursor: 'pointer',
                                                                        color: '#f1f5f9',
                                                                        fontSize: '13px',
                                                                        fontWeight: 500,
                                                                        textAlign: 'left',
                                                                        transition: 'all 0.15s',
                                                                    }}
                                                                    onMouseEnter={(e) => {
                                                                        e.currentTarget.style.background = '#2a2a3a';
                                                                        e.currentTarget.style.borderColor = '#3b82f650';
                                                                    }}
                                                                    onMouseLeave={(e) => {
                                                                        e.currentTarget.style.background = '#222222';
                                                                        e.currentTarget.style.borderColor = '#2a2a2a';
                                                                    }}
                                                                >
                                                                    {entity.name}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <Empty description="No entities found" style={{ padding: '48px' }} />
                    )
                ) : (
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
                            <Empty description="No entities found" style={{ padding: '48px' }} />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TreeView;
