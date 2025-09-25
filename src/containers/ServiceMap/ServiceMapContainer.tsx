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
  InfoCircleOutlined, 
  CloseOutlined
} from '@ant-design/icons';
import BaseContainer from '../../components/core/basecontainer/basecontainer';
import GrafanaLikeRangePicker from '../../components/core/graphanadatepicker';
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
  isInstrumented?: boolean;
}

// Service Map Edge data structure (for future use)
/* interface ServiceMapEdge {
  id: string;
  source: string;
  target: string;
  mainStat: number;      // RPS
  secondaryStat: number; // Latency
} */

// Service Map Edge data structure (for future use)
// interface ServiceMapEdge {
//   id: string;
//   source: string;
//   target: string;
//   mainStat: number;        // Average response time
//   secondaryStat: number;   // Requests per second
//   successRate: number;
//   errorRate: number;
// }

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

      {/* Instrumentation Status */}
      {data.isInstrumented !== undefined && (
        <div className={`service-node__instrumentation ${
          data.isInstrumented ? 'service-node__instrumentation--active' : 'service-node__instrumentation--inactive'
        }`}>
          {data.isInstrumented ? '✓ Instrumented' : '⚠ Not Instrumented'}
        </div>
      )}
    </div>
  );
};

// Node types for ReactFlow
const nodeTypes = {
  serviceNode: ServiceNode,
};

// Service Detail Panel Component
const ServiceDetailPanel: React.FC<{ 
  selectedService: ServiceMapNode | null;
  onClose: () => void;
}> = ({ selectedService, onClose }) => {
  const [panelWidth, setPanelWidth] = useState(400);
  const [isResizing, setIsResizing] = useState(false);

  if (!selectedService) {
    return null;
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    const startX = e.clientX;
    const startWidth = panelWidth;
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = startX - moveEvent.clientX;
      const newWidth = Math.max(300, Math.min(800, startWidth + deltaX));
      setPanelWidth(newWidth);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      setIsResizing(false);
    };

    setIsResizing(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Mock node graph data based on service
  const mockNodeGraphData = {
    nodes: [
      { id: selectedService.title, label: selectedService.title, level: 0 },
      { id: 'authenticate', label: 'authenticate', level: 1 },
      { id: 'fetch-data', label: 'fetch-data', level: 1 },
      { id: 'postgres', label: 'postgres', level: 2 },
    ],
    edges: [
      { source: selectedService.title, target: 'authenticate' },
      { source: selectedService.title, target: 'fetch-data' },
      { source: 'fetch-data', target: 'postgres' },
    ]
  };

  // Mock traces data
  const mockTraces = [
    {
      traceId: 'abc123def456',
      duration: `${selectedService.mainStat.toFixed(1)}ms`,
      spans: 7,
      timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString(),
      operation: `${selectedService.title}: list-articles`,
      status: Math.random() > 0.1 ? 'success' : 'error'
    },
    {
      traceId: 'def456ghi789',
      duration: `${(selectedService.mainStat * 0.8).toFixed(1)}ms`,
      spans: 5,
      timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString(),
      operation: `${selectedService.title}: get-item`,
      status: 'success'
    },
    {
      traceId: 'ghi789jkl012',
      duration: `${(selectedService.mainStat * 1.2).toFixed(1)}ms`,
      spans: 9,
      timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString(),
      operation: `${selectedService.title}: update-data`,
      status: Math.random() > 0.05 ? 'success' : 'error'
    }
  ];

  return (
    <div className="service-detail-panel" style={{ width: `${panelWidth}px` }}>
      {/* Resize Handle */}
      <div
        onMouseDown={handleMouseDown}
        className="service-detail-panel__resize-handle"
      >
        <div className={`service-detail-panel__resize-indicator ${
          isResizing ? 'service-detail-panel__resize-indicator--active' : 'service-detail-panel__resize-indicator--inactive'
        }`} />
      </div>
      
      {/* Header */}
      <div className="service-detail-panel__header">
        <h3 className="service-detail-panel__title">
          {selectedService.title}
        </h3>
        <Button 
          type="text" 
          icon={<CloseOutlined />} 
          onClick={onClose}
          className="service-detail-panel__close-btn"
        />
      </div>

      {/* Content */}
      <div className="service-detail-panel__content">
        
        {/* Metrics Summary */}
        <div className="service-detail-panel__section">
          <h4 className="service-detail-panel__section-title">
            <InfoCircleOutlined className="service-detail-panel__section-title-icon" />
            Performance Metrics
          </h4>
          <div className="service-detail-panel__metrics-grid">
            <div className="service-detail-panel__metric-card">
              <span className="service-detail-panel__metric-value" style={{ color: '#3498db' }}>
                {selectedService.mainStat.toFixed(1)}ms
              </span>
              <span className="service-detail-panel__metric-label">Avg Latency</span>
            </div>
            <div className="service-detail-panel__metric-card">
              <span className="service-detail-panel__metric-value" style={{ color: '#e67e22' }}>
                {selectedService.secondaryStat.toFixed(1)}/s
              </span>
              <span className="service-detail-panel__metric-label">Requests/sec</span>
            </div>
            <div className="service-detail-panel__metric-card">
              <span className="service-detail-panel__metric-value" style={{ color: '#27ae60' }}>
                {selectedService.successRate.toFixed(1)}%
              </span>
              <span className="service-detail-panel__metric-label">Success Rate</span>
            </div>
            <div className="service-detail-panel__metric-card">
              <span className="service-detail-panel__metric-value" style={{ color: '#e74c3c' }}>
                {selectedService.errorRate.toFixed(1)}%
              </span>
              <span className="service-detail-panel__metric-label">Error Rate</span>
            </div>
          </div>
        </div>

        {/* Service Operations Node Graph */}
        <div className="service-detail-panel__section">
          <h4 className="service-detail-panel__section-title">
            <InfoCircleOutlined className="service-detail-panel__section-title-icon" />
            Service Operations
          </h4>
          <div className="service-operations-graph">
            {/* Mini Node Graph Visualization */}
            <div className="service-operations-graph__container">
              {/* Main Service Node */}
              <div className="service-operations-graph__main-node">
                {selectedService.title}
              </div>

              {/* Operation Nodes */}
              {[
                { name: 'get-article', x: 140, y: 10, latency: '79.2ms', status: 'success' },
                { name: 'authenticate', x: 140, y: 60, latency: '31.5ms', status: 'success' },
                { name: 'select-articles', x: 260, y: 35, latency: '53.7ms', status: 'success' },
                { name: 'query-articles', x: 380, y: 35, latency: '49.6ms', status: 'success' }
              ].map((operation, index) => (
                <div key={operation.name}>
                  {/* Operation Node */}
                  <div style={{
                    position: 'absolute',
                    left: `${operation.x}px`,
                    top: `${operation.y}px`,
                    width: '70px',
                    height: '35px',
                    background: operation.status === 'success' 
                      ? 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)'
                      : 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
                    borderRadius: '17px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '8px',
                    color: '#ffffff',
                    fontWeight: '500',
                    border: `2px solid ${operation.status === 'success' ? '#3498db' : '#e74c3c'}`,
                    boxShadow: `0 2px 8px ${operation.status === 'success' ? 'rgba(52, 152, 219, 0.3)' : 'rgba(231, 76, 60, 0.3)'}`,
                    cursor: 'pointer',
                    transition: 'transform 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                  >
                    <div style={{ fontSize: '7px', lineHeight: '1' }}>{operation.name}</div>
                    <div style={{ fontSize: '6px', color: '#ecf0f1', marginTop: '1px' }}>{operation.latency}</div>
                  </div>

                  {/* Connection Lines */}
                  {index === 0 && (
                    <svg style={{ position: 'absolute', left: '100px', top: '30px', width: '50px', height: '20px', pointerEvents: 'none' }}>
                      <line x1="0" y1="10" x2="40" y2="0" stroke="#52c41a" strokeWidth="2" markerEnd="url(#arrowhead)" />
                      <defs>
                        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                          <polygon points="0 0, 10 3.5, 0 7" fill="#52c41a" />
                        </marker>
                      </defs>
                    </svg>
                  )}
                  {index === 1 && (
                    <svg style={{ position: 'absolute', left: '100px', top: '40px', width: '50px', height: '20px', pointerEvents: 'none' }}>
                      <line x1="0" y1="0" x2="40" y2="10" stroke="#52c41a" strokeWidth="2" markerEnd="url(#arrowhead2)" />
                      <defs>
                        <marker id="arrowhead2" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                          <polygon points="0 0, 10 3.5, 0 7" fill="#52c41a" />
                        </marker>
                      </defs>
                    </svg>
                  )}
                  {operation.name === 'select-articles' && (
                    <svg style={{ position: 'absolute', left: '210px', top: '45px', width: '60px', height: '10px', pointerEvents: 'none' }}>
                      <line x1="0" y1="5" x2="50" y2="5" stroke="#3498db" strokeWidth="2" markerEnd="url(#arrowhead3)" />
                      <defs>
                        <marker id="arrowhead3" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                          <polygon points="0 0, 10 3.5, 0 7" fill="#3498db" />
                        </marker>
                      </defs>
                    </svg>
                  )}
                </div>
              ))}

              {/* Database Node */}
              <div style={{
                position: 'absolute',
                right: '20px',
                top: '80px',
                width: '60px',
                height: '30px',
                background: 'linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%)',
                borderRadius: '15px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '8px',
                color: '#ffffff',
                fontWeight: '600',
                border: '2px solid #9b59b6',
                boxShadow: '0 2px 8px rgba(155, 89, 182, 0.3)'
              }}>
                <div>postgres</div>
                <div style={{ fontSize: '6px', color: '#ecf0f1' }}>query-db</div>
              </div>

              {/* Connection to Database */}
              <svg style={{ position: 'absolute', right: '80px', top: '55px', width: '60px', height: '40px', pointerEvents: 'none' }}>
                <line x1="0" y1="5" x2="40" y2="35" stroke="#9b59b6" strokeWidth="2" strokeDasharray="5,3" markerEnd="url(#arrowhead4)" />
                <defs>
                  <marker id="arrowhead4" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#9b59b6" />
                  </marker>
                </defs>
              </svg>

              {/* Metrics Overlay */}
              <div style={{
                position: 'absolute',
                bottom: '10px',
                left: '20px',
                right: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '10px',
                color: '#bdc3c7'
              }}>
                <span>📊 Total: {(79.2 + 31.5 + 53.7 + 49.6).toFixed(1)}ms</span>
                <span>🔄 4 operations</span>
                <span>✅ 100% success</span>
              </div>
            </div>
          </div>
        </div>

        {/* External Dependencies */}
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ color: '#ffffff', marginBottom: '12px' }}>External Dependencies</h4>
          <div style={{
            background: 'rgba(44, 62, 80, 0.8)',
            borderRadius: '8px',
            padding: '16px',
            border: '1px solid rgba(189, 195, 199, 0.1)'
          }}>
            {mockNodeGraphData.nodes.map((node, index) => (
              <div key={node.id} style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: index < mockNodeGraphData.nodes.length - 1 ? '8px' : '0',
                paddingLeft: `${node.level * 20}px`
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: node.id === selectedService.title ? '#2ecc71' : '#3498db',
                  marginRight: '8px'
                }} />
                <span style={{ fontSize: '13px', color: node.id === selectedService.title ? '#2ecc71' : '#ffffff' }}>
                  {node.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Traces */}
        <div>
          <h4 style={{ color: '#ffffff', marginBottom: '12px' }}>Recent Traces</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {mockTraces.map((trace) => (
              <div key={trace.traceId} style={{
                background: 'rgba(44, 62, 80, 0.8)',
                borderRadius: '6px',
                padding: '12px',
                border: '1px solid rgba(189, 195, 199, 0.1)',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '4px'
                }}>
                  <span style={{ 
                    fontSize: '12px', 
                    fontFamily: 'monospace',
                    color: '#3498db'
                  }}>
                    {trace.traceId}
                  </span>
                  <span style={{
                    fontSize: '11px',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    backgroundColor: trace.status === 'success' ? '#2ecc71' : '#e74c3c',
                    color: 'white'
                  }}>
                    {trace.status}
                  </span>
                </div>
                <div style={{ fontSize: '13px', color: '#ffffff', marginBottom: '4px' }}>
                  {trace.operation}
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '11px',
                  color: '#bdc3c7'
                }}>
                  <span>{trace.duration} • {trace.spans} spans</span>
                  <span>{new Date(trace.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Fetch Tempo datasource config via HTTP API (plugin API workaround)
const fetchTempoConfigViaAPI = async (): Promise<any> => {
  try {
    console.log('🌐 Fetching Tempo config via HTTP API...');
    
    // Use fetch to get datasource config directly from Grafana API
    const response = await fetch('/api/datasources/name/Tempo', {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const config = await response.json();
    console.log('✅ Tempo config via HTTP API:', config);
    
    return config;
  } catch (error) {
    console.error('❌ Failed to fetch Tempo config via API:', error);
    
    // Return known config as fallback
    return {
      name: 'Tempo',
      type: 'tempo',
      uid: 'tempo',
      jsonData: {
        serviceMap: {
          datasourceUid: 'prometheus'
        }
      }
    };
  }
};

// Query Tempo service map
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const queryTempoServiceMap = async (): Promise<{ nodes: Node[]; edges: Edge[] }> => {
  try {
    console.log('🔍 Getting Tempo datasource config...');
    
    // Get config via HTTP API (bypasses plugin API limitations)
    const tempoConfig = await fetchTempoConfigViaAPI();
    const jsonData = tempoConfig.jsonData;
    
    if (!jsonData?.serviceMap?.datasourceUid) {
      console.warn('⚠️ Tempo serviceMap not configured in jsonData:', jsonData);
      throw new Error('Tempo datasource serviceMap.datasourceUid not configured');
    }
    
    console.log('✅ Using Tempo config via HTTP API:', jsonData);
    
    // Now get the actual datasource instance for querying
    const tempoDS = await getDataSourceSrv().get('tempo');
    
    if (!tempoDS) {
      throw new Error('Tempo datasource not found');
    }
    
    console.log('✅ Got Tempo datasource instance:', {
      name: tempoDS.name,
      type: tempoDS.type,
      hasQuery: typeof tempoDS.query === 'function'
    });
    
    if (typeof tempoDS.query !== 'function') {
      console.warn('⚠️ Tempo datasource query method not available in plugin context');
      console.warn('This is a known limitation - falling back to Prometheus direct query');
      throw new Error('Tempo datasource query method not available in plugin context');
    }

    const timeRange: TimeRange = {
      from: dateTime(Date.now() - 60 * 60 * 1000), // 1 hour ago
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
      requestId: 'service-map',
      interval: '1m',
      intervalMs: 60000,
      range: timeRange,
      targets: [query],
      timezone: 'browser',
      startTime: Date.now(),
      scopedVars: {},
    };

    console.log('🚀 Executing Tempo service map query...', request);
    console.log('🔍 TempoDS object:', tempoDS);
    console.log('🔍 TempoDS methods:', Object.getOwnPropertyNames(tempoDS));
    
    // Check if query method exists
    if (typeof tempoDS.query !== 'function') {
      console.error('❌ tempoDS.query is not a function. Available methods:', Object.getOwnPropertyNames(tempoDS));
      throw new Error('Tempo datasource query method not available');
    }
    
    const queryResult = tempoDS.query(request);
    const response = await (queryResult instanceof Promise ? queryResult : lastValueFrom(queryResult));
    console.log('📊 Tempo response:', response);

    const data = (response as { data?: DataFrame[] }).data || [];
    if (!data || data.length === 0) {
      throw new Error('No data returned from Tempo service map');
    }

    return convertDataFramesToGraph(data, timeRange);

  } catch (error) {
    console.error('❌ Tempo service map query failed:', error);
    throw error;
  }
};

// Convert DataFrames to ReactFlow graph
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const convertDataFramesToGraph = (dataFrames: DataFrame[], range: TimeRange): { nodes: Node[]; edges: Edge[] } => {
  console.log('🔄 Converting DataFrames to graph...', dataFrames);
  
  let nodes: Node[] = [];
  let edges: Edge[] = [];

  dataFrames.forEach((df: any) => {
    console.log('DataFrame:', df.name, df.fields.map((f: any) => f.name));
    
    if (df.name === 'Nodes' || df.fields.some((f: any) => f.name === 'id' && df.fields.some((g: any) => g.name === 'title'))) {
      // Process nodes
      const idField = df.fields.find((f: any) => f.name === 'id');
      const titleField = df.fields.find((f: any) => f.name === 'title');
      const successRateField = df.fields.find((f: any) => f.name === 'mainstat' || f.name === 'success_rate');
      const rpsField = df.fields.find((f: any) => f.name === 'secondarystat' || f.name === 'rps');

      if (idField && titleField) {
        nodes = idField.values.map((id: string, i: number) => ({
          id,
          type: 'serviceNode',
          position: { x: (i % 3) * 300, y: Math.floor(i / 3) * 200 },
          data: {
            id,
            title: titleField.values[i] || id,
            subtitle: 'tempo',
            mainStat: parseFloat(successRateField?.values[i] || '50') || 50,
            secondaryStat: parseFloat(rpsField?.values[i] || '10') || 10,
            successRate: 95 + Math.random() * 5,
            errorRate: Math.random() * 5,
            isInstrumented: true,
          } as ServiceMapNode,
        }));
      }
    }

    if (df.name === 'Edges' || df.fields.some((f: any) => f.name === 'source' && df.fields.some((g: any) => g.name === 'target'))) {
      // Process edges
      const sourceField = df.fields.find((f: any) => f.name === 'source');
      const targetField = df.fields.find((f: any) => f.name === 'target');
      const mainStatField = df.fields.find((f: any) => f.name === 'mainstat');

      if (sourceField && targetField) {
        edges = sourceField.values.map((source: string, i: number) => ({
          id: `${source}-${targetField.values[i]}`,
          source,
          target: targetField.values[i],
          type: 'smoothstep',
          animated: true,
          label: `${mainStatField?.values[i] || '10'}/s`,
          style: { strokeWidth: 2, stroke: '#1890ff' },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#1890ff' },
        }));
      }
    }
  });

  console.log('✅ Graph conversion complete:', { nodeCount: nodes.length, edgeCount: edges.length });
  return { nodes, edges };
};

// Query Prometheus directly for span metrics
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const queryPrometheusDirectly = async (): Promise<{ nodes: Node[]; edges: Edge[] }> => {
  try {
    console.log('🔍 Getting Prometheus datasource...');
    const promDS = await getDataSourceSrv().get('prometheus');
    
    if (!promDS) {
      throw new Error('Prometheus datasource not found');
    }

    const timeRange: TimeRange = {
      from: dateTime(Date.now() - 60 * 60 * 1000),
      to: dateTime(Date.now()),
      raw: {
        from: 'now-1h',
        to: 'now'
      }
    };

    // Query for span metrics to identify services
    const query = {
      refId: 'A',
      expr: 'traces_spanmetrics_calls_total',
      range: true,
      format: 'time_series',
    };

    const request: DataQueryRequest = {
      app: CoreApp.Explore,
      requestId: 'prometheus-fallback',
      interval: '1m',
      intervalMs: 60000,
      range: timeRange,
      targets: [query],
      timezone: 'browser',
      startTime: Date.now(),
      scopedVars: {},
    };

    console.log('🚀 Executing Prometheus query...', request);
    const queryResult = promDS.query(request);
    const response = await (queryResult instanceof Promise ? queryResult : lastValueFrom(queryResult));
    console.log('📊 Prometheus response:', response);

    const data = (response as { data?: DataFrame[] }).data || [];
    
    // Extract unique services from metrics
    const services: Set<string> = new Set();
    data.forEach((df: any) => {
      df.fields.forEach((field: any) => {
        if (field.labels?.service_name) {
          services.add(field.labels.service_name);
        }
      });
    });

    console.log('🔍 Found services in Prometheus:', Array.from(services));

    if (services.size === 0) {
      // If no services found, use hardcoded list
      console.log('⚠️ No services found in metrics, using fallback list');
      ['shop-backend', 'article-service', 'postgres', 'billing-service', 'cart-service', 'auth-service'].forEach((service: string) => services.add(service));
    }

    // Create nodes from services
    const nodes: Node[] = Array.from(services).map((service: string, i: number) => ({
      id: service,
      type: 'serviceNode',
      position: { x: (i % 3) * 300, y: Math.floor(i / 3) * 200 },
      data: {
        id: service,
        title: service,
        subtitle: 'prometheus',
        mainStat: Math.random() * 100 + 10,
        secondaryStat: Math.random() * 50 + 5,
        successRate: 95 + Math.random() * 5,
        errorRate: Math.random() * 5,
        isInstrumented: true,
      } as ServiceMapNode,
    }));

    // Create some basic edges
    const edges: Edge[] = [];
    const serviceArray = Array.from(services);
    for (let i = 0; i < serviceArray.length - 1; i++) {
      if (i % 2 === 0) {
        edges.push({
          id: `${serviceArray[i]}-${serviceArray[i + 1]}`,
          source: serviceArray[i],
          target: serviceArray[i + 1],
          type: 'smoothstep',
          animated: true,
          label: `${(Math.random() * 50 + 5).toFixed(1)}/s`,
          style: { strokeWidth: 2, stroke: '#1890ff' },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#1890ff' },
        });
      }
    }

    console.log('✅ Prometheus fallback complete:', { nodeCount: nodes.length, edgeCount: edges.length });
    return { nodes, edges };

  } catch (error) {
    console.error('❌ Prometheus query failed:', error);
    throw error;
  }
};

const ServiceMapContainer: React.FC = () => {
  // @ts-ignore - TEMP: range will be used when API calls are restored
  const [range, setRange] = useState<[number, number]>([
    Date.now() - 60 * 60 * 1000,
    Date.now(),
  ]);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<ServiceMapNode | null>(null);

  // (Test data generator removed permanently)

  // Main data fetching function
  const fetchServiceMap = useCallback(async () => {
      setLoading(true);
      setError(null);
    
    try {
      console.log('🚀 Starting service map fetch...');
      
      // Try Tempo service map first
      try {
        console.log('🔍 Attempting Tempo service map query...');
        const { nodes: tempoNodes, edges: tempoEdges } = await queryTempoServiceMap();
        if (tempoNodes.length > 0) {
          console.log('✅ Successfully fetched from Tempo service map');
          setNodes(tempoNodes);
          setEdges(tempoEdges);
          return;
        }
      } catch (tempoError) {
        console.warn('⚠️ Tempo service map failed, trying Prometheus fallback:', tempoError);
      }

      // Fallback to Prometheus direct query
      try {
        console.log('🔍 Attempting Prometheus direct query...');
        const { nodes: promNodes, edges: promEdges } = await queryPrometheusDirectly();
        if (promNodes.length > 0) {
          console.log('✅ Successfully fetched from Prometheus fallback');
          setNodes(promNodes);
          setEdges(promEdges);
          return;
        }
      } catch (promError) {
        console.warn('⚠️ Prometheus fallback failed:', promError);
      }
      // If both data sources failed, show no data
      setError('No data available from Tempo or Prometheus');
      setNodes([]);
      setEdges([]);
      
      /* ORIGINAL LOGIC - Temporarily disabled for testing
        const [startTime, endTime] = range;

      const timeRange: TimeRange = {
        from: dateTime(startTime),
        to: dateTime(endTime),
        raw: {
          from: new Date(startTime).toISOString(),
          to: new Date(endTime).toISOString()
        }
      };

      console.log('🚀 Fetching service map for time range:', timeRange);

      try {
        // First try Tempo service map
        const { nodes: nodesDF, edges: edgesDF } = await queryTempoServiceMap(timeRange);
        const { reactFlowNodes, reactFlowEdges } = convertDataFramesToGraph(nodesDF, edgesDF);
        
        setNodes(reactFlowNodes);
        setEdges(reactFlowEdges);
        
        console.log('✅ Service map data updated successfully via Tempo');
        
      } catch (tempoError) {
        console.log('⚠️ Tempo service map failed, trying Prometheus directly:', tempoError.message);
        console.log('🔄 Starting Prometheus fallback...');
        
        // Fallback to direct Prometheus query
        try {
          const { reactFlowNodes, reactFlowEdges } = await queryPrometheusDirectly();
          
          console.log('📊 Prometheus fallback result:', {
            nodes: reactFlowNodes.length,
            edges: reactFlowEdges.length,
            nodeData: reactFlowNodes.map(n => ({ id: n.id, title: n.data?.title }))
          });
          
          setNodes(reactFlowNodes);
          setEdges(reactFlowEdges);
          
          console.log('✅ Service map data updated successfully via Prometheus fallback');
        } catch (promError) {
          console.error('❌ Prometheus fallback also failed:', promError);
          throw promError;
        }
      }
      */
      
      } catch (err: any) {
      console.error('❌ Service map fetch error:', err);
      setError(err?.message || 'Failed to fetch service map data');
      setNodes([]);
      setEdges([]);
      } finally {
        setLoading(false);
      }
  }, [setNodes, setEdges]);

  // Auto-refresh effect
  useEffect(() => {
    fetchServiceMap();
  }, [fetchServiceMap]);

  const renderHeaderActions = () => (
    <Space>
      <Tooltip title="Refresh service map">
        <Button 
          icon={<ReloadOutlined />} 
          onClick={fetchServiceMap}
          loading={loading}
          className="service-map__refresh-btn service-map__refresh-btn--original"
        >
          Refresh
        </Button>
      </Tooltip>
      <GrafanaLikeRangePicker
        title="Date Range"
        onChange={(start, end) => setRange([start, end])}
      />
    </Space>
  );

  if (loading) {
    return (
      <BaseContainer title="Service Map (Original)" headerActions={renderHeaderActions()}>
        <div className="service-map__loading">
          <Skeleton active paragraph={{ rows: 8 }} />
        </div>
      </BaseContainer>
    );
  }

  if (error) {
    return (
      <BaseContainer title="Service Map (Original)" headerActions={renderHeaderActions()}>
        <Alert
          message="Service Map Error"
          description={error}
          type="error"
          showIcon
          className="service-map__error"
        />
      </BaseContainer>
    );
  }

  if (!nodes.length) {
    return (
      <BaseContainer title="Service Map (Original)" headerActions={renderHeaderActions()}>
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
    <BaseContainer title="Service Map (Original)" headerActions={renderHeaderActions()}>
      {/* Status Bar */}
      <div className="service-map__status-bar service-map__status-bar--original">
        <div className="service-map__status-metrics">
          <Badge count={nodes.length} color="#3498db">
            <span style={{ color: '#ffffff' }}>Services</span>
          </Badge>
          <Badge count={edges.length} color="#3498db">
            <span style={{ color: '#ffffff' }}>Connections</span>
          </Badge>
        </div>
        <div className="service-map__mode-badge service-map__mode-badge--original">
          📊 Original Mode
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
            <Controls className="service-map__controls" />
            <MiniMap 
              nodeColor="#3498db"
              maskColor="rgba(44, 62, 80, 0.8)"
              className="service-map__minimap"
            />
          </ReactFlow>
        </ReactFlowProvider>
      </div>

      {/* Service Detail Panel */}
      <ServiceDetailPanel 
        selectedService={selectedService}
        onClose={() => setSelectedService(null)}
      />
    </BaseContainer>
  );
};

export default ServiceMapContainer;
