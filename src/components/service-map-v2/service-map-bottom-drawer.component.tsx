import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  ReactFlowProvider,
  ReactFlow,
  Background,
  Controls,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  MarkerType,
  Position,
  useReactFlow,
  Handle
} from 'reactflow';
import 'reactflow/dist/style.css';
import { CloseOutlined, CloudServerOutlined, DatabaseOutlined, ApiOutlined, ContainerOutlined, BarChartOutlined, LineChartOutlined, ApartmentOutlined } from '@ant-design/icons';
import { Infrastructure, Service, Operation } from '../../api/service/interface.service';
import { getOperationTypeColor } from '../../api/service/services.service';
import { useNavigate } from 'react-router-dom';
import dagre from 'dagre';

interface ServiceMapBottomDrawerProps {
  infrastructure: Infrastructure | null;
  isOpen: boolean;
  onClose: () => void;
}

const ServiceNode: React.FC<{ data: Service; selected?: boolean }> = ({ data, selected }) => {
  const getStatusColor = (status?: string) => {
    const s = status?.toLowerCase();
    if (s === 'healthy' || s === 'ok') return '#10b981';
    if (s === 'warning' || s === 'degraded') return '#f59e0b';
    if (s === 'error' || s === 'critical') return '#ef4444';
    return '#6b7280';
  };

  const getTypeIcon = (type?: string) => {
    const t = type?.toLowerCase();
    if (t === 'platform') return <CloudServerOutlined />;
    if (t === 'database') return <DatabaseOutlined />;
    if (t === 'api') return <ApiOutlined />;
    if (t === 'container') return <ContainerOutlined />;
    return <CloudServerOutlined />;
  };

  const safeStatus = data?.status?.value || 'healthy';
  const safeType = data?.type || 'api';

  return (
    <div
      style={{
        background: 'linear-gradient(145deg, #1e293b, #334155)',
        border: `2px solid ${getStatusColor(safeStatus)}`,
        borderRadius: '12px',
        padding: '16px',
        minWidth: '180px',
        boxShadow: selected 
          ? `0 0 20px ${getStatusColor(safeStatus)}40` 
          : '0 4px 12px rgba(0,0,0,0.3)',
        transform: selected ? 'scale(1.05)' : 'scale(1)',
        transition: 'all 0.2s ease',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer'
      }}
    >
      {/* 3D Effect Background */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '30%',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.1), transparent)',
          borderRadius: '12px 12px 0 0'
        }}
      />
      
      {/* Status Indicator */}
      <div
        style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: getStatusColor(safeStatus),
          boxShadow: `0 0 8px ${getStatusColor(safeStatus)}`
        }}
      />
      
      {/* Node Content */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <div style={{ color: getStatusColor(safeStatus), fontSize: '16px' }}>
            {getTypeIcon(safeType)}
          </div>
          <div style={{ color: '#ffffff', fontWeight: 'bold', fontSize: '14px' }}>
            {data?.name}
          </div>
        </div>
        
        {/* Metrics */}
        {data?.metrics && (
          <div
            style={{
              marginTop: '10px',
              paddingTop: '8px',
              borderTop: '1px solid rgba(255,255,255,0.06)'
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              <div>
                <div style={{ color: '#94a3b8', fontSize: '10px' }}>Avg. Lat</div>
                <div style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '12px' }}>
                  {data.metrics.avgDurationMs?.toFixed(2) ?? 0} ms
                </div>
              </div>
              <div>
                <div style={{ color: '#94a3b8', fontSize: '10px' }}>Min. Lat</div>
                <div style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '12px' }}>
                  {data.metrics.minDurationMs?.toFixed(2) ?? 0} ms
                </div>
              </div>
              <div>
                <div style={{ color: '#94a3b8', fontSize: '10px' }}>Max. Lat</div>
                <div style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '12px' }}>
                  {data.metrics.maxDurationMs?.toFixed(2) ?? 0} ms
                </div>
              </div>
              <div>
                <div style={{ color: '#94a3b8', fontSize: '10px' }}>Calls</div>
                <div style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '12px' }}>
                  {data.metrics.callsCount ?? 0}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Handles */}
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: getStatusColor(safeStatus), border: 'none' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: getStatusColor(safeStatus), border: 'none' }}
      />
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: getStatusColor(safeStatus), border: 'none' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: getStatusColor(safeStatus), border: 'none' }}
      />
    </div>
  );
};

const nodeTypes = {
  service: ServiceNode
};

const ServiceDetailPanel: React.FC<{ 
  data: Service | null;
  onClose: () => void;
}> = ({ data, onClose }) => {
  const navigate = useNavigate();
  
  if (!data) return null;

  const statusColor = (status?: string) => {
    const s = status?.toLowerCase();
    if (s === 'healthy' || s === 'ok') return '#22c55e';
    if (s === 'warning' || s === 'degraded') return '#f59e0b';
    if (s === 'error') return '#ef4444';
    return '#6b7280';
  };

  const handleNavigateToLogs = () => {
    navigate(`/a/iyzitrace-app/logs?serviceName=${encodeURIComponent(data.name)}&serviceNameOperator=%3D&option_limit=100&option_interval=5m&option_pageCount=20&option_orderBy=timestamp&option_orderDirection=desc`);
  };

  const handleNavigateToMetrics = () => {
    navigate(`/a/iyzitrace-app/services/${encodeURIComponent(data.name)}`);
  };

  const handleNavigateToTraces = () => {
    navigate(`/a/iyzitrace-app/traces?serviceName=${encodeURIComponent(data.name)}&serviceNameOperator=%3D&option_limit=100&option_interval=5m&option_pageCount=20&option_orderBy=traceId&option_orderDirection=desc`);
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: '12px',
        top: '12px',
        width: '350px',
        background: 'rgba(30, 41, 59, 0.95)',
        border: '1px solid #334155',
        borderRadius: '12px',
        padding: '20px',
        color: '#ffffff',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        backdropFilter: 'blur(10px)',
        maxHeight: '700px',
        zIndex: 1000
      }}
    >
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px',
        paddingBottom: '12px',
        borderBottom: '1px solid #334155'
      }}>
        <div>
          <h3 style={{ 
            color: '#ffffff', 
            margin: 0, 
            fontSize: '16px',
            fontWeight: 'bold'
          }}>
            {data.name}
          </h3>
          <div style={{
            background: '#64748b',
            color: '#ffffff',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '10px',
            marginTop: '4px',
            display: 'inline-block'
          }}>
            SERVICE
          </div>
        </div>
      </div>

      {/* Service Info & Metrics */}
      <div style={{ marginBottom: '16px', display: 'flex', gap: '16px' }}>
        <div style={{ flex: 1 }}>
          <h4 style={{ color: '#ffffff', margin: '0 0 8px 0', fontSize: '14px' }}>Service Info</h4>
          <div style={{ color: '#94a3b8', fontSize: '12px', lineHeight: '1.4' }}>
            <div><strong>Name:</strong> {data.name || 'N/A'}</div>
            <div><strong>Type:</strong> {data.type || 'UNKNOWN'}</div>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <h4 style={{ color: '#ffffff', margin: '0 0 8px 0', fontSize: '14px' }}>Metrics</h4>
          <div style={{ color: '#94a3b8', fontSize: '12px', lineHeight: '1.4' }}>
            <div><strong>Avg Lat:</strong> {data.metrics?.avgDurationMs?.toFixed(2) ?? '0.00'} ms</div>
            <div><strong>Min Lat:</strong> {data.metrics?.minDurationMs?.toFixed(2) ?? '0.00'} ms</div>
            <div><strong>Max Lat:</strong> {data.metrics?.maxDurationMs?.toFixed(2) ?? '0.00'} ms</div>
          </div>
        </div>
      </div>

      {/* Status */}
      <div style={{ 
        marginBottom: '20px',
        padding: '12px',
        background: statusColor(data.status?.value),
        border: `1px solid ${statusColor(data.status?.value)}`,
        borderRadius: '8px'
      }}>
        <div style={{ 
          color: '#ffffff', 
          fontWeight: 'bold',
          fontSize: '14px',
          marginBottom: '4px'
        }}>
          {data.status?.value?.toUpperCase() || 'UNKNOWN'}
        </div>
        <div style={{ color: '#ffffff', fontSize: '12px', opacity: 0.8 }}>
          System status monitoring active
        </div>
      </div>

      {/* Operations */}
      {data.operations && data.operations.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h4 
            style={{ 
              color: '#3b82f6', 
              margin: '0 0 12px 0', 
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            Operations
          </h4>
          <div style={{ 
            background: 'rgba(15, 23, 42, 0.8)',
            padding: '12px',
            borderRadius: '8px',
            maxHeight: '200px',
            overflowY: 'auto'
          }}>
            {data.operations.map((op: Operation, idx: number) => {
              const typeColor = getOperationTypeColor(op.type || 'GENERAL');
              
              return (
                <div 
                  key={idx}
                  style={{ 
                    borderBottom: idx < data.operations!.length - 1 ? '1px solid #334155' : 'none',
                    paddingBottom: idx < data.operations!.length - 1 ? 12 : 0,
                    marginBottom: idx < data.operations!.length - 1 ? 12 : 0
                  }}
                >
                  <div style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '8px'
                  }}>
                    <span style={{
                      background: typeColor === 'blue' ? '#3b82f6' :
                                  typeColor === 'green' ? '#22c55e' :
                                  typeColor === 'orange' ? '#f59e0b' :
                                  typeColor === 'purple' ? '#a855f7' :
                                  typeColor === 'red' ? '#ef4444' :
                                  typeColor === 'yellow' ? '#eab308' :
                                  '#6b7280',
                      color: '#ffffff',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      {op.type || 'GENERAL'}
                    </span>
                    {op.method && (
                      <span style={{
                        background: 'rgba(59, 130, 246, 0.2)',
                        color: '#60a5fa',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: '600',
                        border: '1px solid rgba(59, 130, 246, 0.3)'
                      }}>
                        {op.method}
                      </span>
                    )}
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '6px', fontWeight: 500 }}>
                    {op.name}
                  </div>
                  <div style={{ 
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '8px',
                    fontSize: '11px'
                  }}>
                    <div>
                      <span style={{ color: '#94a3b8' }}>Avg Lat: </span>
                      <span style={{ color: '#e2e8f0', fontWeight: 500 }}>
                        {op.metrics?.avgDurationMs?.toFixed(2) ?? 0}ms
                      </span>
                    </div>
                    <div>
                      <span style={{ color: '#94a3b8' }}>P95 Lat: </span>
                      <span style={{ color: '#e2e8f0', fontWeight: 500 }}>
                        {op.metrics?.p95DurationMs?.toFixed(2) ?? 0}ms
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Navigation Links */}
      <div style={{ 
        display: 'flex', 
        gap: '8px',
        marginTop: '16px',
        paddingTop: '16px',
        borderTop: '1px solid #334155'
      }}>
        <button 
          onClick={handleNavigateToLogs}
          style={{
            flex: 1,
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '8px',
            padding: '10px 12px',
            color: '#60a5fa',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)';
            e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
            e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
          }}
        >
          <BarChartOutlined style={{ fontSize: '14px' }} />
          Logs
        </button>
        <button 
          onClick={handleNavigateToMetrics}
          style={{
            flex: 1,
            background: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: '8px',
            padding: '10px 12px',
            color: '#4ade80',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(34, 197, 94, 0.2)';
            e.currentTarget.style.borderColor = 'rgba(34, 197, 94, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(34, 197, 94, 0.1)';
            e.currentTarget.style.borderColor = 'rgba(34, 197, 94, 0.3)';
          }}
        >
          <LineChartOutlined style={{ fontSize: '14px' }} />
          Metrics
        </button>
        <button 
          onClick={handleNavigateToTraces}
          style={{
            flex: 1,
            background: 'rgba(168, 85, 247, 0.1)',
            border: '1px solid rgba(168, 85, 247, 0.3)',
            borderRadius: '8px',
            padding: '10px 12px',
            color: '#c084fc',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(168, 85, 247, 0.2)';
            e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(168, 85, 247, 0.1)';
            e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.3)';
          }}
        >
          <ApartmentOutlined style={{ fontSize: '14px' }} />
          Traces
        </button>
      </div>
    </div>
  );
};

// Get edge color based on avgDuration (gradient from green to red with more variations)
const getEdgeColor = (avgDurationMs: number, maxDuration: number): string => {
  if (maxDuration === 0) return '#6b7280';
  
  const ratio = avgDurationMs / maxDuration;
  
  // Red (slow) to Green (fast) gradient with more color steps
  // 0 (fast) -> dark green, max (slow) -> dark red
  const invertedRatio = 1 - ratio;
  
  if (invertedRatio > 0.85) return '#059669'; // Dark Green (Very Fast)
  if (invertedRatio > 0.70) return '#10b981'; // Green (Fast)
  if (invertedRatio > 0.60) return '#22c55e'; // Light Green (Good)
  if (invertedRatio > 0.50) return '#84cc16'; // Yellow-Green (Ok)
  if (invertedRatio > 0.40) return '#facc15'; // Yellow (Medium)
  if (invertedRatio > 0.30) return '#fbbf24'; // Light Yellow (Warning)
  if (invertedRatio > 0.20) return '#f59e0b'; // Orange (Slow)
  if (invertedRatio > 0.10) return '#f97316'; // Dark Orange (Very Slow)
  if (invertedRatio > 0.05) return '#ea580c'; // Red-Orange (Critical)
  return '#dc2626'; // Dark Red (Extremely Slow)
};

// Get animation speed based on duration (much more noticeable difference)
const getAnimationDuration = (avgDurationMs: number, maxDuration: number): number => {
  if (maxDuration === 0) return 3;
  
  const ratio = avgDurationMs / maxDuration;
  
  // Very Fast services: 0.3s (super fast animation - very responsive)
  // Fast services: 0.5-1s (quick animation)
  // Medium services: 2-4s (moderate animation)
  // Slow services: 6-8s (slow animation)
  // Very Slow services: 10-12s (very slow animation - almost crawling)
  
  if (ratio < 0.1) return 0.3;  // Very fast (0-10% of max)
  if (ratio < 0.3) return 0.8;  // Fast (10-30% of max)
  if (ratio < 0.5) return 2;    // Medium-Fast (30-50% of max)
  if (ratio < 0.7) return 4;    // Medium-Slow (50-70% of max)
  if (ratio < 0.85) return 7;   // Slow (70-85% of max)
  return 10;                     // Very Slow (85-100% of max)
};

const ServiceMapBottomDrawerInner: React.FC<ServiceMapBottomDrawerProps> = ({
  infrastructure,
  isOpen,
  onClose
}) => {
  const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
  const [height, setHeight] = useState(Math.floor(windowHeight * 0.75));
  const [isDragging, setIsDragging] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const { fitView } = useReactFlow();

  // Build nodes and edges from services and operations
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    if (!infrastructure?.services) {
      return { nodes: [], edges: [] };
    }

    const services = infrastructure.services as Service[];
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const serviceMap = new Map<string, Service>();

    // Create service nodes
    services.forEach((service) => {
      serviceMap.set(service.id, service);
      nodes.push({
        id: service.id,
        type: 'service',
        data: { 
          ...service,
          selected: selectedService?.id === service.id 
        },
        position: { x: 0, y: 0 }, // Will be calculated by dagre
        sourcePosition: Position.Right,
        targetPosition: Position.Left
      });
    });

    // Find max duration for normalization
    let max = 0;
    services.forEach((service: Service) => {
      service.operations?.forEach((operation: Operation) => {
        if (operation.metrics?.avgDurationMs) {
          max = Math.max(max, operation.metrics.avgDurationMs);
        }
      });
    });

    // Create edges from operations
    services.forEach((service: Service) => {
      service.targetServiceIds?.forEach((targetServiceId: string) => {
        if (targetServiceId && serviceMap.has(targetServiceId)) {
          const operations = (service.operations || []) as Operation[];
          const totalDuration = operations.reduce((acc: number, op: Operation) => acc + (op.metrics?.avgDurationMs || 0), 0);
          const operationsCount = operations.length || 1;
          const avgDuration = totalDuration / operationsCount;
          
          // Find the most frequent operation type
          const typeCounts: Record<string, number> = {};
          operations.forEach(op => {
            const t = op.type || 'HTTP';
            typeCounts[t] = (typeCounts[t] || 0) + 1;
          });
          
          let type = 'HTTP';
          let maxCount = 0;
          Object.entries(typeCounts).forEach(([t, count]) => {
            if (count > maxCount) {
              maxCount = count;
              type = t;
            }
          });

          const edgeColor = getEdgeColor(avgDuration, max);
          const animDuration = getAnimationDuration(avgDuration, max);

          edges.push({
            id: `${service.id}-${targetServiceId}`,
            source: service.id,
            target: targetServiceId,
            animated: true,
            style: {
              stroke: edgeColor,
              strokeWidth: 2,
              strokeDasharray: '5 5',
              animation: `dashdraw ${animDuration}s linear infinite`
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: edgeColor,
              width: 20,
              height: 20
            },
            label: type,
            labelStyle: {
              fill: '#e5e7eb',
              fontSize: 10,
              fontWeight: 500
            },
            labelBgStyle: {
              fill: '#1e293b',
              fillOpacity: 0.9
            }
          });
        }
      });
    });

    return { nodes, edges };
  }, [infrastructure, selectedService]);

  // Auto-layout with dagre
  const layoutedNodes = useMemo(() => {
    if (initialNodes.length === 0) return initialNodes;

    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({ rankdir: 'LR', nodesep: 100, ranksep: 150 });

    initialNodes.forEach((node) => {
      dagreGraph.setNode(node.id, { width: 180, height: 80 });
    });

    initialEdges.forEach((edge) => {
      dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    return initialNodes.map((node) => {
      const nodeWithPosition = dagreGraph.node(node.id);
      return {
        ...node,
        position: {
          x: nodeWithPosition.x - 90,
          y: nodeWithPosition.y - 40
        }
      };
    });
  }, [initialNodes, initialEdges]);

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    setNodes(layoutedNodes);
    setEdges(initialEdges);
  }, [layoutedNodes, initialEdges, setNodes, setEdges]);

  const handleMouseDown = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging) {
        const newHeight = window.innerHeight - e.clientY;
        setHeight(Math.max(200, Math.min(800, newHeight)));
      }
    },
    [isDragging]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
    return undefined;
  }, [isDragging, handleMouseMove, handleMouseUp]);

  if (!isOpen) return null;

  return (
    <>
      <style>{`
        @keyframes dashdraw {
          from {
            stroke-dashoffset: 10;
          }
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: `${height}px`,
          background: '#0f172a',
          borderTop: '2px solid #334155',
          zIndex: 1001,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Resize Handle */}
        <div
          onMouseDown={handleMouseDown}
          style={{
            height: '8px',
            background: isDragging ? '#3b82f6' : '#334155',
            cursor: 'ns-resize',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.2s ease'
          }}
        >
          <div style={{ 
            width: '40px', 
            height: '4px', 
            background: isDragging ? '#60a5fa' : '#475569',
            borderRadius: '2px'
          }} />
        </div>

        {/* Header */}
        <div
          style={{
            padding: '12px 20px',
            borderBottom: '1px solid #334155',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#1e293b'
          }}
        >
          <div>
            <h3 style={{ margin: 0, color: '#ffffff', fontSize: '16px', fontWeight: 'bold' }}>
              Service Map - {infrastructure?.name}
            </h3>
            <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '4px' }}>
              {nodes.length} services, {edges.length} connections
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid #ef4444',
              borderRadius: '6px',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#ef4444'
            }}
          >
            <CloseOutlined />
          </button>
        </div>

        {/* ReactFlow */}
        <div style={{ flex: 1, position: 'relative' }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            style={{ background: '#0f172a' }}
            onNodeClick={(event, node) => {
              const services = infrastructure?.services as Service[] | undefined;
              const service = services?.find(s => s.id === node.id);
              if (service) {
                setSelectedService(service);
              }
            }}
            onPaneClick={() => {
              setSelectedService(null);
              setTimeout(() => {
                fitView({ padding: 0.2, duration: 500 });
              }, 100);
            }}
          >
            <Background color="#1f2937" gap={20} />
            <Controls
              style={{
                background: '#1f2937',
                border: '1px solid #374151'
              }}
            />
          </ReactFlow>
          
          {/* Service Detail Panel */}
          {selectedService && (
            <ServiceDetailPanel 
              data={selectedService}
              onClose={() => setSelectedService(null)}
            />
          )}
        </div>
      </div>
    </>
  );
};

export const ServiceMapBottomDrawer: React.FC<ServiceMapBottomDrawerProps> = (props) => {
  return (
    <ReactFlowProvider>
      <ServiceMapBottomDrawerInner {...props} />
    </ReactFlowProvider>
  );
};

