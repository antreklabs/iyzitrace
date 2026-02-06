import React from 'react';
import { Handle, Position } from 'reactflow';
import { Infrastructure } from '../../api/service/interface.service';

interface InfrastructureNodeProps {
  data: {
    infrastructure: Infrastructure;
    onNodeClick?: (id: string) => void;
  };
}

const getStatusConfig = (status?: string) => {
  const s = status?.toLowerCase();
  if (s === 'ok' || s === 'healthy') {
    return {
      color: '#22c55e',
      background: '#10b981',
      label: 'HEALTHY'
    };
  }
  if (s === 'warning' || s === 'degraded') {
    return {
      color: '#f59e0b',
      background: '#f59e0b',
      label: 'WARNING'
    };
  }
  if (s === 'error') {
    return {
      color: '#ef4444',
      background: '#ef4444',
      label: 'ERROR'
    };
  }
  return {
    color: '#6b7280',
    background: '#6b7280',
    label: 'UNKNOWN'
  };
};

export const InfrastructureNode: React.FC<InfrastructureNodeProps> = ({ data }) => {
  const { infrastructure, onNodeClick } = data;
  const statusConfig = getStatusConfig(infrastructure.status?.value);

  const getIcon = () => {
    const type = infrastructure.type?.toLowerCase();
    if (type === 'linux') return '🐧';
    if (type === 'windows') return '🪟';
    if (type === 'darwin' || type === 'macos') return '🍎';
    if (type === 'container' || type === 'docker') return '🐳';
    if (type === 'kubernetes' || type === 'k8s') return '☸️';
    return '🖥️';
  };

  const handleClick = () => {
    if (onNodeClick) {
      onNodeClick(infrastructure.id);
    }
  };

  return (
    <div
      onClick={handleClick}
      style={{
        width: '140px',
        padding: '16px',
        background: '#1e293b',
        border: `2px solid ${statusConfig.color}`,
        borderRadius: '12px',
        cursor: 'pointer',
        textAlign: 'center'
      }}
    >
      {/* Status Badge */}
      <div
        style={{
          background: statusConfig.background,
          color: 'white',
          fontSize: '10px',
          fontWeight: 700,
          padding: '4px 10px',
          borderRadius: '10px',
          marginBottom: '12px',
          display: 'inline-block'
        }}
      >
        {statusConfig.label}
      </div>

      {/* Icon */}
      <div
        style={{
          width: '64px',
          height: '64px',
          margin: '0 auto 12px',
          background: statusConfig.background,
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '32px'
        }}
      >
        {getIcon()}
      </div>

      {/* Name */}
      <div
        style={{
          color: '#f1f5f9',
          fontWeight: 700,
          fontSize: '13px',
          marginBottom: '4px'
        }}
      >
        {infrastructure.name}
      </div>

      {/* Type */}
      <div
        style={{
          color: '#94a3b8',
          fontSize: '11px',
          textTransform: 'uppercase'
        }}
      >
        {infrastructure.type || 'server'}
      </div>

      <Handle type="source" position={Position.Right} id="r" style={{ opacity: 0 }} />
      <Handle type="target" position={Position.Left} id="l" style={{ opacity: 0 }} />
    </div>
  );
};