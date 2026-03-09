import '../../assets/styles/vendor/xyflow.styles';
import React, { useCallback, useState, useEffect, useMemo } from 'react';
import ReactFlow, {
    Node,
    Edge,
    Controls,
    Background,
    MiniMap,
    useNodesState,
    useEdgesState,
    MarkerType,
    Panel,
    ReactFlowProvider,
} from 'reactflow';
import { Input } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';

import { useTopology } from '../hooks/useInventory';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { useNavigation } from '../components/NavigationContext';
import { ENTITY_COLORS } from '../types/inventory';
import type { TopologyNode as InventoryNode, TopologyEdge, EntityType } from '../types/inventory';

interface TopologyGraphProps {
    topology: { nodes: InventoryNode[]; edges: TopologyEdge[] };
    onNodeClick: (nodeId: string) => void;
    searchQuery: string;
}

const getNodeColor = (type: EntityType): string => {
    return ENTITY_COLORS[type] || '#64748b';
};

const getNodeCategory = (type: EntityType): string => {
    if (type === 'cloud.region') return 'region';
    if (type === 'host') return 'host';
    if (['service', 'k8s.deployment', 'k8s.pod', 'k8s.container'].some(t => type.includes(t))) return 'service';
    if (['db.instance', 'db.database', 'cache.instance'].some(t => type.includes(t))) return 'database';
    if (['messaging.system', 'messaging.destination'].some(t => type.includes(t))) return 'messaging';
    return 'other';
};

const TopologyGraph: React.FC<TopologyGraphProps> = ({ topology, onNodeClick, searchQuery }) => {
    const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

    useEffect(() => {
        if (!topology) return;

        // Filter nodes by search
        let filteredNodes = topology.nodes;
        if (searchQuery) {
            filteredNodes = topology.nodes.filter(n =>
                n.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                n.type.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Limit to first 200 nodes for performance
        const limitedNodes = filteredNodes.slice(0, 200);
        const nodeIds = new Set(limitedNodes.map(n => n.id));

        // Create nodes with grid layout grouped by category
        const categoryOrder = ['region', 'host', 'service', 'database', 'messaging', 'other'];
        const nodesByCategory = new Map<string, InventoryNode[]>();

        limitedNodes.forEach(node => {
            const category = getNodeCategory(node.type);
            if (!nodesByCategory.has(category)) {
                nodesByCategory.set(category, []);
            }
            nodesByCategory.get(category)!.push(node);
        });

        const rfNodes: Node[] = [];
        let yOffset = 0;
        const xSpacing = 220;
        const ySpacing = 100;
        const nodesPerRow = 6;

        categoryOrder.forEach(category => {
            const categoryNodes = nodesByCategory.get(category) || [];
            if (categoryNodes.length === 0) return;

            categoryNodes.forEach((node, index) => {
                const row = Math.floor(index / nodesPerRow);
                const col = index % nodesPerRow;
                const color = getNodeColor(node.type);

                rfNodes.push({
                    id: node.id,
                    data: {
                        label: node.name,
                        type: node.type,
                    },
                    position: {
                        x: col * xSpacing + 50,
                        y: yOffset + row * ySpacing + 50
                    },
                    style: {
                        background: `${color}20`,
                        border: `2px solid ${color}`,
                        borderRadius: '8px',
                        padding: '8px 12px',
                        color: 'var(--text-primary)',
                        fontSize: '11px',
                        fontWeight: 600,
                        minWidth: '180px',
                        maxWidth: '200px',
                        textAlign: 'center' as const,
                        cursor: 'pointer',
                    },
                });
            });

            const rows = Math.ceil(categoryNodes.length / nodesPerRow);
            yOffset += rows * ySpacing + 60;
        });

        // Create edges (only between visible nodes)
        const rfEdges: Edge[] = topology.edges
            .filter(edge => nodeIds.has(edge.from) && nodeIds.has(edge.to))
            .slice(0, 300) // Limit edges for performance
            .map((edge, index) => ({
                id: `e${index}`,
                source: edge.from,
                target: edge.to,
                animated: false,
                style: { stroke: 'var(--border-strong)', strokeWidth: 1 },
                markerEnd: {
                    type: MarkerType.ArrowClosed,
                    color: 'var(--border-strong)',
                    width: 12,
                    height: 12,
                },
            }));

        setNodes(rfNodes);
        setEdges(rfEdges);
    }, [topology, searchQuery, setNodes, setEdges]);

    const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
        onNodeClick(node.id);
    }, [onNodeClick]);

    return (
        <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={handleNodeClick}
            fitView
            fitViewOptions={{ padding: 0.1 }}
            minZoom={0.1}
            maxZoom={2}
            defaultEdgeOptions={{
                type: 'smoothstep',
                style: { stroke: '#475569', strokeWidth: 1 },
            }}
            className="inv-topology-bg"
        >
            <Background color="#2a2a2a" gap={20} size={1} />
            <Controls className="topology-view__controls" />
            <MiniMap
                className="topology-view__minimap"
                nodeColor={(n) => {
                    const type = n.data?.type as EntityType;
                    return getNodeColor(type);
                }}
                maskColor="rgba(0, 0, 0, 0.3)"
            />

            <Panel position="top-left" className="topology-view__legend">
                <div className="topology-view__legend-items">
                    <span><span className="topology-view__legend-dot topology-view__legend-dot--region" />Region</span>
                    <span><span className="topology-view__legend-dot topology-view__legend-dot--host" />Host</span>
                    <span><span className="topology-view__legend-dot topology-view__legend-dot--service" />Service</span>
                    <span><span className="topology-view__legend-dot topology-view__legend-dot--database" />Database</span>
                    <span><span className="topology-view__legend-dot topology-view__legend-dot--messaging" />Messaging</span>
                </div>
            </Panel>
        </ReactFlow>
    );
};

const TopologyView: React.FC = () => {
    const { topology, loading, error, refresh } = useTopology();
    const { selectEntity } = useNavigation();
    const [searchQuery, setSearchQuery] = useState('');

    const handleNodeClick = useCallback((nodeId: string) => {
        selectEntity(nodeId);
    }, [selectEntity]);

    if (loading) {
        return <LoadingSpinner tip="Building infrastructure graph..." />;
    }

    if (error) {
        return <ErrorMessage message={error.message} onRetry={refresh} />;
    }

    if (!topology || topology.nodes.length === 0) {
        return (
            <div className="topology-view__empty">
                <h1 className="topology-view__empty-title">Infrastructure Topology</h1>
                <p className="topology-view__empty-text">No topology data available</p>
            </div>
        );
    }

    return (
        <div className="topology-view">
            {/* Header Panel */}
            <div className="topology-view__header">
                <div>
                    <h1 className="topology-view__title">
                        Infrastructure Topology
                    </h1>
                    <p className="topology-view__info">
                        {topology.nodes.length} nodes · {topology.edges.length} edges
                        {topology.nodes.length > 200 && ' (showing first 200)'}
                    </p>
                </div>

                <div className="topology-view__actions">
                    <Input
                        placeholder="Filter nodes..."
                        prefix={<SearchOutlined className="topology-view__search-icon" />}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="topology-view__search"
                    />
                    <button onClick={refresh} className="topology-view__refresh-btn" title="Refresh">
                        <ReloadOutlined className="topology-view__refresh-icon" />
                    </button>
                </div>
            </div>

            {/* React Flow Canvas */}
            <div className="topology-view__canvas">
                <ReactFlowProvider>
                    <TopologyGraph topology={topology} onNodeClick={handleNodeClick} searchQuery={searchQuery} />
                </ReactFlowProvider>
            </div>
        </div>
    );
};

export default TopologyView;
