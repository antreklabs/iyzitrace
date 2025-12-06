import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  ReactFlowProvider,
  ReactFlow,
  Background,
  Controls,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  MarkerType,
  Position,
  useReactFlow,
  Handle
} from 'reactflow';
import 'reactflow/dist/style.css';
import { CloseOutlined, CloudServerOutlined, DatabaseOutlined, ApiOutlined, ContainerOutlined, BarChartOutlined, LineChartOutlined, ApartmentOutlined, FullscreenOutlined, FullscreenExitOutlined } from '@ant-design/icons';
import { Infrastructure, Service, Operation } from '../../api/service/interface.service';
import { getOperationTypeColor } from '../../api/service/services.service';
import { useNavigate } from 'react-router-dom';
import dagre from 'dagre';
import { css, keyframes } from '@emotion/css';

interface ServiceMapBottomDrawerProps {
  infrastructure: Infrastructure | null;
  isOpen: boolean;
  onClose: () => void;
}

const pulse = keyframes`
  0%, 100% { opacity: 1; box-shadow: 0 0 10px currentColor; }
  50% { opacity: 0.6; box-shadow: 0 0 20px currentColor; }
`;

const shimmerAnim = keyframes`
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
`;

const floatAnim = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-4px); }
`;

const ServiceNode: React.FC<{ data: Service; selected?: boolean }> = ({ data, selected }) => {
  const [isHovered, setIsHovered] = useState(false);
  const getStatusConfig = (status?: string) => {
    const s = status?.toLowerCase();
    if (s === 'healthy' || s === 'ok') {
      return {
        color: '#10b981',
        gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        glow: 'rgba(16, 185, 129, 0.4)',
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
    if (s === 'error' || s === 'critical') {
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

  const getTypeIcon = (type?: string) => {
    const t = type?.toLowerCase();
    if (t === 'platform') return <CloudServerOutlined />;
    if (t === 'database') return <DatabaseOutlined />;
    if (t === 'api') return <ApiOutlined />;
    if (t === 'container') return <ContainerOutlined />;
    return <CloudServerOutlined />;
  };

  const safeStatus = data?.status?.value || 'healthy';
  const safeType = data?.type || 'api';
  const statusConfig = getStatusConfig(safeStatus);

  const containerStyle = css`
    position: relative;
    background: linear-gradient(
      145deg,
      rgba(30, 41, 59, 0.95) 0%,
      rgba(51, 65, 85, 0.95) 100%
    );
    border: 2px solid ${statusConfig.color};
    border-radius: 20px;
    padding: 24px;
    min-width: 220px;
    max-width: 260px;
    box-shadow: 
      ${selected 
        ? `0 0 40px ${statusConfig.glow}, 0 15px 50px rgba(0,0,0,0.6)` 
        : `0 10px 40px rgba(0,0,0,0.5)`};
    transform: ${selected || isHovered ? 'translateY(-8px) scale(1.05)' : 'translateY(0) scale(1)'};
    transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
    cursor: pointer;
    overflow: hidden;
    backdrop-filter: blur(20px);
    animation: ${selected ? floatAnim : 'none'} 2s ease-in-out infinite;
    
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
        rgba(255, 255, 255, 0.15),
        transparent
      );
      transition: left 0.7s ease;
    }
    
    &:hover::before {
      left: 100%;
    }
    
    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 50%;
      background: linear-gradient(180deg, rgba(255,255,255,0.1), transparent);
      border-radius: 20px 20px 0 0;
      pointer-events: none;
    }
  `;

  const statusBadgeStyle = css`
    position: absolute;
    top: -14px;
    right: -14px;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: ${statusConfig.gradient};
    border: 4px solid #0f172a;
    box-shadow: 
      0 6px 16px ${statusConfig.glow},
      0 0 30px ${statusConfig.glow};
    animation: ${pulse} 2.5s ease-in-out infinite;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    color: white;
    font-weight: 900;
    z-index: 10;
  `;

  const iconContainerStyle = css`
    width: 64px;
    height: 64px;
    border-radius: 20px;
    background: ${statusConfig.gradient};
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 32px;
    color: white;
    margin: 0 auto 20px;
    box-shadow: 
      0 10px 30px ${statusConfig.glow},
      inset 0 2px 0 rgba(255,255,255,0.4),
      inset 0 -2px 0 rgba(0,0,0,0.3);
    transition: all 0.4s ease;
    position: relative;
    overflow: hidden;
    
    &::before {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: linear-gradient(
        45deg,
        transparent 30%,
        rgba(255, 255, 255, 0.4) 50%,
        transparent 70%
      );
      animation: ${shimmerAnim} 3s infinite;
    }
  `;

  const titleStyle = css`
    color: #f1f5f9;
    font-size: 17px;
    font-weight: 800;
    text-align: center;
    margin-bottom: 16px;
    line-height: 1.3;
    word-break: break-word;
    text-shadow: 0 2px 6px rgba(0,0,0,0.4);
  `;

  const metricsContainerStyle = css`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    padding: 16px;
    background: rgba(15, 23, 42, 0.5);
    border-radius: 12px;
    border: 1px solid rgba(148, 163, 184, 0.15);
    margin-bottom: 16px;
  `;

  const metricItemStyle = css`
    text-align: center;
    
    & > div:first-of-type {
      color: #94a3b8;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    
    & > div:last-of-type {
      color: #f1f5f9;
      font-weight: 700;
      font-size: 14px;
    }
  `;

  const footerStyle = css`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 16px;
    border-top: 1px solid rgba(148, 163, 184, 0.2);
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.8px;
  `;

  const typeTagStyle = css`
    color: #cbd5e1;
    background: rgba(148, 163, 184, 0.2);
    padding: 6px 12px;
    border-radius: 10px;
    border: 1px solid rgba(148, 163, 184, 0.3);
  `;

  const statusLabelStyle = css`
    color: ${statusConfig.color};
    background: ${statusConfig.color}25;
    padding: 6px 12px;
    border-radius: 10px;
    border: 1px solid ${statusConfig.color}50;
    box-shadow: 0 0 12px ${statusConfig.glow};
  `;

  return (
    <div 
      className={containerStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={statusBadgeStyle}>
        ✓
      </div>
      
      <div className={iconContainerStyle}>
        {getTypeIcon(safeType)}
      </div>
      
      <div className={titleStyle}>
        {data?.name || 'Unknown Service'}
      </div>
      
      {data?.metrics && (
        <div className={metricsContainerStyle}>
          <div className={metricItemStyle}>
            <div>Avg Lat</div>
            <div>{data.metrics.avgDurationMs?.toFixed(2) ?? 0} ms</div>
          </div>
          <div className={metricItemStyle}>
            <div>Min Lat</div>
            <div>{data.metrics.minDurationMs?.toFixed(2) ?? 0} ms</div>
          </div>
          <div className={metricItemStyle}>
            <div>Max Lat</div>
            <div>{data.metrics.maxDurationMs?.toFixed(2) ?? 0} ms</div>
          </div>
          <div className={metricItemStyle}>
            <div>Calls</div>
            <div>{data.metrics.callsCount ?? 0}</div>
          </div>
        </div>
      )}
      
      <div className={footerStyle}>
        <span className={typeTagStyle}>{safeType}</span>
        <span className={statusLabelStyle}>{statusConfig.label}</span>
      </div>

      <Handle 
        type="target" 
        position={Position.Top}
        style={{ 
          background: statusConfig.color,
          width: 14,
          height: 14,
          border: `4px solid #0f172a`,
          boxShadow: `0 0 15px ${statusConfig.glow}`
        }} 
      />
      <Handle 
        type="source" 
        position={Position.Bottom}
        style={{ 
          background: statusConfig.color,
          width: 14,
          height: 14,
          border: `4px solid #0f172a`,
          boxShadow: `0 0 15px ${statusConfig.glow}`
        }} 
      />
      <Handle 
        type="target" 
        position={Position.Left} 
        style={{ 
          background: statusConfig.color,
          width: 14,
          height: 14,
          border: `4px solid #0f172a`,
          boxShadow: `0 0 15px ${statusConfig.glow}`
        }} 
      />
      <Handle 
        type="source" 
        position={Position.Right} 
        style={{ 
          background: statusConfig.color,
          width: 14,
          height: 14,
          border: `4px solid #0f172a`,
          boxShadow: `0 0 15px ${statusConfig.glow}`
        }} 
      />
    </div>
  );
};

const nodeTypes = {
  service: ServiceNode
};

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

const ServiceDetailPanel: React.FC<{ 
  data: Service | null;
  onClose: () => void;
}> = ({ data, onClose }) => {
  const navigate = useNavigate();
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  
  if (!data) return null;

  const getStatusConfig = (status?: string) => {
    const s = status?.toLowerCase();
    if (s === 'healthy' || s === 'ok') {
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

  const statusConfig = getStatusConfig(data.status?.value);

  const handleNavigateToLogs = () => {
    navigate(`/a/iyzitrace-app/logs?serviceName=${encodeURIComponent(data.name)}&serviceNameOperator=%3D&option_limit=100&option_interval=5m&option_pageCount=20&option_orderBy=timestamp&option_orderDirection=desc`);
  };

  const handleNavigateToMetrics = () => {
    navigate(`/a/iyzitrace-app/services/${encodeURIComponent(data.name)}`);
  };

  const handleNavigateToTraces = () => {
    navigate(`/a/iyzitrace-app/traces?serviceName=${encodeURIComponent(data.name)}&serviceNameOperator=%3D&option_limit=100&option_interval=5m&option_pageCount=20&option_orderBy=traceId&option_orderDirection=desc`);
  };

  const containerStyle = css`
    position: absolute;
    left: 12px;
    top: 12px;
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
    border: 1px solid ${hoveredSection === 'info' || hoveredSection === 'metrics' 
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
    font-size: 13px;
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
      animation: ${shimmerAnim} 3s infinite;
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
    max-height: 300px;
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

  const operationItemStyle = (isLast: boolean) => css`
    border-bottom: ${isLast ? 'none' : '1px solid rgba(148, 163, 184, 0.2)'};
    padding-bottom: ${isLast ? 0 : '16px'};
    margin-bottom: ${isLast ? 0 : '16px'};
    transition: all 0.2s ease;
    
    &:hover {
      transform: translateX(4px);
    }
  `;

  const operationHeaderStyle = css`
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;
    flex-wrap: wrap;
  `;

  const operationTypeTagStyle = (color: string) => css`
    background: ${color};
    color: #ffffff;
    padding: 6px 12px;
    border-radius: 8px;
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    box-shadow: 0 2px 8px ${color}40;
  `;

  const operationMethodTagStyle = css`
    background: rgba(59, 130, 246, 0.2);
    color: #60a5fa;
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 10px;
    font-weight: 700;
    border: 1px solid rgba(59, 130, 246, 0.3);
  `;

  const operationNameStyle = css`
    color: #cbd5e1;
    font-size: 13px;
    margin-bottom: 10px;
    font-weight: 600;
  `;

  const operationMetricsStyle = css`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    font-size: 12px;
  `;

  const metricItemStyle = css`
    & > span:first-of-type {
      color: #94a3b8;
    }
    
    & > span:last-of-type {
      color: #f1f5f9;
      font-weight: 700;
    }
  `;

  const buttonsRowStyle = css`
    display: flex;
    gap: 12px;
    margin-top: 24px;
    padding-top: 20px;
    border-top: 1px solid rgba(148, 163, 184, 0.2);
  `;

  const actionButtonStyle = (bgColor: string, hoverColor: string, textColor: string) => css`
    flex: 1;
    background: ${bgColor};
    border: 2px solid ${textColor}40;
    border-radius: 12px;
    padding: 14px 16px;
    color: ${textColor};
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: all 0.3s ease;
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
        rgba(255, 255, 255, 0.2),
        transparent
      );
      transition: left 0.5s ease;
    }
    
    &:hover {
      background: ${hoverColor};
      border-color: ${textColor}60;
      transform: translateY(-3px);
      box-shadow: 0 8px 20px ${textColor}30;
    }
    
    &:hover::before {
      left: 100%;
    }
    
    &:active {
      transform: translateY(-1px);
    }
  `;

  return (
    <div className={containerStyle}>
      <div className={headerStyle}>
        <div className={titleContainerStyle}>
          <h3 className={titleStyle}>
            {data.name}
          </h3>
          <div className={badgeStyle}>
            <CloudServerOutlined style={{ fontSize: '14px' }} />
            SERVICE
          </div>
        </div>
        <button onClick={onClose} className={closeButtonStyle}>
          <CloseOutlined style={{ fontSize: '16px', fontWeight: 'bold' }} />
        </button>
      </div>

      <div className={gridStyle}>
        <div 
          className={sectionStyle}
          onMouseEnter={() => setHoveredSection('info')}
          onMouseLeave={() => setHoveredSection(null)}
        >
          <h4 className={sectionTitleStyle}>
            <DatabaseOutlined />
            Service Info
          </h4>
          <div className={dataRowStyle}>
            <strong>Name</strong>
            <span>{data.name || 'N/A'}</span>
          </div>
          <div className={dataRowStyle}>
            <strong>Type</strong>
            <span>{data.type || 'UNKNOWN'}</span>
          </div>
        </div>

        <div 
          className={sectionStyle}
          onMouseEnter={() => setHoveredSection('metrics')}
          onMouseLeave={() => setHoveredSection(null)}
        >
          <h4 className={sectionTitleStyle}>
            <BarChartOutlined />
            Metrics
          </h4>
          <div className={dataRowStyle}>
            <strong>Avg Lat</strong>
            <span>{data.metrics?.avgDurationMs?.toFixed(2) ?? '0.00'} ms</span>
          </div>
          <div className={dataRowStyle}>
            <strong>Min Lat</strong>
            <span>{data.metrics?.minDurationMs?.toFixed(2) ?? '0.00'} ms</span>
          </div>
          <div className={dataRowStyle}>
            <strong>Max Lat</strong>
            <span>{data.metrics?.maxDurationMs?.toFixed(2) ?? '0.00'} ms</span>
          </div>
        </div>
      </div>

      <div className={statusCardStyle}>
        <div className={statusLabelStyle}>
          {statusConfig.label}
        </div>
        <div className={statusDescStyle}>
          System status monitoring active
        </div>
      </div>

      {data.operations && data.operations.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h4 className={sectionTitleStyle}>
            <ApartmentOutlined />
            Operations ({data.operations.length})
          </h4>
          <div className={listContainerStyle}>
            {data.operations.map((op: Operation, idx: number) => {
              const typeColor = getOperationTypeColor(op.type || 'GENERAL');
              const bgColor = typeColor === 'blue' ? '#3b82f6' :
                              typeColor === 'green' ? '#22c55e' :
                              typeColor === 'orange' ? '#f59e0b' :
                              typeColor === 'purple' ? '#a855f7' :
                              typeColor === 'red' ? '#ef4444' :
                              typeColor === 'yellow' ? '#eab308' :
                              '#6b7280';
              
              return (
                <div 
                  key={idx}
                  className={operationItemStyle(idx === data.operations!.length - 1)}
                >
                  <div className={operationHeaderStyle}>
                    <span className={operationTypeTagStyle(bgColor)}>
                      {op.type || 'GENERAL'}
                    </span>
                    {op.method && (
                      <span className={operationMethodTagStyle}>
                        {op.method}
                      </span>
                    )}
                  </div>
                  <div className={operationNameStyle}>
                    {op.name}
                  </div>
                  <div className={operationMetricsStyle}>
                    <div className={metricItemStyle}>
                      <span>Avg Lat: </span>
                      <span>{op.metrics?.avgDurationMs?.toFixed(2) ?? 0}ms</span>
                    </div>
                    <div className={metricItemStyle}>
                      <span>P95 Lat: </span>
                      <span>{op.metrics?.p95DurationMs?.toFixed(2) ?? 0}ms</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className={buttonsRowStyle}>
        <button 
          onClick={handleNavigateToLogs}
          className={actionButtonStyle('rgba(59, 130, 246, 0.15)', 'rgba(59, 130, 246, 0.3)', '#60a5fa')}
        >
          <BarChartOutlined style={{ fontSize: '16px' }} />
          Logs
        </button>
        <button 
          onClick={handleNavigateToMetrics}
          className={actionButtonStyle('rgba(34, 197, 94, 0.15)', 'rgba(34, 197, 94, 0.3)', '#4ade80')}
        >
          <LineChartOutlined style={{ fontSize: '16px' }} />
          Metrics
        </button>
        <button 
          onClick={handleNavigateToTraces}
          className={actionButtonStyle('rgba(168, 85, 247, 0.15)', 'rgba(168, 85, 247, 0.3)', '#c084fc')}
        >
          <ApartmentOutlined style={{ fontSize: '16px' }} />
          Traces
        </button>
      </div>
    </div>
  );
};

// Get edge color based on avgDuration (gradient from green to red with more variations)
const getEdgeColor = (avgDurationMs: number, maxDuration: number): string => {
  if (maxDuration === 0) return '#6b7280';
  
  const ratio = avgDurationMs / maxDuration;
  
  // Red (slow) to Green (fast) gradient with more color steps
  // 0 (fast) -> dark green, max (slow) -> dark red
  const invertedRatio = 1 - ratio;
  
  if (invertedRatio > 0.85) return '#059669'; // Dark Green (Very Fast)
  if (invertedRatio > 0.70) return '#10b981'; // Green (Fast)
  if (invertedRatio > 0.60) return '#22c55e'; // Light Green (Good)
  if (invertedRatio > 0.50) return '#84cc16'; // Yellow-Green (Ok)
  if (invertedRatio > 0.40) return '#facc15'; // Yellow (Medium)
  if (invertedRatio > 0.30) return '#fbbf24'; // Light Yellow (Warning)
  if (invertedRatio > 0.20) return '#f59e0b'; // Orange (Slow)
  if (invertedRatio > 0.10) return '#f97316'; // Dark Orange (Very Slow)
  if (invertedRatio > 0.05) return '#ea580c'; // Red-Orange (Critical)
  return '#dc2626'; // Dark Red (Extremely Slow)
};

// Get animation speed based on duration (much more noticeable difference)
const getAnimationDuration = (avgDurationMs: number, maxDuration: number): number => {
  if (maxDuration === 0) return 3;
  
  const ratio = avgDurationMs / maxDuration;
  
  // Very Fast services: 0.3s (super fast animation - very responsive)
  // Fast services: 0.5-1s (quick animation)
  // Medium services: 2-4s (moderate animation)
  // Slow services: 6-8s (slow animation)
  // Very Slow services: 10-12s (very slow animation - almost crawling)
  
  if (ratio < 0.1) return 0.3;  // Very fast (0-10% of max)
  if (ratio < 0.3) return 0.8;  // Fast (10-30% of max)
  if (ratio < 0.5) return 2;    // Medium-Fast (30-50% of max)
  if (ratio < 0.7) return 4;    // Medium-Slow (50-70% of max)
  if (ratio < 0.85) return 7;   // Slow (70-85% of max)
  return 10;                     // Very Slow (85-100% of max)
};

const ServiceMapBottomDrawerInner: React.FC<ServiceMapBottomDrawerProps> = ({
  infrastructure,
  isOpen,
  onClose
}) => {
  const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
  const [height, setHeight] = useState(Math.floor(windowHeight * 0.75));
  const [isDragging, setIsDragging] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const reactFlowInstance = useReactFlow();

  // Build nodes and edges from services and operations
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    if (!infrastructure?.services) {
      return { nodes: [], edges: [] };
    }

    const services = infrastructure.services as Service[];
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const serviceMap = new Map<string, Service>();

    // Create service nodes
    services.forEach((service) => {
      serviceMap.set(service.id, service);
      nodes.push({
        id: service.id,
        type: 'service',
        data: { 
          ...service,
          selected: selectedService?.id === service.id 
        },
        position: { x: 0, y: 0 }, // Will be calculated by dagre
        sourcePosition: Position.Right,
        targetPosition: Position.Left
      });
    });

    // Find max duration for normalization
    let max = 0;
    services.forEach((service: Service) => {
      service.operations?.forEach((operation: Operation) => {
        if (operation.metrics?.avgDurationMs) {
          max = Math.max(max, operation.metrics.avgDurationMs);
        }
      });
    });

    // Create edges from operations
    services.forEach((service: Service) => {
      service.targetServiceIds?.forEach((targetServiceId: string) => {
        if (targetServiceId && serviceMap.has(targetServiceId)) {
          const operations = (service.operations || []) as Operation[];
          const totalDuration = operations.reduce((acc: number, op: Operation) => acc + (op.metrics?.avgDurationMs || 0), 0);
          const operationsCount = operations.length || 1;
          const avgDuration = totalDuration / operationsCount;
          
          // Find the most frequent operation type
          const typeCounts: Record<string, number> = {};
          operations.forEach(op => {
            const t = op.type || 'HTTP';
            typeCounts[t] = (typeCounts[t] || 0) + 1;
          });
          
          let type = 'HTTP';
          let maxCount = 0;
          Object.entries(typeCounts).forEach(([t, count]) => {
            if (count > maxCount) {
              maxCount = count;
              type = t;
            }
          });

          const edgeColor = getEdgeColor(avgDuration, max);
          const animDuration = getAnimationDuration(avgDuration, max);
          
          // Get label color based on operation type
          const typeColor = getOperationTypeColor(type);
          const labelColor = typeColor === 'blue' ? '#60a5fa' :
                            typeColor === 'green' ? '#22c55e' :
                            typeColor === 'orange' ? '#fb923c' :
                            typeColor === 'purple' ? '#a78bfa' :
                            typeColor === 'red' ? '#f87171' :
                            typeColor === 'yellow' ? '#fbbf24' :
                            '#a3a3a3';

          edges.push({
            id: `${service.id}-${targetServiceId}`,
            source: service.id,
            target: targetServiceId,
            animated: true,
            style: {
              stroke: edgeColor,
              strokeWidth: 2,
              strokeDasharray: '5 5',
              animation: `dashdraw ${animDuration}s linear infinite`
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: edgeColor,
              width: 20,
              height: 20
            },
            label: type,
            labelStyle: {
              fill: labelColor,
              fontSize: 11,
              fontWeight: 700
            },
            labelBgStyle: {
              fill: '#1e293b',
              fillOpacity: 0.95,
              strokeWidth: 1,
              stroke: labelColor + '40'
            },
            labelBgPadding: [4, 8] as [number, number],
            labelBgBorderRadius: 6
          });
        }
      });
    });

    return { nodes, edges };
  }, [infrastructure, selectedService]);

  // Auto-layout with dagre (use saved positions if available)
  const layoutedNodes = useMemo(() => {
    if (initialNodes.length === 0) return initialNodes;

    // Try to load saved positions for this infrastructure
    let savedPositions: Record<string, { x: number; y: number }> = {};
    try {
      const key = `service-map-positions-${infrastructure?.id}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        savedPositions = JSON.parse(saved);
      }
    } catch {}

    // If we have saved positions, use them
    if (Object.keys(savedPositions).length > 0) {
      return initialNodes.map((node) => {
        const savedPos = savedPositions[node.id];
        return {
          ...node,
          position: savedPos || node.position
        };
      });
    }

    // Otherwise, use dagre auto-layout
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({ rankdir: 'LR', nodesep: 100, ranksep: 150 });

    initialNodes.forEach((node) => {
      dagreGraph.setNode(node.id, { width: 180, height: 80 });
    });

    initialEdges.forEach((edge) => {
      dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    return initialNodes.map((node) => {
      const nodeWithPosition = dagreGraph.node(node.id);
      return {
        ...node,
        position: {
          x: nodeWithPosition.x - 90,
          y: nodeWithPosition.y - 40
        }
      };
    });
  }, [initialNodes, initialEdges, infrastructure?.id]);

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    setNodes(layoutedNodes);
    setEdges(initialEdges);
  }, [layoutedNodes, initialEdges, setNodes, setEdges]);

  // Helper to get connected nodes and edges
  const getConnectedElements = useCallback((nodeId: string) => {
    const connectedNodeIds = new Set<string>();
    const connectedEdgeIds = new Set<string>();
    
    edges.forEach(edge => {
      if (edge.source === nodeId || edge.target === nodeId) {
        connectedEdgeIds.add(edge.id);
        connectedNodeIds.add(edge.source);
        connectedNodeIds.add(edge.target);
      }
    });
    
    return { connectedNodeIds, connectedEdgeIds };
  }, [edges]);

  // Compute highlighted nodes and edges
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

  const handleMouseDown = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging) {
        const newHeight = window.innerHeight - e.clientY;
        setHeight(Math.max(200, Math.min(800, newHeight)));
      }
    },
    [isDragging]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
    return undefined;
  }, [isDragging, handleMouseMove, handleMouseUp]);

  if (!isOpen) return null;

  return (
    <>
      <style>{`
        @keyframes dashdraw {
          from {
            stroke-dashoffset: 10;
          }
          to {
            stroke-dashoffset: 0;
          }
        }
        /* Hide React Flow attribution */
        .react-flow__attribution {
          display: none !important;
        }
      `}</style>
      <div
        style={{
          position: 'fixed',
          bottom: isFullscreen ? 0 : 0,
          left: isFullscreen ? 0 : 0,
          right: isFullscreen ? 0 : 0,
          top: isFullscreen ? 0 : 'auto',
          height: isFullscreen ? '100vh' : `${height}px`,
          background: '#0f172a',
          borderTop: isFullscreen ? 'none' : '2px solid #334155',
          zIndex: isFullscreen ? 9999 : 1001,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Resize Handle */}
        <div
          onMouseDown={handleMouseDown}
          style={{
            height: '8px',
            background: isDragging ? '#3b82f6' : '#334155',
            cursor: 'ns-resize',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.2s ease'
          }}
        >
          <div style={{ 
            width: '40px', 
            height: '4px', 
            background: isDragging ? '#60a5fa' : '#475569',
            borderRadius: '2px'
          }} />
        </div>

        {/* Header */}
        <div
          style={{
            padding: '12px 20px',
            borderBottom: '1px solid #334155',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#1e293b'
          }}
        >
          <div>
            <h3 style={{ margin: 0, color: '#ffffff', fontSize: '16px', fontWeight: 'bold' }}>
              Service Map - {infrastructure?.name}
            </h3>
            <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '4px' }}>
              {nodes.length} services, {edges.length} connections
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              style={{
                background: 'rgba(59, 130, 246, 0.2)',
                border: '1px solid #3b82f6',
                borderRadius: '6px',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#3b82f6'
              }}
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid #ef4444',
                borderRadius: '6px',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#ef4444'
              }}
            >
              <CloseOutlined />
            </button>
          </div>
        </div>

        {/* ReactFlow */}
        <div style={{ flex: 1, position: 'relative' }}>
          <ReactFlow
            nodes={nodes.map(n => ({
              ...n,
              style: {
                ...n.style,
                opacity: hoveredNodeId ? (n.id === hoveredNodeId || highlightedNodes.has(n.id) ? 1 : 0.3) : 1,
                transition: 'opacity 0.2s ease'
              }
            }))}
            edges={edges.map(e => ({
              ...e,
              style: {
                ...e.style,
                opacity: hoveredNodeId ? (highlightedEdges.has(e.id) ? 1 : 0.2) : 1,
                strokeWidth: highlightedEdges.has(e.id) ? 3 : 2,
                transition: 'all 0.2s ease'
              }
            }))}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            nodesDraggable={true}
            nodesConnectable={false}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            style={{ background: '#0f172a' }}
            minZoom={0.1}
            maxZoom={2.5}
            onNodeDragStop={(_, node) => {
              // Save node positions to localStorage for this infrastructure
              if (!infrastructure?.id) return;
              
              const positions: Record<string, { x: number; y: number }> = {};
              nodes.forEach(n => {
                positions[n.id] = { 
                  x: Math.round(n.position.x), 
                  y: Math.round(n.position.y) 
                };
              });
              
              const key = `service-map-positions-${infrastructure.id}`;
              localStorage.setItem(key, JSON.stringify(positions));
              console.log('💾 Service positions saved for infrastructure:', infrastructure.id);
            }}
            onNodeClick={(event, node) => {
              const services = infrastructure?.services as Service[] | undefined;
              const service = services?.find(s => s.id === node.id);
              if (service) {
                setSelectedService(service);
              }
              // Zoom to clicked node
              setTimeout(() => {
                reactFlowInstance.fitView({
                  nodes: [node],
                  padding: 0.3,
                  duration: 800
                });
              }, 50);
            }}
            onNodeMouseEnter={(_, node) => {
              setHoveredNodeId(node.id);
            }}
            onNodeMouseLeave={() => {
              setHoveredNodeId(null);
            }}
            onPaneClick={() => {
              setSelectedService(null);
              setHoveredNodeId(null);
              // Fit all nodes on empty space click
              setTimeout(() => {
                reactFlowInstance.fitView({ padding: 0.2, duration: 800 });
              }, 50);
            }}
            proOptions={{ hideAttribution: true }}
          >
            <Background color="#1f2937" gap={20} />
            <Controls
              style={{
                background: '#1f2937',
                border: '1px solid #374151'
              }}
            />
          </ReactFlow>
          
          {/* Service Detail Panel */}
          {selectedService && (
            <ServiceDetailPanel 
              data={selectedService}
              onClose={() => setSelectedService(null)}
            />
          )}
        </div>
      </div>
    </>
  );
};

export const ServiceMapBottomDrawer: React.FC<ServiceMapBottomDrawerProps> = (props) => {
  return (
    <ReactFlowProvider>
      <ServiceMapBottomDrawerInner {...props} />
    </ReactFlowProvider>
  );
};

