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
import 'reactflow/dist/style.css';

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
                        color: '#f1f5f9',
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
                style: { stroke: '#475569', strokeWidth: 1 },
                markerEnd: {
                    type: MarkerType.ArrowClosed,
                    color: '#475569',
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
            style={{ background: '#111111' }}
        >
            <Background color="#2a2a2a" gap={20} size={1} />
            <Controls style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px' }} />
            <MiniMap
                style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px' }}
                nodeColor={(n) => {
                    const type = n.data?.type as EntityType;
                    return getNodeColor(type);
                }}
                maskColor="rgba(0, 0, 0, 0.3)"
            />

            <Panel position="top-left" style={{
                background: 'rgba(26, 26, 26, 0.9)',
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid #2a2a2a',
                margin: '16px',
            }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', color: '#94a3b8' }}>
                    <span><span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b', marginRight: '6px' }} />Region</span>
                    <span><span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6', marginRight: '6px' }} />Host</span>
                    <span><span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#ec4899', marginRight: '6px' }} />Service</span>
                    <span><span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', marginRight: '6px' }} />Database</span>
                    <span><span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#f97316', marginRight: '6px' }} />Messaging</span>
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
            <div style={{ padding: '24px', background: '#1a1a1a', minHeight: 'calc(100vh - 64px)' }}>
                <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#f1f5f9', margin: 0 }}>Infrastructure Topology</h1>
                <p style={{ fontSize: '14px', color: '#94a3b8', marginTop: '8px' }}>No topology data available</p>
            </div>
        );
    }

    return (
        <div style={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column', background: '#111111', color: '#fff', overflow: 'hidden' }}>
            {/* Header Panel */}
            <div style={{
                background: 'rgba(26, 26, 26, 0.95)',
                borderBottom: '1px solid #2a2a2a',
                padding: '16px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                zIndex: 10,
                backdropFilter: 'blur(8px)',
            }}>
                <div>
                    <h1 style={{
                        fontSize: '20px',
                        fontWeight: 700,
                        margin: 0,
                        background: 'linear-gradient(to right, #60a5fa, #818cf8)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>
                        Infrastructure Topology
                    </h1>
                    <p style={{ fontSize: '12px', color: '#64748b', fontWeight: 500, marginTop: '4px' }}>
                        {topology.nodes.length} nodes · {topology.edges.length} edges
                        {topology.nodes.length > 200 && ' (showing first 200)'}
                    </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Input
                        placeholder="Filter nodes..."
                        prefix={<SearchOutlined style={{ color: '#64748b' }} />}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            width: '200px',
                            background: '#1a1a1a',
                            border: '1px solid #2a2a2a',
                            borderRadius: '9999px',
                            color: '#f1f5f9',
                        }}
                    />
                    <button
                        onClick={refresh}
                        style={{
                            padding: '8px',
                            background: 'transparent',
                            border: 'none',
                            borderRadius: '9999px',
                            color: '#94a3b8',
                            cursor: 'pointer',
                        }}
                        title="Refresh"
                    >
                        <ReloadOutlined style={{ fontSize: '16px' }} />
                    </button>
                </div>
            </div>

            {/* React Flow Canvas */}
            <div style={{ flex: 1 }}>
                <ReactFlowProvider>
                    <TopologyGraph topology={topology} onNodeClick={handleNodeClick} searchQuery={searchQuery} />
                </ReactFlowProvider>
            </div>
        </div>
    );
};

export default TopologyView;
