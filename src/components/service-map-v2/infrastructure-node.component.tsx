import React from 'react';
import { Handle, Position } from 'reactflow';
import { Infrastructure } from '../../api/service/interface.service';

interface InfrastructureNodeProps {
  data: {
    infrastructure: Infrastructure;
    onNodeClick?: (id: string) => void;
  };
}

const getStatusColor = (status?: string) => {
  const s = status?.toLowerCase();
  if (s === 'ok' || s === 'healthy') return '#22c55e';
  if (s === 'warning' || s === 'degraded') return '#f59e0b';
  if (s === 'error') return '#ef4444';
  return '#6b7280';
};

export const InfrastructureNode: React.FC<InfrastructureNodeProps> = ({ data }) => {
  const { infrastructure, onNodeClick } = data;
  const statusColor = getStatusColor(infrastructure.status?.value);
  const accent = statusColor;
  const label = infrastructure.name;
  const sub = infrastructure.type || 'server';
  const baseW = 120;
  const baseH = 160;
  const W = Math.max(8, Math.round(baseW * 0.5));
  const H = Math.max(8, Math.round(baseH * 0.5));
  const k = W / baseW;

  const wrap: React.CSSProperties = {
    position: 'relative',
    top: 60,
    left: 30,
    width: Math.round(W + 40 * k),
    height: Math.round(H + 60 * k),
    filter: 'drop-shadow(0 14px 28px rgba(0,0,0,0.6))',
    cursor: 'pointer'
  };

  const sideCommon: React.CSSProperties = {
    position: 'absolute',
    top: Math.round(50 * k),
    width: W,
    height: H,
    background: 'linear-gradient(180deg, #e5e7eb 0%, #cbd5e1 100%)',
    border: '1px solid rgba(148,163,184,0.7)'
  };

  // Get gradient colors based on status
  const getGradientColors = () => {
    const s = infrastructure.status?.value?.toLowerCase();
    if (s === 'error') {
      return {
        right: 'linear-gradient(180deg, #fecaca 0%, #fca5a5 100%)',
        left: 'linear-gradient(180deg, #fee2e2 0%, #fecaca 100%)'
      };
    }
    if (s === 'warning' || s === 'degraded') {
      return {
        right: 'linear-gradient(180deg, #fed7aa 0%, #fdba74 100%)',
        left: 'linear-gradient(180deg, #ffedd5 0%, #fed7aa 100%)'
      };
    }
    
    return {
      right: 'linear-gradient(180deg, #dbeafe 0%, #c7d2fe 100%)',
      left: 'linear-gradient(180deg, #e2e8f0 0%, #cbd5e1 100%)'
    };
  };

  const gradients = getGradientColors();

  const right: React.CSSProperties = {
    ...sideCommon,
    left: Math.round(40 * k) + 20,
    top: Math.round(50 * k) + 20,
    transform: 'skewY(-28deg)',
    background: gradients.right
  };

  const left: React.CSSProperties = {
    ...sideCommon,
    left: -40 + 20,
    top: Math.round(50 * k) + 20,
    transform: 'skewY(28deg)',
    background: gradients.left
  };

  const rightBack: React.CSSProperties = {
    ...sideCommon,
    left: Math.round(-80 * k) + 20,
    top: Math.round(50 * k) - 15,
    transform: 'skewY(-28deg)',
    background: gradients.right
  };

  const leftBack: React.CSSProperties = {
    ...sideCommon,
    left: 20 + 20,
    top: Math.round(50 * k) - 15,
    transform: 'skewY(28deg)',
    background: gradients.left
  };

  const badge: React.CSSProperties = {
    position: 'absolute',
    top: -50,
    left: -6,
    background: accent,
    color: '#ffffff',
    fontWeight: 700,
    fontSize: 11,
    padding: '4px 8px',
    borderRadius: 6,
    boxShadow: `0 0 8px ${accent}80`,
    border: `1px solid ${accent}`
  };

  const title: React.CSSProperties = {
    position: 'absolute',
    bottom: -50,
    left: '50%',
    transform: 'translateX(-50%)',
    color: '#e2e8f0',
    fontWeight: 600,
    fontSize: 14,
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    padding: '2px 4px',
    borderRadius: '4px'
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.textDecoration = 'underline';
    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.textDecoration = 'none';
    e.currentTarget.style.backgroundColor = 'transparent';
  };

  const handleClick = () => {
    if (onNodeClick) {
      onNodeClick(infrastructure.id);
    }
  };

  return (
    <div style={wrap} onClick={handleClick}>
      {sub && <div style={badge}>{sub}</div>}
      <div style={rightBack} />
      <div style={left} />
      <div style={leftBack} />
      <div style={right} />
      <div 
        style={title}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {label}
      </div>
      <Handle type="source" position={Position.Right} id="r" style={{ opacity: 0 }} />
      <Handle type="target" position={Position.Left} id="l" style={{ opacity: 0 }} />
    </div>
  );
};

