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

import { prometheusApi } from '../../providers/api/prometheus.api';

interface ServiceEdgeData {
  from: string;
  to: string;
  count: number;
  errorCount: number;
  latencyMs: number;
}

interface ServiceNode {
  name: string;
  calls: number;
}

function mergePrometheusData(
  calls: any[],
  errors: any[],
  latencies: any[]
): { nodes: ServiceNode[]; edges: ServiceEdgeData[] } {
  const edgeMap = new Map<string, ServiceEdgeData>();
  const nodeMap = new Map<string, number>();

  for (const item of calls) {
    const from = item.metric.client;
    const to = item.metric.server;
    const rate = parseFloat(item.value[1]);
    const count = Math.round(rate * 60);
    const key = `${from}->${to}`;
    edgeMap.set(key, { from, to, count, errorCount: 0, latencyMs: 0 });
    nodeMap.set(from, (nodeMap.get(from) || 0) + count);
    nodeMap.set(to, nodeMap.get(to) || 0);
  }

  for (const item of errors) {
    const from = item.metric.client;
    const to = item.metric.server;
    const rate = parseFloat(item.value[1]);
    const count = Math.round(rate * 60);
    const key = `${from}->${to}`;
    if (edgeMap.has(key)) {
      edgeMap.get(key)!.errorCount = count;
    }
  }

  for (const item of latencies) {
    const from = item.metric.client;
    const to = item.metric.server;
    const ms = parseFloat(item.value[1]) * 1000;
    const key = `${from}->${to}`;
    if (edgeMap.has(key)) {
      edgeMap.get(key)!.latencyMs = Math.round(ms);
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

  const edges = Array.from(edgeMap.values());
  const nodes = Array.from(nodeMap.entries()).map(([name, calls]) => ({ name, calls }));
  return { nodes, edges };
}

function layoutGraphNodes(edges: ServiceEdgeData[], nodes: ServiceNode[]): Node[] {
  const levelMap = new Map<string, number>();
  const visit = (node: string, depth: number) => {
    if (levelMap.has(node)) {
      levelMap.set(node, Math.max(levelMap.get(node)!, depth));
    } else {
      levelMap.set(node, depth);
    }
    edges.filter((e) => e.from === node).forEach((e) => visit(e.to, depth + 1));
  };

  const called = new Set(edges.map((e) => e.to));
  const roots = nodes.map((n) => n.name).filter((n) => !called.has(n));
  roots.forEach((r) => visit(r, 0));

  const levelGroups = new Map<number, string[]>();
  levelMap.forEach((depth, name) => {
    if (!levelGroups.has(depth)) levelGroups.set(depth, []);
    levelGroups.get(depth)!.push(name);
  });

  const graphNodes: Node[] = [];
  levelGroups.forEach((names, depth) => {
    names.forEach((name, index) => {
      const original = nodes.find((n) => n.name === name)!;
      graphNodes.push({
        id: name,
        data: { label: `${name} (${original.calls})` },
        position: { x: index * 300, y: depth * 200 },
        style: {
          padding: 12,
          borderRadius: 8,
          border: '1px solid #333',
          background: 'white',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        },
      });
    });
  });

  return graphNodes;
}

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

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      setError(null);

      try {
        const [calls, errors, latency] = await Promise.all([
          prometheusApi.runTraceQLQuery(
            'sum by (client, server) (rate(traces_service_graph_request_total[1m]))'
          ),
          prometheusApi.runTraceQLQuery(
            'sum by (client, server) (rate(traces_service_graph_request_failed_total[1m]))'
          ),
          prometheusApi.runTraceQLQuery(
            'histogram_quantile(0.95, sum by (le, client, server) (rate(traces_service_graph_request_duration_seconds_bucket[1m])))'
          ),
        ]);

        const map = mergePrometheusData(calls, errors, latency);
        const graphNodes = layoutGraphNodes(map.edges, map.nodes);

        const graphEdges: Edge[] = map.edges.map((e) => {
          const errorRate = e.errorCount / (e.count || 1);
          const stroke = errorRate > 0.1 ? '#ff4d4f' : errorRate > 0.01 ? '#faad14' : '#52c41a';
          const label = `${e.count} calls/min\n${e.latencyMs}ms p95\n${e.errorCount} errors`;

          return {
            id: `${e.from}->${e.to}`,
            source: e.from,
            target: e.to,
            label,
            animated: true,
            style: { stroke, strokeWidth: 2.5 },
            labelStyle: {
              fill: '#000',
              fontWeight: 600,
              fontSize: 11,
              whiteSpace: 'pre',
            },
          };
        });

        setNodes(graphNodes);
        setEdges(graphEdges);
      } catch (err: any) {
        setError(err?.message || 'Metric fetch failed');
      } finally {
        setLoading(false);
      }
  }, [setNodes, setEdges]);
    fetchMetrics();
  }, [range]);

  return (
    <BaseContainer
      title="Service Map"
      headerActions={
        <GrafanaLikeRangePicker
          title="Date Range"
          onChange={(start, end) => setRange([start, end])}
        />
      }
    >
      <Row style={{ width: '100%' }}>
        {loading ? (
          <Skeleton active paragraph={{ rows: 4 }} />
        ) : error ? (
          <Alert type="error" message="Service Map Error" description={error} showIcon />
        ) : (
          <div style={{ width: '100%', height: '800px' }}>
            <ReactFlow nodes={nodes} edges={edges} fitView>
              <MiniMap />
              <Controls />
              <Background />
            </ReactFlow>
          </div>
        )}
      </Row>
    </BaseContainer>
  );
};

export default ServiceMapContainer;
