import React, { useState } from 'react';
import { CloseOutlined, CloudServerOutlined, DatabaseOutlined, AppstoreOutlined, BarChartOutlined } from '@ant-design/icons';
import { Infrastructure } from '../../api/service/interface.service';
import { css, keyframes } from '@emotion/css';

interface InfrastructureDetailPanelProps {
  infrastructure: Infrastructure | null;
  onClose?: () => void;
  onServicesClick?: () => void;
}

const slideIn = keyframes`
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
`;

const shimmer = keyframes`
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
`;

const getStatusConfig = (s?: string) => {
  if (s === 'ok' || s === 'healthy') {
    return {
      color: '#22c55e',
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      glow: 'rgba(34, 197, 94, 0.4)',
      label: 'HEALTHY'
    };
  }
  if (s === 'warning' || s === 'degraded') {
    return {
      color: '#f59e0b',
      gradient: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
      glow: 'rgba(245, 158, 11, 0.4)',
      label: 'WARNING'
    };
  }
  if (s === 'error') {
    return {
      color: '#ef4444',
      gradient: 'linear-gradient(135deg, #f87171 0%, #ef4444 100%)',
      glow: 'rgba(239, 68, 68, 0.4)',
      label: 'ERROR'
    };
  }
  return {
    color: '#6b7280',
    gradient: 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)',
    glow: 'rgba(107, 114, 128, 0.4)',
    label: 'UNKNOWN'
  };
};

export const InfrastructureDetailPanel: React.FC<InfrastructureDetailPanelProps> = ({ 
  infrastructure, 
  onClose,
  onServicesClick 
}) => {
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  
  if (!infrastructure) return null;

  const statusConfig = getStatusConfig(infrastructure.status?.value);

  const containerStyle = css`
    position: absolute;
    width: 480px;
    background: linear-gradient(
      145deg,
      rgba(15, 23, 42, 0.98) 0%,
      rgba(30, 41, 59, 0.98) 100%
    );
    border: 2px solid ${statusConfig.color}40;
    border-radius: 24px;
    padding: 28px;
    color: #ffffff;
    box-shadow: 
      0 20px 60px rgba(0, 0, 0, 0.6),
      0 0 80px ${statusConfig.glow},
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(30px);
    max-height: 750px;
    overflow-y: auto;
    z-index: 1000;
    animation: ${slideIn} 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
    
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 60%;
      background: radial-gradient(
        circle at 50% 0%,
        ${statusConfig.glow},
        transparent 70%
      );
      border-radius: 24px 24px 0 0;
      pointer-events: none;
    }
    
    &::-webkit-scrollbar {
      width: 8px;
    }
    
    &::-webkit-scrollbar-track {
      background: rgba(15, 23, 42, 0.5);
      border-radius: 4px;
    }
    
    &::-webkit-scrollbar-thumb {
      background: ${statusConfig.color}60;
      border-radius: 4px;
      transition: background 0.2s;
    }
    
    &::-webkit-scrollbar-thumb:hover {
      background: ${statusConfig.color}80;
    }
  `;

  const headerStyle = css`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 28px;
    padding-bottom: 20px;
    border-bottom: 2px solid ${statusConfig.color}30;
    position: relative;
  `;

  const titleContainerStyle = css`
    flex: 1;
  `;

  const titleStyle = css`
    color: #f1f5f9;
    margin: 0;
    font-size: 24px;
    font-weight: 900;
    text-shadow: 0 2px 10px ${statusConfig.glow};
    margin-bottom: 12px;
    letter-spacing: -0.5px;
  `;

  const badgeStyle = css`
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: ${statusConfig.gradient};
    color: white;
    padding: 8px 16px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 1px;
    box-shadow: 
      0 4px 15px ${statusConfig.glow},
      inset 0 1px 0 rgba(255, 255, 255, 0.3);
    animation: ${pulse} 3s ease-in-out infinite;
  `;

  const closeButtonStyle = css`
    background: rgba(239, 68, 68, 0.2);
    border: 2px solid #ef4444;
    border-radius: 12px;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #ef4444;
    transition: all 0.3s ease;
    
    &:hover {
      background: rgba(239, 68, 68, 0.4);
      transform: rotate(90deg) scale(1.1);
      box-shadow: 0 0 20px rgba(239, 68, 68, 0.5);
    }
  `;

  const gridStyle = css`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-bottom: 24px;
  `;

  const sectionStyle = css`
    background: linear-gradient(
      135deg,
      rgba(30, 41, 59, 0.5) 0%,
      rgba(51, 65, 85, 0.5) 100%
    );
    padding: 20px;
    border-radius: 16px;
    border: 1px solid ${hoveredSection === 'info' || hoveredSection === 'resources' 
      ? `${statusConfig.color}60` 
      : 'rgba(148, 163, 184, 0.2)'};
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
    
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(
        90deg,
        transparent,
        rgba(255, 255, 255, 0.1),
        transparent
      );
      transition: left 0.6s ease;
    }
    
    &:hover::before {
      left: 100%;
    }
    
    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px ${statusConfig.glow};
    }
  `;

  const sectionTitleStyle = css`
    color: #f1f5f9;
    margin: 0 0 16px 0;
    font-size: 14px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    display: flex;
    align-items: center;
    gap: 8px;
  `;

  const dataRowStyle = css`
    color: #cbd5e1;
    fontSize: 13px;
    line-height: 2;
    display: flex;
    justify-content: space-between;
    padding: 4px 0;
    
    & > strong {
      color: #94a3b8;
      font-weight: 600;
    }
    
    & > span {
      color: #f1f5f9;
      font-weight: 600;
    }
  `;

  const statusCardStyle = css`
    margin-bottom: 24px;
    padding: 20px;
    background: ${statusConfig.gradient};
    border: 2px solid ${statusConfig.color};
    border-radius: 20px;
    box-shadow: 
      0 10px 30px ${statusConfig.glow},
      inset 0 2px 0 rgba(255, 255, 255, 0.3);
    position: relative;
    overflow: hidden;
    
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(
        135deg,
        transparent 0%,
        rgba(255, 255, 255, 0.1) 50%,
        transparent 100%
      );
      background-size: 200% 200%;
      animation: ${shimmer} 3s infinite;
    }
  `;

  const statusLabelStyle = css`
    color: #ffffff;
    font-weight: 900;
    font-size: 18px;
    margin-bottom: 8px;
    letter-spacing: 2px;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
  `;

  const statusDescStyle = css`
    color: rgba(255, 255, 255, 0.95);
    font-size: 13px;
    font-weight: 600;
  `;

  const listContainerStyle = css`
    background: rgba(15, 23, 42, 0.8);
    padding: 16px;
    border-radius: 16px;
    max-height: 200px;
    overflow-y: auto;
    border: 1px solid rgba(148, 163, 184, 0.2);
    
    &::-webkit-scrollbar {
      width: 6px;
    }
    
    &::-webkit-scrollbar-track {
      background: rgba(15, 23, 42, 0.5);
      border-radius: 3px;
    }
    
    &::-webkit-scrollbar-thumb {
      background: ${statusConfig.color}60;
      border-radius: 3px;
    }
  `;

  const listItemStyle = (isLast: boolean) => css`
    border-bottom: ${isLast ? 'none' : '1px solid rgba(148, 163, 184, 0.2)'};
    padding-bottom: ${isLast ? 0 : '12px'};
    margin-bottom: ${isLast ? 0 : '12px'};
    transition: all 0.2s ease;
    
    &:hover {
      transform: translateX(4px);
    }
  `;

  const itemNameStyle = css`
    color: #e2e8f0;
    font-size: 14px;
    font-weight: 700;
    margin-bottom: 6px;
  `;

  const itemMetaStyle = css`
    display: flex;
    gap: 8px;
    font-size: 12px;
    color: #94a3b8;
    font-weight: 600;
  `;

  const servicesButtonStyle = css`
    width: 100%;
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    border: 2px solid #60a5fa;
    border-radius: 16px;
    padding: 18px 24px;
    color: #ffffff;
    font-size: 16px;
    font-weight: 800;
    cursor: pointer;
    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 8px 24px rgba(59, 130, 246, 0.3);
    position: relative;
    overflow: hidden;
    letter-spacing: 0.5px;
    
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(
        90deg,
        transparent,
        rgba(255, 255, 255, 0.3),
        transparent
      );
      transition: left 0.6s ease;
    }
    
    &:hover {
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      transform: translateY(-4px) scale(1.02);
      box-shadow: 0 12px 40px rgba(59, 130, 246, 0.5);
    }
    
    &:hover::before {
      left: 100%;
    }
    
    &:active {
      transform: translateY(-2px) scale(0.98);
    }
  `;

  return (
    <div className={containerStyle}>
      <div className={headerStyle}>
        <div className={titleContainerStyle}>
          <h3 className={titleStyle}>
            {infrastructure.name}
          </h3>
          <div className={badgeStyle}>
            <CloudServerOutlined style={{ fontSize: '14px' }} />
            INFRASTRUCTURE
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className={closeButtonStyle}>
            <CloseOutlined style={{ fontSize: '16px', fontWeight: 'bold' }} />
          </button>
        )}
      </div>

      <div className={gridStyle}>
        <div 
          className={sectionStyle}
          onMouseEnter={() => setHoveredSection('info')}
          onMouseLeave={() => setHoveredSection(null)}
        >
          <h4 className={sectionTitleStyle}>
            <DatabaseOutlined />
            Infrastructure
          </h4>
          <div className={dataRowStyle}>
            <strong>IP Address</strong>
            <span>{infrastructure.ip || 'N/A'}</span>
          </div>
          <div className={dataRowStyle}>
            <strong>OS Version</strong>
            <span>{infrastructure.osVersion || 'N/A'}</span>
          </div>
          <div className={dataRowStyle}>
            <strong>Type</strong>
            <span>{infrastructure.type || 'server'}</span>
          </div>
        </div>

        <div 
          className={sectionStyle}
          onMouseEnter={() => setHoveredSection('resources')}
          onMouseLeave={() => setHoveredSection(null)}
        >
          <h4 className={sectionTitleStyle}>
            <BarChartOutlined />
            Resources
          </h4>
          <div className={dataRowStyle}>
            <strong>CPU</strong>
            <span>{infrastructure.cpu?.percentage?.toFixed(1) ?? 0}%</span>
          </div>
          <div className={dataRowStyle}>
            <strong>Memory</strong>
            <span>
              {infrastructure.memory?.usage?.toFixed(1) ?? 0}/
              {infrastructure.memory?.capacity?.toFixed(1) ?? 0} GB
            </span>
          </div>
          <div className={dataRowStyle}>
            <strong>Usage</strong>
            <span>
              {(infrastructure.memory?.percentage ? infrastructure.memory.percentage * 100 : 0).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      <div className={statusCardStyle}>
        <div className={statusLabelStyle}>
          {statusConfig.label}
        </div>
        <div className={statusDescStyle}>
          Infrastructure monitoring active
        </div>
      </div>

      {infrastructure.applications && infrastructure.applications.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h4 className={sectionTitleStyle}>
            <AppstoreOutlined />
            Applications ({infrastructure.applications.length})
          </h4>
          <div className={listContainerStyle}>
            {infrastructure.applications.map((app, idx) => (
              <div 
                key={idx} 
                className={listItemStyle(idx === infrastructure.applications!.length - 1)}
              >
                <div className={itemNameStyle}>
                  {app.name}
                </div>
                <div className={itemMetaStyle}>
                  <span>{app.platform}</span>
                  <span>•</span>
                  <span>v{app.version}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {infrastructure.services && infrastructure.services.length > 0 && (
        <button onClick={onServicesClick} className={servicesButtonStyle}>
          <span>View Services Map ({infrastructure.services.length})</span>
          <span style={{ fontSize: '24px' }}>→</span>
        </button>
      )}
    </div>
  );
};
