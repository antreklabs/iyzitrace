import React, { useCallback, useMemo, useState } from 'react';
import { 
  CloudServerOutlined,
  DatabaseOutlined,
  ApiOutlined,
  ContainerOutlined,
  FileTextOutlined,
  BarChartOutlined,
  ShareAltOutlined
} from '@ant-design/icons';
import ReactFlow, {
  ReactFlowProvider,
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  NodeTypes,
  Position,
  Handle,
  NodeProps,
  ReactFlowInstance
} from 'reactflow';
import 'reactflow/dist/style.css';

interface ServiceNodeData {
  name: string;
  type: string;
  status: 'healthy' | 'warning' | 'critical';
  zone: string;
  metrics?: {
    avg: string; // e.g., '15.65 s'
    min: string; // e.g., '0.00 ms'
    max: string; // e.g., '15.00 s'
    count: number; // e.g., 20
  };
  details: {
    containers?: number;
    processes?: number;
    jvms?: number;
    apps?: string[];
    agents?: string[];
    servers?: string[];
  };
}

// ===== Operation Drawer Node Types =====
type OpsKind = 'HTTP' | 'DATABASE' | 'GENERAL';
interface OpsNodeData {
  kind: OpsKind;
  title: string;          // e.g., GET /products or pg-pool.connect
  subtitle1?: string;     // e.g., unspecified
  subtitle2?: string;     // e.g., postgresql
  duration?: string;      // e.g., 149ms
  hasError?: boolean;
}

const getKindColors = (kind: OpsKind) => {
  switch (kind) {
    case 'HTTP':
      return { border: '#d1fadf', headerBg: '#22c55e', headerText: '#052e16' };
    case 'DATABASE':
      return { border: '#ede9fe', headerBg: '#a78bfa', headerText: '#1e1b4b' };
    case 'GENERAL':
    default:
      return { border: '#fde68a', headerBg: '#f59e0b', headerText: '#451a03' };
  }
};

const OpsNode: React.FC<NodeProps<OpsNodeData>> = ({ data }) => {
  const c = getKindColors(data.kind);
  return (
    <div style={{
      width: 220,
      background: '#ffffff',
      borderRadius: 10,
      border: `2px solid ${c.border}`,
      boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
      overflow: 'hidden',
      fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial'
    }}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderBottom: '1px solid #eef2f7' }}>
        <div style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: 0.4,
          color: c.headerText,
          background: c.headerBg,
          borderRadius: 4,
          padding: '2px 6px'
        }}>{data.kind}</div>
        <div style={{ color: '#111827', fontWeight: 700, fontSize: 13, lineHeight: '16px' }}>{data.title}</div>
      </div>
      {/* content */}
      <div style={{ padding: '10px 12px', color: '#6b7280', fontSize: 12 }}>
        {data.subtitle1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span style={{ width: 6, height: 6, background: '#94a3b8', borderRadius: 6 }} />
            <span>{data.subtitle1}</span>
          </div>
        )}
        {data.subtitle2 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span style={{ width: 6, height: 6, background: '#94a3b8', borderRadius: 6 }} />
            <span>{data.subtitle2}</span>
          </div>
        )}
        {data.duration && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 6, height: 6, background: '#94a3b8', borderRadius: 6 }} />
            <span>{data.duration}</span>
          </div>
        )}
      </div>
    </div>
  );
};

// Custom 3D Node Component
const Service3DNode: React.FC<NodeProps<ServiceNodeData>> = ({ data, selected }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return '#10b981';
      case 'warning': return '#f59e0b';
      case 'critical': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'platform': return <CloudServerOutlined />;
      case 'database': return <DatabaseOutlined />;
      case 'api': return <ApiOutlined />;
      case 'container': return <ContainerOutlined />;
      default: return <CloudServerOutlined />;
    }
  };

  return (
    <div
      style={{
        background: 'linear-gradient(145deg, #1e293b, #334155)',
        border: `2px solid ${getStatusColor(data.status)}`,
        borderRadius: '12px',
        padding: '16px',
        minWidth: '180px',
        boxShadow: selected 
          ? `0 0 20px ${getStatusColor(data.status)}40` 
          : '0 4px 12px rgba(0,0,0,0.3)',
        transform: selected ? 'scale(1.05)' : 'scale(1)',
        transition: 'all 0.2s ease',
        position: 'relative',
        overflow: 'hidden'
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
          backgroundColor: getStatusColor(data.status),
          boxShadow: `0 0 8px ${getStatusColor(data.status)}`
        }}
      />
      
      {/* Node Content */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <div style={{ color: getStatusColor(data.status), fontSize: '16px' }}>
            {getTypeIcon(data.type)}
          </div>
          <div style={{ color: '#ffffff', fontWeight: 'bold', fontSize: '14px' }}>
            {data.name}
          </div>
        </div>
        
        <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}>
          {data.type.toUpperCase()}
        </div>
        
        <div style={{ color: '#64748b', fontSize: '11px' }}>
          Zone: {data.zone}
        </div>
        
        {/* Details */}
        <div style={{ marginTop: '8px', fontSize: '10px', color: '#94a3b8' }}>
          {data.details.containers && (
            <div>{data.details.containers} Containers</div>
          )}
          {data.details.processes && (
            <div>{data.details.processes} Processes</div>
          )}
          {data.details.jvms && (
            <div>{data.details.jvms} JVMs</div>
          )}
        </div>

      {/* Metrics */}
      {data.metrics && (
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
              <div style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '12px' }}>{data.metrics.avg}</div>
            </div>
            <div>
              <div style={{ color: '#94a3b8', fontSize: '10px' }}>Min. Lat</div>
              <div style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '12px' }}>{data.metrics.min}</div>
            </div>
            <div>
              <div style={{ color: '#94a3b8', fontSize: '10px' }}>Max. Lat</div>
              <div style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '12px' }}>{data.metrics.max}</div>
            </div>
            <div>
              <div style={{ color: '#94a3b8', fontSize: '10px' }}>Count</div>
              <div style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '12px' }}>{data.metrics.count}</div>
            </div>
          </div>
        </div>
      )}
      </div>
      
      {/* Handles */}
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: getStatusColor(data.status), border: 'none' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: getStatusColor(data.status), border: 'none' }}
      />
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: getStatusColor(data.status), border: 'none' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: getStatusColor(data.status), border: 'none' }}
      />
    </div>
  );
};

// Zone Node Component
const ZoneNode: React.FC<NodeProps<{ name: string; color: string; nodeCount: number }>> = ({ data }) => {
  return (
    <div
      style={{
        background: `linear-gradient(135deg, ${data.color}20, ${data.color}10)`,
        border: `2px dashed ${data.color}`,
        borderRadius: '16px',
        padding: '20px',
        minWidth: '200px',
        textAlign: 'center',
        position: 'relative'
      }}
    >
      <div style={{ color: data.color, fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>
        {data.name}
      </div>
      <div style={{ color: '#64748b', fontSize: '12px' }}>
        {data.nodeCount} Services
      </div>
    </div>
  );
};

// Service Detail Panel Component
const ServiceDetailPanel: React.FC<{ 
  node: Node<ServiceNodeData> | null; 
  onClose: () => void; 
}> = ({ node, onClose }) => {
  if (!node) return null;

  const data = node.data;

  return (
    <div
      style={{
        position: 'absolute',
        right: '20px',
        top: '20px',
        width: '350px',
        background: 'rgba(30, 41, 59, 0.95)',
        border: '1px solid #334155',
        borderRadius: '12px',
        padding: '20px',
        color: '#ffffff',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        backdropFilter: 'blur(10px)',
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
            {data.type.toUpperCase()}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            fontSize: '18px',
            cursor: 'pointer',
            padding: '4px'
          }}
        >
          ×
        </button>
      </div>

      {/* Service Info */}
      <div style={{ marginBottom: '16px' }}>
        <h4 style={{ color: '#ffffff', margin: '0 0 8px 0', fontSize: '14px' }}>Service</h4>
        <div style={{ color: '#94a3b8', fontSize: '12px', lineHeight: '1.4' }}>
          <div><strong>Namespace:</strong> {data.zone}</div>
          <div><strong>Name:</strong> {data.name}</div>
        </div>
      </div>

      {/* Runtime Info */}
      <div style={{ marginBottom: '16px' }}>
        <h4 style={{ color: '#ffffff', margin: '0 0 8px 0', fontSize: '14px' }}>Runtime</h4>
        <div style={{ color: '#94a3b8', fontSize: '12px', lineHeight: '1.4' }}>
          <div><strong>Language:</strong> {data.type === 'platform' ? 'go' : data.type === 'container' ? 'docker' : 'java'}</div>
          <div><strong>Version:</strong> {data.type === 'platform' ? 'go1.22.0' : data.type === 'container' ? 'latest' : '11.0.0'}</div>
        </div>
      </div>

      {/* Kubernetes Info */}
      <div style={{ marginBottom: '16px' }}>
        <h4 style={{ color: '#ffffff', margin: '0 0 8px 0', fontSize: '14px' }}>Kubernetes</h4>
        <div style={{ color: '#94a3b8', fontSize: '12px', lineHeight: '1.4' }}>
          <div><strong>Namespace:</strong> {data.zone.toLowerCase().replace(/\s+/g, '-')}</div>
          <div><strong>Deployment:</strong> {data.name.toLowerCase().replace(/\s+/g, '-')}</div>
          <div><strong>ReplicaSet:</strong> {data.name.toLowerCase().replace(/\s+/g, '-')}-...</div>
        </div>
      </div>

      {/* AWS Info */}
      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ color: '#ffffff', margin: '0 0 8px 0', fontSize: '14px' }}>AWS</h4>
        <div style={{ color: '#94a3b8', fontSize: '12px', lineHeight: '1.4' }}>
          <div><strong>Account:</strong> 034437666789</div>
          <div><strong>Region:</strong> eu-west-1</div>
          <div><strong>Availability zone:</strong> eu-west-1a</div>
        </div>
      </div>

      {/* Status */}
      <div style={{ 
        marginBottom: '20px',
        padding: '12px',
        background: data.status === 'healthy' ? 'rgba(16, 185, 129, 0.1)' : 
                   data.status === 'warning' ? 'rgba(245, 158, 11, 0.1)' : 
                   'rgba(239, 68, 68, 0.1)',
        border: `1px solid ${data.status === 'healthy' ? '#10b981' : 
                           data.status === 'warning' ? '#f59e0b' : '#ef4444'}`,
        borderRadius: '8px'
      }}>
        <div style={{ 
          color: data.status === 'healthy' ? '#10b981' : 
                 data.status === 'warning' ? '#f59e0b' : '#ef4444',
          fontWeight: 'bold',
          fontSize: '14px',
          marginBottom: '4px'
        }}>
          {data.status.toUpperCase()}
        </div>
        <div style={{ color: '#94a3b8', fontSize: '12px' }}>
          All checks passed between 09:47 - 10:17 (30 m)
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ 
        display: 'flex', 
        gap: '8px',
        background: 'rgba(15, 23, 42, 0.8)',
        padding: '12px',
        borderRadius: '8px'
      }}>
        <button style={{
          flex: 1,
          background: 'rgba(30, 41, 59, 0.8)',
          border: '1px solid #334155',
          borderRadius: '6px',
          padding: '8px 12px',
          color: '#ffffff',
          fontSize: '12px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <FileTextOutlined />
          Logs {data.details.processes ? `${data.details.processes}K` : '4K'}
        </button>
        <button style={{
          flex: 1,
          background: 'rgba(30, 41, 59, 0.8)',
          border: '1px solid #334155',
          borderRadius: '6px',
          padding: '8px 12px',
          color: '#ffffff',
          fontSize: '12px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <BarChartOutlined />
          Metrics {data.details.jvms ? `${data.details.jvms}K` : '7K'}
        </button>
        <button style={{
          flex: 1,
          background: 'rgba(30, 41, 59, 0.8)',
          border: '1px solid #334155',
          borderRadius: '6px',
          padding: '8px 12px',
          color: '#ffffff',
          fontSize: '12px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <ShareAltOutlined />
          Spans {data.details.containers ? `${data.details.containers}K` : '5K'}
        </button>
      </div>
    </div>
  );
};

const ServiceMap3D: React.FC = () => {
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<Node<ServiceNodeData> | null>(null);
  const [clickedNode, setClickedNode] = useState<Node<ServiceNodeData> | null>(null);
  const [opsOpen, setOpsOpen] = useState<boolean>(false);
  const [opsNodes, setOpsNodes] = useState<Node[]>([]);
  const [opsEdges, setOpsEdges] = useState<Edge[]>([]);

  // Node types for ReactFlow
  const nodeTypes: NodeTypes = useMemo(() => ({
    service3d: Service3DNode,
    zone: ZoneNode,
  }), []);

  // Static data for ReactFlow nodes - updated to match the provided diagram
  const initialNodes: Node[] = [
    // Left sources
    { id: 'internet', type: 'service3d', position: { x: 40, y: 40 }, data: { name: 'Internet', type: 'api', status: 'healthy', zone: 'external', metrics: { avg: '12.10 ms', min: '1.20 ms', max: '44.00 ms', count: 1800 }, details: {} } },
    { id: 'loadgen', type: 'service3d', position: { x: 40, y: 300 }, data: { name: 'Load Generator', type: 'api', status: 'healthy', zone: 'tools', metrics: { avg: '6.80 ms', min: '0.90 ms', max: '25.00 ms', count: 5000 }, details: {} } },
    { id: 'reactnative', type: 'service3d', position: { x: 40, y: 540 }, data: { name: 'React Native App', type: 'api', status: 'healthy', zone: 'mobile', metrics: { avg: '28.50 ms', min: '2.10 ms', max: '120.00 ms', count: 900 }, details: {} } },

    // Entry gateway
    { id: 'frontend-proxy', type: 'service3d', position: { x: 220, y: 260 }, data: { name: 'Frontend Proxy\n(Envoy)', type: 'api', status: 'warning', zone: 'edge', metrics: { avg: '15.65 s', min: '0.00 ms', max: '15.00 s', count: 20 }, details: {} } },

    // Left lower
    { id: 'flagd-ui', type: 'service3d', position: { x: 240, y: 470 }, data: { name: 'Flagd-ui', type: 'api', status: 'healthy', zone: 'ui', metrics: { avg: '9.40 ms', min: '1.00 ms', max: '60.00 ms', count: 320 }, details: {} } },
    { id: 'image-provider', type: 'service3d', position: { x: 240, y: 620 }, data: { name: 'Image Provider\n(nginx)', type: 'api', status: 'healthy', zone: 'media', metrics: { avg: '4.10 ms', min: '0.50 ms', max: '30.00 ms', count: 2200 }, details: {} } },

    // Frontend and core path
    { id: 'frontend', type: 'service3d', position: { x: 360, y: 320 }, data: { name: 'Frontend', type: 'api', status: 'warning', zone: 'web', metrics: { avg: '45.30 ms', min: '5.20 ms', max: '340.00 ms', count: 7800 }, details: {} } },
    { id: 'checkout', type: 'service3d', position: { x: 500, y: 360 }, data: { name: 'Checkout', type: 'api', status: 'healthy', zone: 'backend', metrics: { avg: '22.40 ms', min: '3.10 ms', max: '110.00 ms', count: 6400 }, details: {} } },
    { id: 'queue', type: 'service3d', position: { x: 620, y: 330 }, data: { name: 'queue\n(Kafka)', type: 'api', status: 'healthy', zone: 'messaging', metrics: { avg: '8.10 ms', min: '1.10 ms', max: '90.00 ms', count: 12500 }, details: {} } },

    // Services around checkout
    { id: 'currency', type: 'service3d', position: { x: 660, y: 180 }, data: { name: 'Currency', type: 'api', status: 'healthy', zone: 'svc', metrics: { avg: '5.70 ms', min: '0.80 ms', max: '40.00 ms', count: 5400 }, details: {} } },
    { id: 'cart', type: 'service3d', position: { x: 660, y: 250 }, data: { name: 'Cart', type: 'api', status: 'healthy', zone: 'svc', metrics: { avg: '18.20 ms', min: '2.00 ms', max: '150.00 ms', count: 6100 }, details: {} } },
    { id: 'cache', type: 'service3d', position: { x: 760, y: 160 }, data: { name: 'Cache\n(Valkey)', type: 'api', status: 'healthy', zone: 'infra', metrics: { avg: '1.90 ms', min: '0.30 ms', max: '10.00 ms', count: 22000 }, details: {} } },

    { id: 'accounting', type: 'service3d', position: { x: 820, y: 300 }, data: { name: 'Accounting', type: 'api', status: 'healthy', zone: 'svc', metrics: { avg: '11.60 ms', min: '1.20 ms', max: '85.00 ms', count: 4100 }, details: {} } },
    { id: 'fraud', type: 'service3d', position: { x: 820, y: 360 }, data: { name: 'Fraud Detection', type: 'api', status: 'healthy', zone: 'svc', metrics: { avg: '19.40 ms', min: '2.10 ms', max: '130.00 ms', count: 3900 }, details: {} } },
    { id: 'payment', type: 'service3d', position: { x: 820, y: 420 }, data: { name: 'Payment', type: 'api', status: 'warning', zone: 'svc', metrics: { avg: '27.80 ms', min: '3.20 ms', max: '210.00 ms', count: 3700 }, details: {} } },
    { id: 'email', type: 'service3d', position: { x: 820, y: 500 }, data: { name: 'Email', type: 'api', status: 'healthy', zone: 'svc', metrics: { avg: '5.20 ms', min: '0.70 ms', max: '40.00 ms', count: 7300 }, details: {} } },
    { id: 'quote', type: 'service3d', position: { x: 820, y: 580 }, data: { name: 'Quote', type: 'api', status: 'healthy', zone: 'svc', metrics: { avg: '8.60 ms', min: '1.10 ms', max: '60.00 ms', count: 4200 }, details: {} } },
    { id: 'shipping', type: 'service3d', position: { x: 700, y: 520 }, data: { name: 'Shipping', type: 'api', status: 'healthy', zone: 'svc', metrics: { avg: '13.30 ms', min: '1.60 ms', max: '90.00 ms', count: 2800 }, details: {} } },
    { id: 'recommendation', type: 'service3d', position: { x: 900, y: 640 }, data: { name: 'Recommendation', type: 'api', status: 'healthy', zone: 'svc', metrics: { avg: '7.40 ms', min: '0.90 ms', max: '55.00 ms', count: 5100 }, details: {} } },
    { id: 'product-catalog', type: 'service3d', position: { x: 1040, y: 640 }, data: { name: 'Product Catalog', type: 'api', status: 'healthy', zone: 'svc', metrics: { avg: '6.10 ms', min: '0.80 ms', max: '48.00 ms', count: 5500 }, details: {} } },
    { id: 'ad', type: 'service3d', position: { x: 600, y: 60 }, data: { name: 'Ad', type: 'api', status: 'healthy', zone: 'svc', metrics: { avg: '3.90 ms', min: '0.40 ms', max: '20.00 ms', count: 2600 }, details: {} } },

    // Feature flag / database
    { id: 'flagd', type: 'service3d', position: { x: 1040, y: 360 }, data: { name: 'Flagd', type: 'api', status: 'warning', zone: 'control', metrics: { avg: '9.80 ms', min: '1.20 ms', max: '65.00 ms', count: 6200 }, details: {} } },
    { id: 'database', type: 'service3d', position: { x: 1180, y: 280 }, data: { name: 'Database\n(PostgreSQL)', type: 'database', status: 'healthy', zone: 'db', metrics: { avg: '2.40 ms', min: '0.30 ms', max: '18.00 ms', count: 34000 }, details: {} } }
  ];

  // Static data for ReactFlow edges - updated relationships with protocol labels
  const initialEdges: Edge[] = [
    // Ingress
    { id: 'e1', source: 'internet', target: 'frontend-proxy', type: 'smoothstep', animated: true, label: 'HTTP' },
    { id: 'e2', source: 'loadgen', target: 'frontend-proxy', type: 'smoothstep', animated: true, label: 'HTTP' },
    { id: 'e3', source: 'reactnative', target: 'frontend-proxy', type: 'smoothstep', animated: true, label: 'HTTP' },

    // Proxy to frontend and auxiliary UIs
    { id: 'e4', source: 'frontend-proxy', target: 'frontend', type: 'smoothstep', animated: true, label: 'HTTP' },
    { id: 'e5', source: 'frontend-proxy', target: 'flagd-ui', type: 'smoothstep', animated: true, label: 'HTTP' },
    { id: 'e6', source: 'frontend-proxy', target: 'image-provider', type: 'smoothstep', animated: true, label: 'HTTP' },

    // Frontend to backend
    { id: 'e7', source: 'frontend', target: 'checkout', type: 'smoothstep', animated: true, label: 'HTTP' },

    // Checkout to services
    { id: 'e8', source: 'checkout', target: 'currency', type: 'smoothstep', animated: true, label: 'gRPC' },
    { id: 'e9', source: 'checkout', target: 'cart', type: 'smoothstep', animated: true, label: 'gRPC' },
    { id: 'e10', source: 'checkout', target: 'queue', type: 'smoothstep', animated: true, label: 'TCP' },
    { id: 'e11', source: 'checkout', target: 'shipping', type: 'smoothstep', animated: true, label: 'HTTP' },
    { id: 'e12', source: 'checkout', target: 'email', type: 'smoothstep', animated: true, label: 'HTTP' },
    { id: 'e13', source: 'checkout', target: 'quote', type: 'smoothstep', animated: true, label: 'gRPC' },

    // Service-to-service
    { id: 'e14', source: 'currency', target: 'cache', type: 'smoothstep', animated: true, label: 'gRPC' },
    { id: 'e15', source: 'cart', target: 'accounting', type: 'smoothstep', animated: true, label: 'gRPC' },
    { id: 'e16', source: 'fraud', target: 'queue', type: 'smoothstep', animated: true, label: 'TCP' },
    { id: 'e17', source: 'payment', target: 'queue', type: 'smoothstep', animated: true, label: 'TCP' },

    // Recommendation and catalog
    { id: 'e18', source: 'recommendation', target: 'product-catalog', type: 'smoothstep', animated: true, label: 'gRPC' },
    { id: 'e19', source: 'frontend', target: 'recommendation', type: 'smoothstep', animated: true, label: 'gRPC' },

    // Flags and DB
    { id: 'e20', source: 'accounting', target: 'flagd', type: 'smoothstep', animated: true, label: 'gRPC' },
    { id: 'e21', source: 'fraud', target: 'flagd', type: 'smoothstep', animated: true, label: 'gRPC' },
    { id: 'e22', source: 'payment', target: 'flagd', type: 'smoothstep', animated: true, label: 'gRPC' },
    { id: 'e23', source: 'flagd', target: 'database', type: 'smoothstep', animated: true, label: 'gRPC' },

    // Ads path
    { id: 'e24', source: 'frontend', target: 'ad', type: 'smoothstep', animated: true, label: 'gRPC' }
  ];

  // Increase spacing between nodes without changing the manual layout
  const spacingScale = 2.05;
  const initialNodesScaled: Node[] = initialNodes.map((n) => ({
    ...n,
    position: { x: n.position.x * spacingScale, y: n.position.y * spacingScale },
  }));

  const [nodes, , onNodesChange] = useNodesState(initialNodesScaled);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  // Get connected nodes and edges for highlighting
  const getConnectedElements = useCallback((nodeId: string) => {
    const connectedNodeIds = new Set<string>();
    const connectedEdgeIds = new Set<string>();

    // Find all edges connected to this node
    edges.forEach(edge => {
      if (edge.source === nodeId || edge.target === nodeId) {
        connectedEdgeIds.add(edge.id);
        connectedNodeIds.add(edge.source);
        connectedNodeIds.add(edge.target);
      }
    });

    return { connectedNodeIds, connectedEdgeIds };
  }, [edges]);

  // Highlight connected elements
  const highlightedNodes = useMemo(() => {
    if (!hoveredNodeId) return new Set<string>();
    const { connectedNodeIds } = getConnectedElements(hoveredNodeId);
    return connectedNodeIds;
  }, [hoveredNodeId, getConnectedElements]);

  const highlightedEdges = useMemo(() => {
    if (!hoveredNodeId) return new Set<string>();
    const { connectedEdgeIds } = getConnectedElements(hoveredNodeId);
    return connectedEdgeIds;
  }, [hoveredNodeId, getConnectedElements]);

  const onInit = useCallback((rf: ReactFlowInstance) => {
    rf.fitView({ padding: 0.12, includeHiddenNodes: true });
    const v = rf.getViewport();
    rf.setViewport({ x: v.x, y: v.y + 180, zoom: v.zoom });
  }, []);

  const onNodeMouseEnter = useCallback((event: React.MouseEvent, node: Node) => {
    if (node.type === 'service3d') {
      setHoveredNodeId(node.id);
      setHoveredNode(node as Node<ServiceNodeData>);
    }
  }, []);

  const onNodeMouseLeave = useCallback(() => {
    setHoveredNodeId(null);
    setHoveredNode(null);
  }, []);

  const onPaneClick = useCallback(() => {
    setHoveredNodeId(null);
    setHoveredNode(null);
    setClickedNode(null);
    setOpsOpen(false);
  }, []);

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    if (node.type === 'service3d') {
      setClickedNode(node as Node<ServiceNodeData>);
    }
  }, []);

  const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    const protocol = (edge.label as string) || 'HTTP';
    const baseY = 40;
    const centerX = 600; // center anchor for better spacing
    const opNodes: Node[] = [
      { id: 'op_trigger', type: 'ops', position: { x: centerX, y: baseY }, data: { kind: 'GENERAL', title: 'Tracetest trigger', subtitle1: 'unspecified', duration: '713ms' } },
      { id: 'op_entry', type: 'ops', position: { x: centerX, y: baseY + 120 }, data: { kind: 'HTTP', title: `${protocol} GET /products`, subtitle1: 'unspecified', duration: '223ms' } },

      { id: 'op_mw_query', type: 'ops', position: { x: centerX - 480, y: baseY + 240 }, data: { kind: 'HTTP', title: 'middleware - query', subtitle1: 'unspecified', duration: '1ms' } },
      { id: 'op_mw_cors', type: 'ops', position: { x: centerX - 240, y: baseY + 240 }, data: { kind: 'HTTP', title: 'middleware - corsMiddleware', subtitle1: 'unspecified', duration: '0ms' } },
      { id: 'op_mw_init', type: 'ops', position: { x: centerX, y: baseY + 240 }, data: { kind: 'HTTP', title: 'middleware - expressInit', subtitle1: 'unspecified', duration: '0ms' } },
      { id: 'op_mw_json', type: 'ops', position: { x: centerX + 240, y: baseY + 240 }, data: { kind: 'HTTP', title: 'middleware - jsonParser', subtitle1: 'unspecified', duration: '0ms' } },
      { id: 'op_handler', type: 'ops', position: { x: centerX + 480, y: baseY + 240 }, data: { kind: 'HTTP', title: 'request handler - /products', subtitle1: 'unspecified', duration: '0ms' } },
      { id: 'op_pgpool', type: 'ops', position: { x: centerX + 720, y: baseY + 240 }, data: { kind: 'DATABASE', title: 'pg-pool.connect', subtitle1: 'unspecified', subtitle2: 'postgresql', duration: '149ms' } },
      { id: 'op_pgquery', type: 'ops', position: { x: centerX + 960, y: baseY + 240 }, data: { kind: 'DATABASE', title: 'pg.query:SELECT ecommerce', subtitle1: 'unspecified', subtitle2: 'postgresql', duration: '48ms' } },

      { id: 'op_pgconnect', type: 'ops', position: { x: centerX + 240, y: baseY + 380 }, data: { kind: 'DATABASE', title: 'pg.connect', subtitle1: 'unspecified', subtitle2: 'postgresql', duration: '132ms' } },
      { id: 'op_tcp', type: 'ops', position: { x: centerX + 120, y: baseY + 520 }, data: { kind: 'GENERAL', title: 'tcp.connect', subtitle1: 'unspecified', duration: '6ms' } },
      { id: 'op_dns', type: 'ops', position: { x: centerX + 360, y: baseY + 520 }, data: { kind: 'GENERAL', title: 'dns.lookup', subtitle1: 'unspecified', duration: '6ms' } },
    ];
    const edgeStyle = { stroke: '#cbd5e1', strokeWidth: 2.2 } as const;
    const opEdges: Edge[] = [
      { id: 'oe1', type: 'smoothstep', source: 'op_trigger', target: 'op_entry', style: edgeStyle, markerEnd: 'arrowclosed' },
      { id: 'oe2', type: 'smoothstep', source: 'op_entry', target: 'op_mw_query', style: edgeStyle, markerEnd: 'arrowclosed' },
      { id: 'oe3', type: 'smoothstep', source: 'op_entry', target: 'op_mw_cors', style: edgeStyle, markerEnd: 'arrowclosed' },
      { id: 'oe4', type: 'smoothstep', source: 'op_entry', target: 'op_mw_init', style: edgeStyle, markerEnd: 'arrowclosed' },
      { id: 'oe5', type: 'smoothstep', source: 'op_entry', target: 'op_mw_json', style: edgeStyle, markerEnd: 'arrowclosed' },
      { id: 'oe6', type: 'smoothstep', source: 'op_entry', target: 'op_handler', style: edgeStyle, markerEnd: 'arrowclosed' },
      { id: 'oe7', type: 'smoothstep', source: 'op_entry', target: 'op_pgpool', style: edgeStyle, markerEnd: 'arrowclosed' },
      { id: 'oe8', type: 'smoothstep', source: 'op_entry', target: 'op_pgquery', style: edgeStyle, markerEnd: 'arrowclosed' },
      { id: 'oe9', type: 'smoothstep', source: 'op_entry', target: 'op_pgconnect', style: edgeStyle, markerEnd: 'arrowclosed' },
      { id: 'oe10', type: 'smoothstep', source: 'op_pgconnect', target: 'op_tcp', style: edgeStyle, markerEnd: 'arrowclosed' },
      { id: 'oe11', type: 'smoothstep', source: 'op_pgconnect', target: 'op_dns', style: edgeStyle, markerEnd: 'arrowclosed' },
    ];
    setOpsNodes(opNodes);
    setOpsEdges(opEdges);
    setOpsOpen(true);
  }, []);

  const closeDetailPanel = useCallback(() => {
    setClickedNode(null);
  }, []);

  return (
    <div style={{ 
      height: '98%', 
      display: 'flex', 
      flexDirection: 'column',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
    }}>
     

      {/* ReactFlow Container */}
      <div style={{ flex: 1, position: 'relative' }}>
        <ReactFlowProvider>
          <ReactFlow
            nodes={nodes.map(node => ({
              ...node,
              style: {
                ...node.style,
                opacity: hoveredNodeId && !highlightedNodes.has(node.id) ? 0.3 : 1,
                transition: 'opacity 0.2s ease'
              }
            }))}
            edges={edges.map(edge => ({
              ...edge,
              style: {
                ...edge.style,
                opacity: hoveredNodeId && !highlightedEdges.has(edge.id) ? 0.2 : 1,
                strokeWidth: highlightedEdges.has(edge.id) ? 3 : 2,
                transition: 'all 0.2s ease'
              }
            }))}
            onInit={onInit}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            onEdgeClick={onEdgeClick}
            onNodeMouseEnter={onNodeMouseEnter}
            onNodeMouseLeave={onNodeMouseLeave}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.12, includeHiddenNodes: true }}
            minZoom={0.5}
            maxZoom={2}
            attributionPosition="bottom-left"
            style={{
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
            }}
          >
            <Background 
              color="#1e293b" 
              gap={50} 
              size={1} 
              style={{ opacity: 0.3 }}
            />
            <Controls 
              position="bottom-left"
              style={{
                background: 'rgba(15, 23, 42, 0.9)',
                border: '1px solid #334155',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
              }}
            />
            <MiniMap 
              position="bottom-right"
              style={{
                background: 'rgba(15, 23, 42, 0.9)',
                border: '1px solid #334155',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
              }}
              nodeColor={(node) => {
                if (node.type === 'zone') return node.data?.color || '#6b7280';
                const status = node.data?.status;
                switch (status) {
                  case 'healthy': return '#10b981';
                  case 'warning': return '#f59e0b';
                  case 'critical': return '#ef4444';
                  default: return '#6b7280';
                }
              }}
              maskColor="rgba(0, 0, 0, 0.3)"
            />
          </ReactFlow>
        </ReactFlowProvider>
        
        {/* Hover Panel - top-left */}
        {hoveredNode && (
          <div
            style={{
              position: 'absolute',
              left: '20px',
              top: '20px',
              width: '420px',
              background: 'rgba(17, 24, 39, 0.96)',
              border: '1px solid #334155',
              borderRadius: '12px',
              padding: '16px',
              color: '#fff',
              zIndex: 1000,
              boxShadow: '0 8px 24px rgba(0,0,0,0.35)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>service.namespace = {hoveredNode.data.zone.toLowerCase().replace(/\s+/g,'-')}</div>
                <div style={{ fontSize: '18px', fontWeight: 700 }}>{hoveredNode.data.name}</div>
              </div>
              <div style={{
                padding: '2px 6px',
                borderRadius: '6px',
                background: '#334155',
                color: '#cbd5e1',
                height: '22px'
              }}>RPC</div>
            </div>

            <div style={{ borderTop: '1px solid #334155', paddingTop: '12px' }}>
              <div style={{ color: '#94a3b8', fontSize: '12px' }}>Summary</div>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '6px', marginTop: '8px', fontSize: '12px' }}>
                <div style={{ color: '#94a3b8' }}>Service</div>
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '6px' }}>
                    <div style={{ color: '#94a3b8' }}>Namespace</div>
                    <div>{hoveredNode.data.zone.toLowerCase().replace(/\s+/g,'-')}</div>
                    <div style={{ color: '#94a3b8' }}>Name</div>
                    <div>{hoveredNode.data.name.toLowerCase().replace(/\s+/g,'')}</div>
                  </div>
                </div>
                <div style={{ color: '#94a3b8', marginTop: '8px' }}>Runtime</div>
                <div style={{ marginTop: '8px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '6px' }}>
                    <div style={{ color: '#94a3b8' }}>Language</div>
                    <div>go</div>
                    <div style={{ color: '#94a3b8' }}>Version</div>
                    <div>go1.22.0</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Operations Drawer (bottom slide-up) */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: opsOpen ? '55%' : '0%',
            background: 'rgba(15, 23, 42, 0.98)',
            borderTop: opsOpen ? '1px solid #334155' : 'none',
            transition: 'height 280ms ease',
            overflow: 'hidden',
            zIndex: 1000,
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderBottom: '1px solid #334155' }}>
            <div style={{ color: '#e2e8f0', fontWeight: 600 }}>Operations Map</div>
            <button onClick={() => setOpsOpen(false)} style={{ background: 'none', border: '1px solid #334155', color: '#94a3b8', borderRadius: 6, padding: '4px 8px', cursor: 'pointer' }}>Close</button>
          </div>

          <div style={{ height: 'calc(100% - 42px)' }}>
            <ReactFlowProvider>
              <ReactFlow
                nodes={opsNodes}
                edges={opsEdges}
                nodeTypes={{ ops: OpsNode }}
                fitView
                fitViewOptions={{ padding: 0.2 }}
                nodesDraggable={false}
                nodesConnectable={false}
                elementsSelectable={false}
                panOnDrag
                zoomOnScroll
                style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}
              >
                <Background color="#1e293b" gap={30} size={1} style={{ opacity: 0.2 }} />
                <Controls 
                  position="bottom-left"
                  style={{
                    background: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#e2e8f0'
                  }}
                />
              </ReactFlow>
            </ReactFlowProvider>
          </div>
        </div>

        {/* Persistent Right Drawer Panel */}
        <ServiceDetailPanel 
          node={clickedNode} 
          onClose={closeDetailPanel} 
        />
      </div>
    </div>
  );
};

export default ServiceMap3D;