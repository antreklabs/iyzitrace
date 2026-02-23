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
      className="infra-node-card infra-node-card-base"
      style={{
        border: `2px solid ${statusConfig.color}`,
      }}
    >
      {/* Status Badge */}
      <div
        className="infra-node-status-badge"
        style={{
          background: statusConfig.background,
        }}
      >
        {statusConfig.label}
      </div>

      {/* Icon */}
      <div
        className="infra-node-icon-container"
        style={{
          background: statusConfig.background,
        }}
      >
        {getIcon()}
      </div>

      {/* Name */}
      <div className="infra-node-name">
        {infrastructure.name}
      </div>

      {/* Type */}
      <div className="infra-node-type infra-node-type-upper">
        {infrastructure.type || 'server'}
      </div>

      <Handle type="source" position={Position.Right} id="r" className="infra-handle-hidden" />
      <Handle type="target" position={Position.Left} id="l" className="infra-handle-hidden" />
    </div>
  );
};