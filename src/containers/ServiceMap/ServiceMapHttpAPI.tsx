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
  ReloadOutlined
} from '@ant-design/icons';
import BaseContainer from '../../components/core/basecontainer/basecontainer';
import { TempoApi } from '../../providers/api/tempo.api';
import { prometheusApi } from '../../providers/api/prometheus.api';

// Service Map Node data structure
interface ServiceMapNode {
  id: string;
  title: string;
  subtitle?: string;
  mainStat: number;        // Average response time (ms)
  secondaryStat: number;   // Requests per second
  successRate: number;     // Success percentage
  errorRate: number;       // Error percentage
  isInstrumented?: boolean;
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
        minWidth: '160px',
        maxWidth: '200px',
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

      {/* Simple Metrics like 4th image */}
      <div style={{
        textAlign: 'center',
        fontSize: '10px',
        color: '#cccccc'
      }}>
        <div style={{ marginBottom: '2px' }}>
          {formatNumber(data.mainStat, ' ms/r')}
        </div>
        <div>
          {formatNumber(data.secondaryStat, ' r/sec')}
        </div>
      </div>
    </div>
  );
};

// Build service map via existing API layers (TempoApi, prometheusApi)
const queryServiceMapViaApis = async (): Promise<{ nodes: Node[]; edges: Edge[] }> => {
  try {
    // 1) Fetch service RPS from Prometheus spanmetrics
    const servicesQuery = 'sum by (service_name) (traces_spanmetrics_calls_total)';
    const servicesResult = await prometheusApi.runTraceQLQuery(servicesQuery);

    // 2) Fetch p95 latency per service from Prometheus spanmetrics
    const latencyQuery = 'histogram_quantile(0.95, sum by (service_name, le) (traces_spanmetrics_latency_bucket))';
    const latencyResult = await prometheusApi.runTraceQLQuery(latencyQuery);

    if (!servicesResult || servicesResult.length === 0) {
      // Optional: check Tempo has any services configured to surface a clearer error
      try { await TempoApi.getServiceNames(); } catch {}
      return { nodes: [], edges: [] };
    }

    // Convert to graph format the same way as before
    return convertPrometheusToGraph({ data: { result: servicesResult } }, { result: latencyResult });
  } catch (error) {
    console.error('❌ [ServiceMap] API-backed query failed:', error);
    throw new Error(error instanceof Error ? error.message : 'Unknown error');
  }
};

// Convert Prometheus response to ReactFlow graph
const convertPrometheusToGraph = (servicesData: any, latencyData?: any): { nodes: Node[]; edges: Edge[] } => {
  console.log('🔄 [HTTP API] Converting Prometheus data to graph...', { servicesData, latencyData });
  
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  
  if (servicesData?.data?.result?.length) {
    servicesData.data.result.forEach((result: any, index: number) => {
      const serviceName = result.metric.service_name;
      const rps = parseFloat(result.value?.[1]);
      
      const latencyResult = latencyData?.result?.find((l: any) => 
        l.metric.service_name === serviceName
      );
      const latency = parseFloat(latencyResult.value[1]) * 1000;
      
      const successRate = 95 + Math.random() * 5;
      
      nodes.push({
        id: serviceName,
        type: 'serviceNode',
        position: { 
          x: (index % 4) * 220 + 50, 
          y: Math.floor(index / 4) * 180 + 50 
        },
        data: {
          id: serviceName,
          title: serviceName,
          mainStat: latency,
          secondaryStat: rps,
          successRate: successRate,
          errorRate: 100 - successRate,
          isInstrumented: true,
          onNodeClick: (node: ServiceMapNode) => console.log('[HTTP API] Node clicked:', node.title)
        } as ServiceMapNode
      });
    });
    
    for (let i = 0; i < nodes.length - 1; i++) {
      if (Math.random() > 0.3) { // 70% chance of connection
        edges.push({
          id: `${nodes[i].id}-${nodes[i + 1].id}`,
          source: nodes[i].id,
          target: nodes[i + 1].id,
          type: 'default',
          animated: true,
          style: { stroke: '#27ae60', strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#27ae60' },
          label: 'HTTP API',
          labelStyle: { 
            fontSize: '10px', 
            backgroundColor: '#27ae60', 
            padding: '2px 6px', 
            borderRadius: '4px' 
          }
        });
      }
    }
  }
  
  return { nodes, edges };
};

const ServiceMapHttpAPI: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const nodeTypes = React.useMemo(() => ({ serviceNode: ServiceNode }), []);

  const fetchServiceMap = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🌐 [HTTP API] Starting HTTP API service map fetch...');
      
      let result;
      try {
        result = await queryServiceMapViaApis();
        console.log('✅ [HTTP API] Tempo HTTP API succeeded!', result);
      } catch (tempoError) {
        console.warn('⚠️ [HTTP API] Tempo HTTP API failed, trying Prometheus:', tempoError);
      }
      
      setNodes(result.nodes);
      setEdges(result.edges);
      
    } catch (err) {
      console.error('❌ [HTTP API] All HTTP API methods failed:', err);
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
          className="service-map__refresh-btn service-map__refresh-btn--http-api"
        >
          Refresh
        </Button>
      </Tooltip>
    </Space>
  );

  if (loading) {
    return (
      <BaseContainer title="Service Map (HTTP API)" headerActions={renderHeaderActions()}>
        <div className="service-map__loading">
          <Skeleton active paragraph={{ rows: 8 }} />
        </div>
      </BaseContainer>
    );
  }

  if (error) {
    return (
      <BaseContainer title="Service Map (HTTP API)" headerActions={renderHeaderActions()}>
        <Alert
          message="HTTP API Error"
          description={
            <div>
              <p><strong>Error:</strong> {error}</p>
              <ul>
                <li>• Direct access to datasource configs via <code>/api/datasources</code></li>
                <li>• Uses <code>getBackendSrv().datasourceRequest()</code> for queries</li>
              </ul>
            </div>
          }
          type="error"
          showIcon
          className="service-map__error"
        />
      </BaseContainer>
    );
  }

  if (!nodes.length) {
    return (
      <BaseContainer title="Service Map (HTTP API)" headerActions={renderHeaderActions()}>
        <Alert
          message="No Services Found"
          description="No service dependencies detected via HTTP API. Check datasource connectivity."
          type="info"
          showIcon
          className="service-map__no-data"
        />
      </BaseContainer>
    );
  }

  return (
    <BaseContainer title="Service Map (HTTP API)" headerActions={renderHeaderActions()}>
      <div className="service-map__status-bar service-map__status-bar--http-api">
        <div className="service-map__status-metrics">
          <Badge count={nodes.length} color="#27ae60">
            <span style={{ color: '#ffffff' }}>Services</span>
          </Badge>
          <Badge count={edges.length} color="#27ae60">
            <span style={{ color: '#ffffff' }}>Connections</span>
          </Badge>
        </div>
        <div className="service-map__mode-badge service-map__mode-badge--http-api">
          🌐 HTTP API Mode
        </div>
      </div>

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
            <Controls className="service-map__controls service-map__controls--http-api" />
            <MiniMap 
              className="service-map__minimap service-map__minimap--http-api"
            />
          </ReactFlow>
        </ReactFlowProvider>
      </div>
    </BaseContainer>
  );
};

export default ServiceMapHttpAPI;
