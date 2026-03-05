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
import { css } from '@emotion/css';
import '../../assets/styles/components/service-map/service-map.css';

interface ServiceMapBottomDrawerProps {
  infrastructure: Infrastructure | null;
  isOpen: boolean;
  onClose: () => void;
}


const ServiceNode: React.FC<{ data: Service; selected?: boolean }> = (props) => {
  const { data, selected = false } = props;
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
    cursor: pointer;
    overflow: hidden;
    backdrop-filter: blur(20px);
    
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
    position: relative;
    overflow: hidden;
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
    <div className={containerStyle}>
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
        className="sm-handle"
        style={{
          background: statusConfig.color,
          boxShadow: `0 0 15px ${statusConfig.glow}`
        }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="sm-handle"
        style={{
          background: statusConfig.color,
          boxShadow: `0 0 15px ${statusConfig.glow}`
        }}
      />
      <Handle
        type="target"
        position={Position.Left}
        className="sm-handle"
        style={{
          background: statusConfig.color,
          boxShadow: `0 0 15px ${statusConfig.glow}`
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        className="sm-handle"
        style={{
          background: statusConfig.color,
          boxShadow: `0 0 15px ${statusConfig.glow}`
        }}
      />
    </div>
  );
};

const nodeTypes = {
  service: ServiceNode
};


const ServiceDetailPanel: React.FC<{
  data: Service | null;
  onClose: () => void;
}> = ({ data, onClose }) => {
  const navigate = useNavigate();

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
    navigate(`/a/antreklabs-iyzitrace-app/logs?serviceName=${encodeURIComponent(data.name)}&serviceNameOperator=%3D&option_limit=100&option_interval=5m&option_pageCount=20&option_orderBy=timestamp&option_orderDirection=desc`);
  };

  const handleNavigateToMetrics = () => {
    navigate(`/a/antreklabs-iyzitrace-app/services/${encodeURIComponent(data.name)}`);
  };

  const handleNavigateToTraces = () => {
    navigate(`/a/antreklabs-iyzitrace-app/traces?serviceName=${encodeURIComponent(data.name)}&serviceNameOperator=%3D&option_limit=100&option_interval=5m&option_pageCount=20&option_orderBy=traceId&option_orderDirection=desc`);
  };

  const containerStyle = css`
    position: absolute;
    left: 12px;
    top: 8px;
    width: 340px;
    display: flex;
    flex-direction: column;
    background: linear-gradient(
      145deg,
      rgba(15, 23, 42, 0.98) 0%,
      rgba(30, 41, 59, 0.98) 100%
    );
    border: 1px solid ${statusConfig.color}40;
    border-radius: 16px;
    color: #ffffff;
    box-shadow: 
      0 10px 30px rgba(0, 0, 0, 0.5),
      0 0 40px ${statusConfig.glow};
    max-height: calc(100% - 16px);
    overflow: hidden;
    z-index: 1000;
  `;

  const scrollableContentStyle = css`
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    padding-bottom: 10px;
    
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
  `;

  const headerStyle = css`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 14px;
    padding-bottom: 10px;
    border-bottom: 1px solid ${statusConfig.color}30;
    position: relative;
  `;

  const titleContainerStyle = css`
    flex: 1;
  `;

  const titleStyle = css`
    color: #f1f5f9;
    margin: 0;
    font-size: 16px;
    font-weight: 700;
    text-shadow: 0 1px 5px ${statusConfig.glow};
    margin-bottom: 6px;
    letter-spacing: -0.3px;
  `;

  const badgeStyle = css`
    display: inline-flex;
    align-items: center;
    gap: 5px;
    background: ${statusConfig.gradient};
    color: white;
    padding: 4px 10px;
    border-radius: 8px;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.5px;
    box-shadow: 0 2px 8px ${statusConfig.glow};
  `;

  const closeButtonStyle = css`
    background: rgba(239, 68, 68, 0.2);
    border: 1px solid #ef4444;
    border-radius: 8px;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #ef4444;
  `;

  const gridStyle = css`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-bottom: 12px;
  `;

  const sectionStyle = css`
    background: linear-gradient(
      135deg,
      rgba(30, 41, 59, 0.5) 0%,
      rgba(51, 65, 85, 0.5) 100%
    );
    padding: 10px;
    border-radius: 10px;
    border: 1px solid rgba(148, 163, 184, 0.15);
    position: relative;
    overflow: hidden;
  `;

  const sectionTitleStyle = css`
    color: #f1f5f9;
    margin: 0 0 8px 0;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    display: flex;
    align-items: center;
    gap: 5px;
  `;

  const dataRowStyle = css`
    color: #cbd5e1;
    font-size: 11px;
    line-height: 1.6;
    display: flex;
    justify-content: space-between;
    padding: 2px 0;
    
    & > strong {
      color: #94a3b8;
      font-weight: 500;
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

  const buttonsContainerStyle = css`
    padding: 12px 16px 16px;
    background: linear-gradient(
      180deg,
      transparent 0%,
      rgba(15, 23, 42, 0.95) 20%
    );
    border-top: 1px solid rgba(148, 163, 184, 0.1);
  `;

  const buttonsRowStyle = css`
    display: flex;
    gap: 12px;
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
    position: relative;
    overflow: hidden;
    letter-spacing: 0.5px;
  `;

  return (
    <div className={containerStyle}>
      <div className={scrollableContentStyle}>
        <div className={headerStyle}>
          <div className={titleContainerStyle}>
            <h3 className={titleStyle}>
              {data.name}
            </h3>
            <div className={badgeStyle}>
              <CloudServerOutlined className="sm-icon-14" />
              SERVICE
            </div>
          </div>
          <button onClick={onClose} className={closeButtonStyle}>
            <CloseOutlined className="sm-icon-16-bold" />
          </button>
        </div>

        <div className={gridStyle}>
          <div className={sectionStyle}>
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

          <div className={sectionStyle}>
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
          <div className="sm-drawer-mb-16">
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
      </div>

      <div className={buttonsContainerStyle}>
        <div className={buttonsRowStyle}>
          <button
            onClick={handleNavigateToLogs}
            className={actionButtonStyle('rgba(59, 130, 246, 0.15)', 'rgba(59, 130, 246, 0.3)', '#60a5fa')}
          >
            <BarChartOutlined className="sm-icon-16" />
            Logs
          </button>
          <button
            onClick={handleNavigateToMetrics}
            className={actionButtonStyle('rgba(34, 197, 94, 0.15)', 'rgba(34, 197, 94, 0.3)', '#4ade80')}
          >
            <LineChartOutlined className="sm-icon-16" />
            Metrics
          </button>
          <button
            onClick={handleNavigateToTraces}
            className={actionButtonStyle('rgba(168, 85, 247, 0.15)', 'rgba(168, 85, 247, 0.3)', '#c084fc')}
          >
            <ApartmentOutlined className="sm-icon-16" />
            Traces
          </button>
        </div>
      </div>
    </div>
  );
};

const getEdgeColor = (avgDurationMs: number, maxDuration: number): string => {
  if (maxDuration === 0) return '#6b7280';

  const ratio = avgDurationMs / maxDuration;

  const invertedRatio = 1 - ratio;

  if (invertedRatio > 0.85) return '#059669';
  if (invertedRatio > 0.70) return '#10b981';
  if (invertedRatio > 0.60) return '#22c55e';
  if (invertedRatio > 0.50) return '#84cc16';
  if (invertedRatio > 0.40) return '#facc15';
  if (invertedRatio > 0.30) return '#fbbf24';
  if (invertedRatio > 0.20) return '#f59e0b';
  if (invertedRatio > 0.10) return '#f97316';
  if (invertedRatio > 0.05) return '#ea580c';
  return '#dc2626';
};

const getAnimationDuration = (avgDurationMs: number, maxDuration: number): number => {
  if (maxDuration === 0) return 3;

  const ratio = avgDurationMs / maxDuration;

  if (ratio < 0.1) return 0.3;
  if (ratio < 0.3) return 0.8;
  if (ratio < 0.5) return 2;
  if (ratio < 0.7) return 4;
  if (ratio < 0.85) return 7;
  return 10;
};

const ServiceMapBottomDrawerInner: React.FC<ServiceMapBottomDrawerProps> = ({
  infrastructure,
  isOpen,
  onClose
}) => {
  const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
  const height = Math.floor(windowHeight * 0.75); // Fixed height, no drag
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const reactFlowInstance = useReactFlow();

  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    if (!infrastructure?.services) {
      return { nodes: [], edges: [] };
    }

    const services = infrastructure.services as Service[];
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const serviceMap = new Map<string, Service>();

    services.forEach((service) => {
      serviceMap.set(service.id, service);
      nodes.push({
        id: service.id,
        type: 'service',
        data: service,
        position: { x: 0, y: 0 },
        sourcePosition: Position.Right,
        targetPosition: Position.Left
      });
    });

    let max = 0;
    services.forEach((service: Service) => {
      service.operations?.forEach((operation: Operation) => {
        if (operation.metrics?.avgDurationMs) {
          max = Math.max(max, operation.metrics.avgDurationMs);
        }
      });
    });

    services.forEach((service: Service) => {
      service.targetServiceIds?.forEach((targetServiceId: string) => {
        if (targetServiceId && serviceMap.has(targetServiceId)) {
          const operations = (service.operations || []) as Operation[];
          const totalDuration = operations.reduce((acc: number, op: Operation) => acc + (op.metrics?.avgDurationMs || 0), 0);
          const operationsCount = operations.length || 1;
          const avgDuration = totalDuration / operationsCount;

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
            animated: false,
            style: {
              stroke: edgeColor,
              strokeWidth: 2
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
  }, [infrastructure]);

  const layoutedNodes = useMemo(() => {
    if (initialNodes.length === 0) return initialNodes;

    let savedPositions: Record<string, { x: number; y: number }> = {};
    try {
      const key = `service-map-positions-${infrastructure?.id}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        savedPositions = JSON.parse(saved);
      }
    } catch { }

    if (Object.keys(savedPositions).length > 0) {
      return initialNodes.map((node) => {
        const savedPos = savedPositions[node.id];
        return {
          ...node,
          position: savedPos || node.position
        };
      });
    }

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

  // Only update when infrastructure changes, not on node selection
  useEffect(() => {
    setNodes(layoutedNodes);
    setEdges(initialEdges);
  }, [infrastructure?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isOpen) return null;

  return (
    <>
      <style>{`
        .react-flow__attribution {
          display: none !important;
        }
      `}</style>
      <div
        className={`sm-drawer ${isFullscreen ? 'sm-drawer--fullscreen' : ''}`}
        style={{ height: isFullscreen ? undefined : `${height}px` }}
      >
        <div className="sm-drawer-resize-bar">
          <div className="sm-drawer-resize-handle" />
        </div>

        {
        }
        <div className="sm-drawer-header">
          <div>
            <h3 className="sm-drawer-title">
              Service Map - {infrastructure?.name}
            </h3>
            <div className="sm-drawer-subtitle">
              {nodes.length} services, {edges.length} connections
            </div>
          </div>
          <div className="sm-drawer-actions">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="sm-drawer-action-btn sm-drawer-fullscreen-btn"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
            </button>
            <button
              onClick={onClose}
              className="sm-drawer-action-btn sm-drawer-close-btn-red"
            >
              <CloseOutlined />
            </button>
          </div>
        </div>

        {
        }
        <div className="sm-drawer-content">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            nodesDraggable={true}
            nodesConnectable={false}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            className="sm-drawer-reactflow-bg"
            minZoom={0.1}
            maxZoom={2.5}
            onNodeDragStop={(_, node) => {
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
            }}
            onNodeClick={(event, node) => {
              const services = infrastructure?.services as Service[] | undefined;
              const service = services?.find(s => s.id === node.id);
              if (service) {
                setSelectedService(service);
              }
            }}
            onPaneClick={() => {
              setSelectedService(null);
            }}
            proOptions={{ hideAttribution: true }}
          >
            <Background color="#1f2937" gap={20} />
            <Controls className="sm-drawer-controls" />
          </ReactFlow>

          {
          }
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