import React, { useEffect, useState, useCallback } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap, 
  Edge, 
  Node,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  Position,
  MarkerType,
  Handle
} from 'reactflow';
import 'reactflow/dist/style.css';
import './ServiceMap.styles.css';
import { Skeleton, Alert, Space, Button, Tooltip, Badge } from 'antd';
import { 
  ReloadOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import BaseContainer from '../../components/core/basecontainer/basecontainer';
import { getDataSourceSrv } from '@grafana/runtime';
import { DataFrame, TimeRange, DataQueryRequest, dateTime, CoreApp } from '@grafana/data';
import { lastValueFrom } from 'rxjs';

// Tempo Service Map Query interface
interface TempoServiceMapQuery {
  refId: string;
  queryType: 'serviceMap';
  serviceMapQuery?: string;
  serviceMapIncludeNamespace?: boolean;
  serviceMapUseNativeHistograms?: boolean;
}

// Service Map Node data structure
interface ServiceMapNode {
  id: string;
  title: string;
  subtitle?: string;
  mainStat: number;        // Average response time (ms)
  secondaryStat: number;   // Requests per second
  successRate: number;     // Success percentage
  errorRate: number;       // Error percentage
}

// Custom Node Component  
const ServiceNode: React.FC<{ data: ServiceMapNode & { onNodeClick?: (node: ServiceMapNode) => void } }> = ({ data }) => {

  const formatNumber = (num: number, unit?: string) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k${unit || ''}`;
    }
    return `${num.toFixed(1)}${unit || ''}`;
  };

  const handleNodeClick = () => {
    if (data.onNodeClick) {
      data.onNodeClick(data);
    }
  };

  // Determine border color based on success rate (4th image style)
  const getBorderColor = () => {
    if (data.successRate >= 95) return '#4CAF50'; // Green
    if (data.successRate >= 85) return '#FF9800'; // Orange  
    return '#f44336'; // Red
  };

  return (
    <div 
      onClick={handleNodeClick}
      style={{
        backgroundColor: '#1e1e1e', // Dark background like 4th image
        border: `2px solid ${getBorderColor()}`,
        borderRadius: '8px',
        padding: '12px',
        minWidth: '200px',
        maxWidth: '240px',
        color: '#ffffff',
        cursor: 'pointer',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        position: 'relative',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
      }}
    >
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
      
      {/* Service Title - Centered like 4th image */}
      <div style={{
        fontSize: '12px',
        fontWeight: '600',
        color: '#ffffff',
        textAlign: 'center',
        marginBottom: '8px',
        textOverflow: 'ellipsis',
        overflow: 'hidden',
        whiteSpace: 'nowrap'
      }}>
        {data.title}
      </div>

      {/* Metrics with icons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 11, color: '#d0d0d0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <ClockCircleOutlined style={{ color: '#a0a0ff' }} />
          <span>{formatNumber(data.mainStat, ' ms/r')}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <ThunderboltOutlined style={{ color: '#ffd166' }} />
          <span>{formatNumber(data.secondaryStat, ' r/sec')}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <CheckCircleOutlined style={{ color: '#4CAF50' }} />
          <span>{formatNumber(data.successRate, ' %')}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <CloseCircleOutlined style={{ color: '#f44336' }} />
          <span>{formatNumber(data.errorRate, ' %')}</span>
        </div>
      </div>
    </div>
  );
};

// **PLUGIN API ONLY** - Pure Plugin API approach (expected to have limitations)
const queryTempoServiceMapPluginAPI = async (): Promise<{ nodes: Node[]; edges: Edge[] }> => {
  try {
    console.log('🔧 [Plugin API] Getting Tempo datasource via Plugin API only...');
    
    // Pure Plugin API approach - NO HTTP API bypass
    const tempoDS = await getDataSourceSrv().get('tempo');
    
    if (!tempoDS) {
      throw new Error('[Plugin API] Tempo datasource not found');
    }
    
    console.log('[Plugin API] Tempo datasource:', {
      name: tempoDS.name,
      type: tempoDS.type,
      hasQuery: typeof tempoDS.query === 'function',
      jsonData: (tempoDS as any).jsonData // Expected to be undefined
    });

    const timeRange: TimeRange = {
      from: dateTime(Date.now() - 60 * 60 * 1000),
      to: dateTime(Date.now()),
      raw: {
        from: 'now-1h',
        to: 'now'
      }
    };

    const query: TempoServiceMapQuery = {
      refId: 'A',
      queryType: 'serviceMap',
      serviceMapQuery: '',
      serviceMapIncludeNamespace: true,
      serviceMapUseNativeHistograms: false,
    };

    const request: DataQueryRequest = {
      app: CoreApp.Explore,
      dashboardUID: '',
      requestId: `tempo-servicemap-${Date.now()}`,
      timezone: 'browser',
      panelId: 1,
      interval: '30s',
      intervalMs: 30000,
      targets: [query],
      range: timeRange,
      startTime: Date.now(),
      scopedVars: {}
    };

    console.log('[Plugin API] Executing Tempo query...', request);

    // Execute the query
    let response;
    const queryResult = tempoDS.query(request);
    if (queryResult && typeof (queryResult as any).then === 'function') {
      response = await queryResult as { data?: DataFrame[] };
    } else {
      response = await lastValueFrom(queryResult as any) as { data?: DataFrame[] };
    }

    console.log('[Plugin API] Query response:', response);

    if (!response?.data?.length) {
      throw new Error('[Plugin API] No data returned from Tempo service map query');
    }

    return convertDataFramesToGraph(response.data);

  } catch (error) {
    console.error('❌ [Plugin API] Tempo service map query failed:', error);
    throw new Error(`Plugin API Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Convert DataFrame response to ReactFlow graph
const convertDataFramesToGraph = (dataFrames: DataFrame[]): { nodes: Node[]; edges: Edge[] } => {
  const safeStringify = (value: any) => {
    const seen = new WeakSet();
    const replacer = (_key: string, val: any) => {
      if (typeof val === 'bigint') { return Number(val); }
      if (val && typeof val === 'object') {
        if (seen.has(val)) { return '[Circular]'; }
        seen.add(val);
        if (val instanceof Map) { return Object.fromEntries(val as any); }
        if (val instanceof Set) { return Array.from(val as any); }
      }
      return val;
    };
    try { return JSON.stringify(value, replacer, 2); } catch { return '[Unserializable]'; }
  };

  console.log('🔄 Converting DataFrames to graph (raw object):', dataFrames);
  try {
    // Log as string to share easily
    // Note: This avoids circular refs and BigInt issues
    // eslint-disable-next-line no-console
    console.log('🔄 Converting DataFrames to graph (stringified):\n' + safeStringify(dataFrames));
  } catch (e) {
    console.log('Stringify failed:', e);
  }
  
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  
  dataFrames.forEach((frame: any) => {
    // Prefer Grafana NodeGraph "Nodes" frame if present
    const titleField = frame.fields.find((f: any) => f.name === 'title');
    const avgField = frame.fields.find((f: any) => f.name === 'mainstat');
    const rpsField = frame.fields.find((f: any) => f.name === 'secondarystat');
    const successArcField = frame.fields.find((f: any) => f.name === 'arc__success');
    const failedArcField = frame.fields.find((f: any) => f.name === 'arc__failed');

    if (titleField?.values && (avgField?.values || rpsField?.values)) {
      titleField.values.forEach((service: string, i: number) => {
        const latencyMs = Number(avgField?.values?.[i] ?? 0);
        const rps = Number(rpsField?.values?.[i] ?? 0);
        const failed = Number(failedArcField?.values?.[i] ?? 0);
        const success = Number(successArcField?.values?.[i] ?? (failed ? 1 - failed : 1));
        const successRate = Math.max(0, Math.min(100, (success > 1 ? success : success * 100)));
        const errorRate = Math.max(0, 100 - successRate);

        nodes.push({
          id: service,
          type: 'serviceNode',
          position: {
            x: (i % 4) * 220 + 50,
            y: Math.floor(i / 4) * 180 + 50
          },
          data: {
            id: service,
            title: service,
            mainStat: latencyMs,
            secondaryStat: rps,
            successRate,
            errorRate,
            onNodeClick: () => console.log('[Plugin API] Node clicked:', service)
          } as ServiceMapNode
        });
      });
      return; // handled as Nodes frame
    }

    // const nameField = frame.fields.find((f: any) => f.name === 'Name');
    // const rateField = frame.fields.find((f: any) => f.name === 'Rate');
    // const errField = frame.fields.find((f: any) => f.name === 'Error Rate');
    // const durField = frame.fields.find((f: any) => f.name === 'Duration (p90)');
    // const linksField = frame.fields.find((f: any) => f.name === 'Links');
    // if (nameField?.values) {
    //   nameField.values.forEach((service: string, i: number) => {
    //     const rps = Number(rateField?.values?.[i] ?? 0);
    //     const err = Number(errField?.values?.[i] ?? 0);
    //     const latencySec = Number(durField?.values?.[i] ?? 0);
    //     const latencyMs = latencySec * 1000;
    //     const successRate = Math.max(0, 100 - err * 100);
    //     const errorRate = 100 - successRate;

    //     nodes.push({
    //       id: service,
    //       type: 'serviceNode',
    //       position: {
    //         x: (i % 4) * 220 + 50,
    //         y: Math.floor(i / 4) * 180 + 50
    //       },
    //       data: {
    //         id: service,
    //         title: service,
    //         mainStat: latencyMs,
    //         secondaryStat: rps,
    //         successRate,
    //         errorRate,
    //         onNodeClick: () => console.log('[Plugin API] Node clicked:', service)
    //       } as ServiceMapNode
    //     });

    //     const rawLinks = linksField?.values?.[i];
    //     if (typeof rawLinks === 'string' && rawLinks.trim().length > 0) {
    //       const targets = rawLinks.split(/[;,\n]/).map((s: string) => s.trim()).filter(Boolean);
    //       targets.forEach((target: string) => {
    //         edges.push({
    //           id: `${service}-${target}`,
    //           source: service,
    //           target,
    //           type: 'default',
    //           animated: true,
    //           style: { stroke: '#3498db', strokeWidth: 2 },
    //           markerEnd: { type: MarkerType.ArrowClosed, color: '#3498db' },
    //           label: 'Plugin API',
    //           labelStyle: {
    //             fontSize: '10px',
    //             backgroundColor: '#2c3e50',
    //             padding: '2px 6px',
    //             borderRadius: '4px'
    //           }
    //         });
    //       });
    //     }
    //   });
    //   return;
    // }

    // Edges frame mapping (Grafana service graph)
    const sourceField = frame.fields.find((f: any) => f.name === 'source' || f.name === 'sourceName');
    const targetField = frame.fields.find((f: any) => f.name === 'target' || f.name === 'targetName');
    if (sourceField?.values && targetField?.values) {
      sourceField.values.forEach((source: string, i: number) => {
        const target = targetField.values[i];
        if (source && target) {
          edges.push({
            id: `${source}-${target}`,
            source,
            target,
            type: 'default',
            animated: true,
            style: { stroke: '#3498db', strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#3498db' },
            labelStyle: {
              fontSize: '10px',
              backgroundColor: '#2c3e50',
              padding: '2px 6px',
              borderRadius: '4px'
            }
          });
        }
      });
    }
  });

  // Layout nodes hierarchically based on edges (roots at top)
  const levelByNode: Record<string, number> = {};
  const incomingCount: Record<string, number> = {};
  const outgoingByNode: Record<string, string[]> = {};

  nodes.forEach((n) => {
    incomingCount[n.id] = 0;
    outgoingByNode[n.id] = [];
  });
  edges.forEach((e) => {
    if (incomingCount[e.target] === undefined) { incomingCount[e.target] = 0; }
    incomingCount[e.target]++;
    if (!outgoingByNode[e.source]) { outgoingByNode[e.source] = []; }
    outgoingByNode[e.source].push(e.target);
  });

  // Kahn-like BFS to assign levels
  const queue: string[] = [];
  Object.keys(incomingCount).forEach((id) => {
    if (incomingCount[id] === 0) { levelByNode[id] = 0; queue.push(id); }
  });
  while (queue.length) {
    const current = queue.shift() as string;
    const nextLevel = (levelByNode[current] ?? 0) + 1;
    (outgoingByNode[current] || []).forEach((child) => {
      // Assign max level across multiple parents
      levelByNode[child] = Math.max(levelByNode[child] ?? 0, nextLevel);
      incomingCount[child] = Math.max(0, (incomingCount[child] ?? 1) - 1);
      if (incomingCount[child] === 0) { queue.push(child); }
    });
  }

  // For isolated nodes or cycles not processed, default level 0
  nodes.forEach((n) => { if (levelByNode[n.id] === undefined) { levelByNode[n.id] = 0; } });

  // Group nodes by level and position them
  const nodesByLevel: Record<number, string[]> = {};
  Object.entries(levelByNode).forEach(([id, lvl]) => {
    if (!nodesByLevel[lvl]) { nodesByLevel[lvl] = []; }
    nodesByLevel[lvl].push(id);
  });

  const horizontalSpacing = 260;
  const verticalSpacing = 160;
  Object.keys(nodesByLevel).forEach((lvlStr) => {
    const lvl = Number(lvlStr);
    const ids = nodesByLevel[lvl];
    const count = ids.length;
    ids.forEach((id, index) => {
      const node = nodes.find((n) => n.id === id);
      if (node) {
        node.position = {
          x: (index - (count - 1) / 2) * horizontalSpacing + 400,
          y: lvl * verticalSpacing + 40,
        };
      }
    });
  });

  return { nodes, edges };
};

// (Test data generator removed permanently)

const ServiceMapPluginAPI: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Custom node types
  const nodeTypes = React.useMemo(() => ({ serviceNode: ServiceNode }), []);

  const fetchServiceMap = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔧 [Plugin API] Starting Plugin API service map fetch...');
      
      // Try Plugin API first (expected to fail due to limitations)
      let result;
      try {
        result = await queryTempoServiceMapPluginAPI();
        console.log('✅ [Plugin API] Plugin API succeeded!', result);
      } catch (pluginError) {
        console.warn('⚠️ [Plugin API] Plugin API failed as expected:', pluginError);
        // Do not use test data; show no data
        throw pluginError;
      }
      
      setNodes(result.nodes);
      setEdges(result.edges);
      
    } catch (err) {
      console.error('❌ [Plugin API] All methods failed:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setNodes([]);
      setEdges([]);
    } finally {
      setLoading(false);
    }
  }, [setNodes, setEdges]);

  useEffect(() => {
    fetchServiceMap();
  }, [fetchServiceMap]);

  const handleRefresh = () => {
    fetchServiceMap();
  };

  const renderHeaderActions = () => (
    <Space>
      <Tooltip title="Refresh service map">
        <Button 
          icon={<ReloadOutlined />} 
          onClick={handleRefresh}
          loading={loading}
          className="service-map__refresh-btn service-map__refresh-btn--plugin-api"
        >
          Refresh
        </Button>
      </Tooltip>
      {/* <GrafanaLikeRangePicker /> */}
    </Space>
  );

  if (loading) {
    return (
      <BaseContainer title="Service Map (Plugin API)" headerActions={renderHeaderActions()}>
        <div className="service-map__loading">
          <Skeleton active paragraph={{ rows: 8 }} />
        </div>
      </BaseContainer>
    );
  }

  if (error) {
    return (
      <BaseContainer title="Service Map (Plugin API)" headerActions={renderHeaderActions()}>
        <Alert
          message="Plugin API Limitation Demonstrated"
          description={
            <div>
              <p><strong>Expected Error:</strong> {error}</p>
              <p><strong>Common Plugin API Issues:</strong></p>
              <ul>
                <li>• Limited datasource instance access</li>
                <li>• Permission restrictions in plugin context</li>
              </ul>
              <p><strong>Workaround:</strong> See HTTP API version for comparison</p>
            </div>
          }
          type="warning"
          showIcon
          className="service-map__error"
        />
      </BaseContainer>
    );
  }

  if (!nodes.length) {
    return (
      <BaseContainer title="Service Map (Plugin API)" headerActions={renderHeaderActions()}>
        <Alert
          message="No Services Found"
          description="No service dependencies detected. Check if spans with service.name attributes are being ingested."
          type="info"
          showIcon
          className="service-map__no-data"
        />
      </BaseContainer>
    );
  }

  return (
    <BaseContainer title="Service Map (Plugin API)" headerActions={renderHeaderActions()}>
      {/* Status Bar */}
      <div className="service-map__status-bar service-map__status-bar--plugin-api">
        <div className="service-map__status-metrics">
          <Badge count={nodes.length} color="#e74c3c">
            <span style={{ color: '#ffffff' }}>Services</span>
          </Badge>
          <Badge count={edges.length} color="#e74c3c">
            <span style={{ color: '#ffffff' }}>Connections</span>
          </Badge>
        </div>
        <div className="service-map__mode-badge service-map__mode-badge--plugin-api">
          🔧 Plugin API Mode
        </div>
      </div>

      {/* ReactFlow */}
      <div className="service-map__flow-container">
        <ReactFlowProvider>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
            attributionPosition="bottom-left"
            className="service-map__flow"
          >
            <Background 
              color="#ffffff" 
              gap={20} 
              size={1} 
              style={{ opacity: 0.1 }}
            />
            <Controls className="service-map__controls service-map__controls--plugin-api" />
            <MiniMap 
              className="service-map__minimap service-map__minimap--plugin-api"
            />
          </ReactFlow>
        </ReactFlowProvider>
      </div>
    </BaseContainer>
  );
};

export default ServiceMapPluginAPI;
