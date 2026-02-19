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
                    className="tree-view__node-row"
                    onClick={(e) => {
                        if (node.entity && node.children.length === 0) {
                            e.stopPropagation();
                            selectEntity(node.entity.id);
                        }
                    }}
                >
                    <EntityIcon type={node.type as EntityType} size={16} />
                    <span className={isGroup ? 'tree-view__node-name--group' : 'tree-view__node-name'}>
                        {node.name}
                    </span>
                    {isGroup && node.count !== undefined && (
                        <span
                            className="tree-view__node-count"
                            style={{
                                backgroundColor: `${color}20`,
                                color: color,
                            }}
                        >
                            {node.count}
                        </span>
                    )}
                    {!isGroup && (
                        <span className="tree-view__node-type">
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
        <div className="tree-view">
            {/* Header */}
            <div className="tree-view__header">
                <div>
                    <h1 className="tree-view__title">Entity Tree</h1>
                    <p className="tree-view__subtitle">
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
                    className="table-view__segmented"
                />
            </div>

            {/* Search and Controls */}
            <div className="tree-view__controls">
                <Input
                    placeholder="Search entities..."
                    prefix={<SearchOutlined className="table-view__search-icon" />}
                    value={searchValue}
                    onChange={e => setSearchValue(e.target.value)}
                    className="tree-view__search"
                    size="large"
                />
                <Button onClick={handleExpandAll} className="tree-view__btn">
                    Expand All
                </Button>
                <Button onClick={handleCollapseAll} className="tree-view__btn">
                    Collapse All
                </Button>
            </div>

            {/* Content */}
            <div className="tree-view__content">
                {viewMode === 'category' ? (
                    Object.keys(categoryData).length > 0 ? (
                        <div className="tree-view__category-list">
                            {Object.entries(categoryData).map(([category, { types, total }]) => (
                                <div key={category} className="tree-view__category-card">
                                    <button
                                        onClick={() => {
                                            setActivePanels(prev =>
                                                prev.includes(category)
                                                    ? prev.filter(p => p !== category)
                                                    : [...prev, category]
                                            );
                                        }}
                                        className="tree-view__category-btn"
                                    >
                                        <DownOutlined
                                            className="tree-view__category-arrow"
                                            style={{
                                                transform: activePanels.includes(category) ? 'rotate(0deg)' : 'rotate(-90deg)',
                                            }}
                                        />
                                        <span className="tree-view__category-label">
                                            {CATEGORY_LABELS[category] || category}
                                        </span>
                                        <span className="tree-view__category-count">
                                            {total}
                                        </span>
                                    </button>
                                    {activePanels.includes(category) && (
                                        <div className="tree-view__category-body">
                                            {Array.from(types.entries())
                                                .sort(([, a], [, b]) => b.length - a.length)
                                                .map(([type, entities]) => (
                                                    <div key={type} className="tree-view__type-group">
                                                        <div className="tree-view__type-header">
                                                            <EntityIcon type={type} size={16} />
                                                            <span className="tree-view__type-label" style={{ color: ENTITY_COLORS[type] || '#64748b' }}>{type}</span>
                                                            <span className="tree-view__type-count">
                                                                {entities.length}
                                                            </span>
                                                        </div>
                                                        <div className="tree-view__entity-grid">
                                                            {entities.map(entity => (
                                                                <button
                                                                    key={entity.id}
                                                                    onClick={() => selectEntity(entity.id)}
                                                                    className="tree-view__entity-btn"
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
                        <Empty description="No entities found" className="inv-empty-padding" />
                    )
                ) : (
                    <div className="tree-view__tree-body">
                        {treeData.length > 0 ? (
                            <Tree
                                treeData={treeData}
                                expandedKeys={expandedKeys}
                                onExpand={(keys) => setExpandedKeys(keys)}
                                showLine={{ showLeafIcon: false }}
                                className="inv-tree-transparent"
                            />
                        ) : (
                            <Empty description="No entities found" className="inv-empty-padding" />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TreeView;
