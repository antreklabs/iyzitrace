import React, { useMemo } from 'react';
import { Card } from 'antd';
import {
  ReactFlowProvider,
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';

// Isometric 3D block node
const IsoBlockNode: React.FC<any> = ({ data }) => {
  const accent = data?.accent || '#22c55e';
  const label = data?.label || 'service';
  const sub = data?.sub || 'online';

  const container: React.CSSProperties = {
    width: 180,
    height: 140,
    perspective: 700,
    position: 'relative',
    filter: 'drop-shadow(0 12px 24px rgba(0,0,0,0.75)) drop-shadow(0 0 0.5px rgba(226,232,240,0.45))',
  };

  const base: React.CSSProperties = {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 22,
    margin: '0 auto',
    width: 160,
    height: 90,
    transformStyle: 'preserve-3d',
    transform: 'rotateX(58deg) rotateZ(-45deg)',
  } as any;

  const faceCommon: React.CSSProperties = {
    position: 'absolute',
    width: '100%',
    height: '100%',
    border: '1px solid rgba(203,213,225,0.35)',
    boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1)',
  };

  const top: React.CSSProperties = {
    ...faceCommon,
    background: 'linear-gradient(180deg, #3a4a66 0%, #1e2b45 100%)',
    transform: 'translateZ(24px)',
  };
  const left: React.CSSProperties = {
    ...faceCommon,
    background: 'linear-gradient(180deg, #445575 0%, #2a3a59 100%)',
    transform: 'rotateY(-90deg) translateZ(80px)',
    width: 48,
  } as any;
  const right: React.CSSProperties = {
    ...faceCommon,
    background: 'linear-gradient(180deg, #3f4f6d 0%, #21304c 100%)',
    transform: 'rotateX(90deg) translateZ(45px)',
    height: 48,
  } as any;

  const statusBadge: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    background: accent,
    color: '#0b1220',
    fontWeight: 600,
    fontSize: 11,
    padding: '4px 8px',
    borderRadius: 6,
    transform: 'translate(8px, -6px)',
  };

  const titleStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: -8,
    left: '50%',
    transform: 'translateX(-50%)',
    color: '#e2e8f0',
    fontWeight: 600,
    fontSize: 14,
  };

  return (
    <div style={container}>
      <div style={statusBadge}>{sub}</div>
      <div style={base}>
        <div style={{...top, boxShadow: '0 4px 18px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(255,255,255,0.08)', borderColor: 'rgba(226,232,240,0.15)'}} />
        <div style={left} />
        <div style={right} />
        <div style={{ position: 'absolute', inset: 0, boxShadow: '0 26px 56px rgba(0,0,0,0.65)' }} />
      </div>
      <div style={titleStyle}>{label}</div>
    </div>
  );
};

const ServiceMapV4Inner: React.FC = () => {
  const initialNodes = useMemo(
    () => [
      {
        id: 'zone-a',
        position: { x: 40, y: 60 },
        data: { label: 'frontend', sub: 'online 44.2 rpm', accent: '#22c55e' },
        type: 'iso',
      },
      {
        id: 'zone-b',
        position: { x: 360, y: 200 },
        data: { label: 'checkout', sub: 'offline', accent: '#ef4444' },
        type: 'iso',
      },
      {
        id: 'zone-c',
        position: { x: 680, y: 120 },
        data: { label: 'cartservice', sub: 'online 1011 rpm', accent: '#22c55e' },
        type: 'iso',
      },
      {
        id: 'zone-d',
        position: { x: 360, y: 420 },
        data: { label: 'productcatalog', sub: 'online', accent: '#22c55e' },
        type: 'iso',
      },
    ],
    []
  );

  const initialEdges = useMemo(
    () => [
      { id: 'e1-2', source: 'zone-a', target: 'zone-b', type: 'smoothstep', animated: false, style: { stroke: '#94a3b8' } },
      { id: 'e2-3', source: 'zone-b', target: 'zone-c', type: 'smoothstep', animated: false, style: { stroke: '#94a3b8' } },
      { id: 'e1-4', source: 'zone-a', target: 'zone-d', type: 'smoothstep', animated: false, style: { stroke: '#94a3b8' } },
    ],
    []
  );

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  return (
    <div style={{ height: 'calc(100vh - 180px)', background: '#060a13', borderRadius: 8, overflow: 'hidden' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={{ iso: IsoBlockNode }}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.4}
        maxZoom={1.8}
      >
        <Background gap={24} color="#223047" />
        <MiniMap pannable zoomable nodeColor={() => '#6b7fa4'} maskColor="rgba(2,6,23,0.65)" />
        <Controls position="bottom-left" showInteractive={false} />
      </ReactFlow>
    </div>
  );
};

const ServiceMapV4Page: React.FC = () => {
  return (
    <div style={{ padding: 16 }}>
      <Card title="Service Map v4 (3D-style)" style={{ background: '#0f172a', borderColor: '#1f2937' }}>
        <ReactFlowProvider>
          <ServiceMapV4Inner />
        </ReactFlowProvider>
      </Card>
    </div>
  );
};

export default ServiceMapV4Page;


