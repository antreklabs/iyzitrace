import React from 'react';
import { CloseOutlined, CloudServerOutlined, DatabaseOutlined, AppstoreOutlined, BarChartOutlined } from '@ant-design/icons';
import { Infrastructure } from '../../api/service/interface.service';
import { css } from '@emotion/css';

interface InfrastructureDetailPanelProps {
  infrastructure: Infrastructure | null;
  onClose?: () => void;
  onServicesClick?: () => void;
}



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
  if (!infrastructure) return null;

  const statusConfig = getStatusConfig(infrastructure.status?.value);

  const containerStyle = css`
    position: absolute;
    width: 380px;
    background: linear-gradient(
      145deg,
      rgba(15, 23, 42, 0.98) 0%,
      rgba(30, 41, 59, 0.98) 100%
    );
    border: 1px solid ${statusConfig.color}30;
    border-radius: 16px;
    padding: 20px;
    color: #ffffff;
    box-shadow: 
      0 12px 40px rgba(0, 0, 0, 0.5),
      0 0 30px ${statusConfig.glow};
    backdrop-filter: blur(16px);
    max-height: 600px;
    overflow-y: auto;
    z-index: 1000;
    
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 40%;
      background: radial-gradient(
        circle at 50% 0%,
        ${statusConfig.glow},
        transparent 60%
      );
      border-radius: 16px 16px 0 0;
      pointer-events: none;
      opacity: 0.4;
    }
    
    &::-webkit-scrollbar {
      width: 6px;
    }
    
    &::-webkit-scrollbar-track {
      background: rgba(15, 23, 42, 0.5);
      border-radius: 3px;
    }
    
    &::-webkit-scrollbar-thumb {
      background: ${statusConfig.color}50;
      border-radius: 3px;
    }
    
    &::-webkit-scrollbar-thumb:hover {
      background: ${statusConfig.color}70;
    }
  `;

  const headerStyle = css`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 16px;
    padding-bottom: 14px;
    border-bottom: 1px solid ${statusConfig.color}25;
    position: relative;
  `;

  const titleContainerStyle = css`
    flex: 1;
  `;

  const titleStyle = css`
    color: #f1f5f9;
    margin: 0;
    font-size: 18px;
    font-weight: 700;
    margin-bottom: 8px;
    letter-spacing: -0.3px;
  `;

  const badgeStyle = css`
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: ${statusConfig.gradient};
    color: white;
    padding: 5px 12px;
    border-radius: 8px;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.5px;
    box-shadow: 0 3px 10px ${statusConfig.glow};
  `;

  const closeButtonStyle = css`
    background: rgba(239, 68, 68, 0.15);
    border: 1px solid #ef4444;
    border-radius: 8px;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #ef4444;
    transition: all 0.2s ease;
    
    &:hover {
      background: rgba(239, 68, 68, 0.3);
      transform: scale(1.1);
    }
  `;

  const gridStyle = css`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 16px;
  `;

  const sectionStyle = css`
    background: linear-gradient(
      135deg,
      rgba(30, 41, 59, 0.5) 0%,
      rgba(51, 65, 85, 0.5) 100%
    );
    padding: 14px;
    border-radius: 12px;
    border: 1px solid rgba(148, 163, 184, 0.15);
    position: relative;
  `;

  const sectionTitleStyle = css`
    color: #f1f5f9;
    margin: 0 0 12px 0;
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    display: flex;
    align-items: center;
    gap: 6px;
  `;

  const dataRowStyle = css`
    color: #cbd5e1;
    font-size: 12px;
    line-height: 1.8;
    display: flex;
    justify-content: space-between;
    padding: 2px 0;
    
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
    margin-bottom: 16px;
    padding: 14px;
    background: ${statusConfig.gradient};
    border: 1px solid ${statusConfig.color};
    border-radius: 12px;
    box-shadow: 0 6px 20px ${statusConfig.glow};
    position: relative;
    overflow: hidden;
  `;

  const statusLabelStyle = css`
    color: #ffffff;
    font-weight: 800;
    font-size: 14px;
    margin-bottom: 4px;
    letter-spacing: 1px;
  `;

  const statusDescStyle = css`
    color: rgba(255, 255, 255, 0.9);
    font-size: 11px;
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
    border: 1px solid #60a5fa;
    border-radius: 12px;
    padding: 14px 20px;
    color: #ffffff;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 4px 16px rgba(59, 130, 246, 0.25);
    letter-spacing: 0.3px;
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
        <div className={sectionStyle}>
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

        <div className={sectionStyle}>
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
              {(infrastructure.memory?.percentage ? infrastructure?.memory?.percentage * 100 : 0).toFixed(1)}%
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