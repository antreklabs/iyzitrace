import React from 'react';
import { Handle, Position } from 'reactflow';
import { Infrastructure } from '../../api/service/interface.service';
import { css } from '@emotion/css';

interface InfrastructureNodeProps {
  data: {
    infrastructure: Infrastructure;
    onNodeClick?: (id: string) => void;
  };
}

// const pulse = keyframes`
//   0%, 100% { opacity: 1; transform: scale(1); }
//   50% { opacity: 0.7; transform: scale(1.05); }
// `;

// const float = keyframes`
//   0%, 100% { transform: translateY(0px); }
//   50% { transform: translateY(-8px); }
// `;

// const shimmer = keyframes`
//   0% { background-position: -200% center; }
//   100% { background-position: 200% center; }
// `;

// const glow = keyframes`
//   0%, 100% { box-shadow: 0 0 20px currentColor, 0 0 40px currentColor, 0 10px 60px rgba(0,0,0,0.5); }
//   50% { box-shadow: 0 0 30px currentColor, 0 0 60px currentColor, 0 10px 80px rgba(0,0,0,0.7); }
// `;

const getStatusConfig = (status?: string) => {
  const s = status?.toLowerCase();
  if (s === 'ok' || s === 'healthy') {
    return {
      color: '#22c55e',
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)',
      glow: 'rgba(34, 197, 94, 0.4)',
      label: 'HEALTHY'
    };
  }
  if (s === 'warning' || s === 'degraded') {
    return {
      color: '#f59e0b',
      gradient: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)',
      glow: 'rgba(245, 158, 11, 0.4)',
      label: 'WARNING'
    };
  }
  if (s === 'error') {
    return {
      color: '#ef4444',
      gradient: 'linear-gradient(135deg, #f87171 0%, #ef4444 50%, #dc2626 100%)',
      glow: 'rgba(239, 68, 68, 0.4)',
      label: 'ERROR'
    };
  }
  return {
    color: '#6b7280',
    gradient: 'linear-gradient(135deg, #9ca3af 0%, #6b7280 50%, #4b5563 100%)',
    glow: 'rgba(107, 114, 128, 0.4)',
    label: 'UNKNOWN'
  };
};

export const InfrastructureNode: React.FC<InfrastructureNodeProps> = ({ data }) => {
  const { infrastructure, onNodeClick } = data;
  // const [isHovered, setIsHovered] = useState(false);
  const statusConfig = getStatusConfig(infrastructure.status?.value);
  
  const containerStyle = css`
    position: relative;
    width: 200px;
    height: 200px;
    cursor: pointer;
    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    transform-style: preserve-3d;
    
    &:hover {
      transform: translateY(-10px) scale(1.05);
      filter: brightness(1.2);
    }
  `;

  const cubeWrapperStyle = css`
    position: absolute;
    width: 120px;
    height: 120px;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    transform-style: preserve-3d;
    color: ${statusConfig.color};
  `;

  const faceStyle = css`
    position: absolute;
    width: 120px;
    height: 120px;
    background: ${statusConfig.gradient};
    border: 2px solid ${statusConfig.color};
    backdrop-filter: blur(10px);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 48px;
    color: white;
    text-shadow: 0 2px 10px rgba(0,0,0,0.3);
    
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: -20%;
      width: 20%;
      height: 100%;
      background: linear-gradient(
        90deg,
        transparent,
        rgba(255, 255, 255, 0.3),
        transparent
      );
      
    }
  `;

  const topFaceStyle = css`
    ${faceStyle};
    transform: rotateX(90deg) translateZ(60px);
    background: linear-gradient(135deg, 
      ${statusConfig.color}40 0%, 
      ${statusConfig.color}60 100%
    );
  `;

  const frontFaceStyle = css`
    ${faceStyle};
    transform: translateZ(60px);
  `;

  const rightFaceStyle = css`
    ${faceStyle};
    transform: rotateY(90deg) translateZ(60px);
    background: linear-gradient(135deg, 
      ${statusConfig.color}80 0%, 
      ${statusConfig.color}60 100%
    );
  `;

  const badgeStyle = css`
    position: absolute;
    top: -10px;
    left: 50%;
    transform: translateX(-50%);
    background: ${statusConfig.gradient};
    color: white;
    font-weight: 800;
    font-size: 10px;
    letter-spacing: 1px;
    padding: 6px 16px;
    border-radius: 20px;
    box-shadow: 
      0 4px 15px ${statusConfig.glow},
      0 0 20px ${statusConfig.glow},
      inset 0 1px 0 rgba(255,255,255,0.3);
    border: 2px solid ${statusConfig.color};
    z-index: 10;
    backdrop-filter: blur(10px);
  `;

  const titleStyle = css`
    position: absolute;
    bottom: -40px;
    left: 50%;
    transform: translateX(-50%);
    color: #f1f5f9;
    font-weight: 700;
    font-size: 16px;
    white-space: nowrap;
    text-align: center;
    padding: 8px 20px;
    border-radius: 12px;
    background: linear-gradient(135deg, 
      rgba(30, 41, 59, 0.95) 0%, 
      rgba(51, 65, 85, 0.95) 100%
    );
    border: 2px solid ${statusConfig.color}40;
    box-shadow: 
      0 4px 20px rgba(0,0,0,0.4),
      0 0 0 1px rgba(255,255,255,0.1),
      inset 0 1px 0 rgba(255,255,255,0.2);
    backdrop-filter: blur(20px);
    transition: all 0.3s ease;
    
    &:hover {
      background: linear-gradient(135deg, 
        rgba(51, 65, 85, 0.98) 0%, 
        rgba(71, 85, 105, 0.98) 100%
      );
      transform: translateX(-50%) translateY(-4px);
      box-shadow: 
        0 8px 30px rgba(0,0,0,0.6),
        0 0 0 1px rgba(255,255,255,0.2),
        inset 0 1px 0 rgba(255,255,255,0.3);
    }
  `;

  const typeTagStyle = css`
    position: absolute;
    bottom: -75px;
    left: 50%;
    transform: translateX(-50%);
    color: #94a3b8;
    font-weight: 600;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    padding: 4px 12px;
    border-radius: 8px;
    background: rgba(15, 23, 42, 0.8);
    border: 1px solid rgba(148, 163, 184, 0.3);
    backdrop-filter: blur(10px);
  `;

  const handleClick = () => {
    if (onNodeClick) {
      onNodeClick(infrastructure.id);
    }
  };

  const getIcon = () => {
    const type = infrastructure.type?.toLowerCase();
    if (type === 'linux') return '🐧';
    if (type === 'windows') return '🪟';
    if (type === 'darwin' || type === 'macos') return '🍎';
    if (type === 'container' || type === 'docker') return '🐳';
    if (type === 'kubernetes' || type === 'k8s') return '☸️';
    return '🖥️';
  };

  return (
    <div 
      className={containerStyle}
      onClick={handleClick}
      // onMouseEnter={() => setIsHovered(true)}
      // onMouseLeave={() => setIsHovered(false)}
    >
      <div className={badgeStyle}>
        {statusConfig.label}
      </div>
      
      <div className={cubeWrapperStyle}>
        <div className={topFaceStyle} />
        <div className={frontFaceStyle}>{getIcon()}</div>
        <div className={rightFaceStyle} />
      </div>
      
      <div className={titleStyle}>
        {infrastructure.name}
      </div>
      
      <div className={typeTagStyle}>
        {infrastructure.type || 'server'}
      </div>
      
      <Handle type="source" position={Position.Right} id="r" style={{ opacity: 0 }} />
      <Handle type="target" position={Position.Left} id="l" style={{ opacity: 0 }} />
    </div>
  );
};
