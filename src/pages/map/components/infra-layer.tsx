import React, { useMemo, useCallback, useRef, forwardRef, useImperativeHandle, useEffect, useState } from 'react';
import {
  ReactFlowProvider,
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Node,
  Edge
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Host, Position as CustomPosition, CustomSize } from '../interfaces';
import { InfraIsoBlockNode, ApplicationIsoBlockNode, ServiceIsoBlockNode, OperationIsoBlockNode, GroupNode, statusColor } from '../map-3d.page';


// ID yardımcıları - removed unused function
// Uygulama/servis/operasyon id yardımcıları bu layer'da kullanılmıyor (yalın altyapı görünümü)

const InfrastructureDetailPanel: React.FC<{ 
  host: Host | null;
  onApplicationClick?: (appName: string, targetLayer?: string) => void;
}> = ({ host, onApplicationClick }) => {
  if (!host) return null;

  const { name, ip, os, cpu, memory, applications, status } = host;

  return (
    <>
    <div
      style={{
        position: 'absolute',
        width: '350px',
        background: 'rgba(30, 41, 59, 0.95)',
        border: '1px solid #334155',
        borderRadius: '12px',
        padding: '20px',
        color: '#ffffff',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        backdropFilter: 'blur(10px)',
        maxHeight: '700px',
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
            {name}
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
            INFRASTRUCTURE
          </div>
        </div>
      </div>

      {/* Infrastructure Info */}
      <div style={{ marginBottom: '16px' }}>
        <h4 style={{ color: '#ffffff', margin: '0 0 8px 0', fontSize: '14px' }}>Infrastructure</h4>
        <div style={{ color: '#94a3b8', fontSize: '12px', lineHeight: '1.4' }}>
          <div><strong>IP:</strong> {ip || 'N/A'}</div>
          <div><strong>OS:</strong> {os || 'N/A'}</div>
          <div><strong>Type:</strong> {host.type || 'server'}</div>
        </div>
      </div>

      {/* System Resources */}
      <div style={{ marginBottom: '16px' }}>
        <h4 style={{ color: '#ffffff', margin: '0 0 8px 0', fontSize: '14px' }}>System Resources</h4>
        <div style={{ color: '#94a3b8', fontSize: '12px', lineHeight: '1.4' }}>
          <div><strong>CPU Usage:</strong> {cpu?.usage_pct ?? 0}%</div>
          <div><strong>Memory:</strong> {memory?.used_gb ?? 0}/{memory?.total_gb ?? 0} GB</div>
          <div><strong>Memory Usage:</strong> {memory?.total_gb ? Math.round(((memory?.used_gb ?? 0) / memory.total_gb) * 100) : 0}%</div>
        </div>
      </div>

      {/* Status */}
      <div style={{ 
        marginBottom: '20px',
        padding: '12px',
        background: status === 'healthy' ? 'rgba(16, 185, 129, 0.1)' : 
                   status === 'warning' ? 'rgba(245, 158, 11, 0.1)' : 
                   'rgba(239, 68, 68, 0.1)',
        border: `1px solid ${status === 'healthy' ? '#10b981' : 
                           status === 'warning' ? '#f59e0b' : '#ef4444'}`,
        borderRadius: '8px'
      }}>
        <div style={{ 
          color: status === 'healthy' ? '#10b981' : 
                 status === 'warning' ? '#f59e0b' : '#ef4444',
          fontWeight: 'bold',
          fontSize: '14px',
          marginBottom: '4px'
        }}>
          {status?.toUpperCase() || 'UNKNOWN'}
        </div>
        <div style={{ color: '#94a3b8', fontSize: '12px' }}>
          System status monitoring active
        </div>
      </div>

      {/* Applications */}
      {applications && applications.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h4 
            style={{ 
              color: '#3b82f6', 
              margin: '0 0 12px 0', 
              fontSize: '14px',
              cursor: onApplicationClick ? 'pointer' : 'default',
              padding: '6px 12px',
              borderRadius: '6px',
              transition: 'all 0.2s ease',
              display: 'inline-block',
              border: onApplicationClick ? '1px solid #3b82f6' : '1px solid transparent',
              background: onApplicationClick ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
              fontWeight: '600'
            }}
            onClick={() => {
              onApplicationClick?.(host.name, 'application');
            }}
            onMouseEnter={(e) => {
              if (onApplicationClick) {
                e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.2)';
                e.currentTarget.style.borderColor = '#60a5fa';
                e.currentTarget.style.color = '#60a5fa';
              }
            }}
            onMouseLeave={(e) => {
              if (onApplicationClick) {
                e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
                e.currentTarget.style.borderColor = '#3b82f6';
                e.currentTarget.style.color = '#3b82f6';
              }
            }}
          >
            Applications →
          </h4>
          <div style={{ 
            background: 'rgba(15, 23, 42, 0.8)',
            padding: '12px',
            borderRadius: '8px',
            maxHeight: '200px',
            overflowY: 'auto'
          }}>
            {applications.map((app, index) => (
              <div key={index} style={{ 
                marginBottom: index < applications.length - 1 ? '12px' : '0',
                paddingBottom: index < applications.length - 1 ? '12px' : '0',
                borderBottom: index < applications.length - 1 ? '1px solid #334155' : 'none'
              }}>
                <div 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    marginBottom: '6px',
                    cursor: onApplicationClick ? 'pointer' : 'default',
                    padding: '4px',
                    borderRadius: '4px',
                    transition: 'background-color 0.2s ease'
                  }}
                  onClick={() => onApplicationClick?.(app.name, 'service')}
                  onMouseEnter={(e) => {
                    if (onApplicationClick) {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (onApplicationClick) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: app.platform === 'java' ? '#f59e0b' : 
                               app.platform === 'go' ? '#10b981' : 
                               app.platform === 'node' ? '#3b82f6' : '#64748b'
                  }} />
                  <span style={{ color: '#ffffff', fontWeight: 'bold', fontSize: '13px' }}>
                    {app.name}
                  </span>
                  <span style={{
                    background: '#64748b',
                    color: '#ffffff',
                    padding: '2px 6px',
                    borderRadius: '3px',
                    fontSize: '10px'
                  }}>
                    {app.platform}
                  </span>
                </div>
                {app.services && app.services.length > 0 && (
                  <div style={{ marginLeft: '16px' }}>
                    {app.services.map((service, sIndex) => (
                      <div key={sIndex} style={{ 
                        color: '#94a3b8', 
                        fontSize: '11px',
                        marginBottom: '2px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <span style={{ color: '#64748b' }}>•</span>
                        {service.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

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
          justifyContent: 'center',
          gap: '6px'
        }}>
          📊 Logs
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
          justifyContent: 'center',
          gap: '6px'
        }}>
          📈 Metrics
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
          justifyContent: 'center',
          gap: '6px'
        }}>
          🔍 Traces
        </button>
      </div>
    </div>
    </>
  );
};

const ApplicationDetailPanel: React.FC<{ 
  host: Host | null;
  onApplicationClick?: (appName: string, targetLayer?: string) => void;
}> = ({ host, onApplicationClick }) => {
  if (!host) return null;

  // Application yapısı JSON'daki alanlara göre okunur
  const name = (host as any)?.name;
  const platform = (host as any)?.platform;
  const version = (host as any)?.version;
  const status = (host as any)?.status;
  const services = (host as any)?.services || [];

  return (
    <>
    <div
      style={{
        position: 'absolute',
        width: '350px',
        background: 'rgba(30, 41, 59, 0.95)',
        border: '1px solid #334155',
        borderRadius: '12px',
        padding: '20px',
        color: '#ffffff',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        backdropFilter: 'blur(10px)',
        maxHeight: '700px',
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
            {name}
          </h3>
          <div style={{
            display: 'flex',
            gap: 8,
            marginTop: 6,
            alignItems: 'center'
          }}>
            <div style={{
              background: '#3b82f6',
              color: '#ffffff',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: 600
            }}>
              APPLICATION
            </div>
            {platform && (
              <div style={{
                background: '#64748b',
                color: '#ffffff',
                padding: '2px 6px',
                borderRadius: '3px',
                fontSize: '10px'
              }}>
                {platform}
              </div>
            )}
            {version && (
              <div style={{
                background: '#334155',
                color: '#e2e8f0',
                padding: '2px 6px',
                borderRadius: '3px',
                fontSize: '10px'
              }}>
                v{version}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status */}
      <div style={{ 
        marginBottom: '20px',
        padding: '12px',
        background: status === 'healthy' || status === 'ok' ? 'rgba(16, 185, 129, 0.1)' : 
                   status === 'warning' || status === 'degraded' ? 'rgba(245, 158, 11, 0.1)' : 
                   'rgba(239, 68, 68, 0.1)',
        border: `1px solid ${status === 'healthy' || status === 'ok' ? '#10b981' : 
                           status === 'warning' || status === 'degraded' ? '#f59e0b' : '#ef4444'}`,
        borderRadius: '8px'
      }}>
        <div style={{ 
          color: status === 'healthy' || status === 'ok' ? '#10b981' : 
                 status === 'warning' || status === 'degraded' ? '#f59e0b' : '#ef4444',
          fontWeight: 'bold',
          fontSize: '14px',
          marginBottom: '4px'
        }}>
          {(status?.toUpperCase() || 'UNKNOWN')}
        </div>
        <div style={{ color: '#94a3b8', fontSize: '12px' }}>
          Application status monitoring active
        </div>
      </div>

      {/* Services */}
      {services && services.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <h4 
            style={{ 
              color: '#3b82f6', 
              margin: '0 0 12px 0', 
              fontSize: '14px',
              cursor: onApplicationClick ? 'pointer' : 'default',
              padding: '6px 12px',
              borderRadius: '6px',
              transition: 'all 0.2s ease',
              display: 'inline-block',
              border: onApplicationClick ? '1px solid #3b82f6' : '1px solid transparent',
              background: onApplicationClick ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
              fontWeight: '600'
            }}
            onClick={() => {
              onApplicationClick?.(name, 'service');
            }}
            onMouseEnter={(e) => {
              if (onApplicationClick) {
                e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.2)';
                e.currentTarget.style.borderColor = '#60a5fa';
                e.currentTarget.style.color = '#60a5fa';
              }
            }}
            onMouseLeave={(e) => {
              if (onApplicationClick) {
                e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
                e.currentTarget.style.borderColor = '#3b82f6';
                e.currentTarget.style.color = '#3b82f6';
              }
            }}
          >
            Services →
          </h4>
          <div style={{ 
            background: 'rgba(15, 23, 42, 0.8)',
            padding: '12px',
            borderRadius: '8px',
            maxHeight: '400px',
            overflowY: 'auto'
          }}>
            {services.map((svc: any, idx: number) => (
              <div key={idx} style={{
                borderBottom: idx < services.length - 1 ? '1px solid #334155' : 'none',
                paddingBottom: idx < services.length - 1 ? 12 : 0,
                marginBottom: idx < services.length - 1 ? 12 : 0
              }}>
                <div 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    cursor: onApplicationClick ? 'pointer' : 'default',
                    padding: '4px 6px',
                    borderRadius: 6,
                    transition: 'background-color 0.2s ease'
                  }}
                  onClick={() => onApplicationClick?.(svc.name, 'operation')}
                  onMouseEnter={(e) => {
                    if (onApplicationClick) {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (onApplicationClick) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <div style={{ color: '#e5e7eb', fontWeight: 600 }}>{svc.name}</div>
                  <div style={{
                    background: svc.data?.status === 'healthy' ? 'rgba(16,185,129,0.15)' : svc.data?.status === 'warning' ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                    border: `1px solid ${svc.data?.status === 'healthy' ? '#10b981' : svc.data?.status === 'warning' ? '#f59e0b' : '#ef4444'}`,
                    color: svc.data?.status === 'healthy' ? '#10b981' : svc.data?.status === 'warning' ? '#f59e0b' : '#ef4444',
                    padding: '2px 8px',
                    borderRadius: 6,
                    fontSize: 10
                  }}>{(svc.data?.status || 'unknown').toUpperCase()}</div>
                </div>
                <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 6 }}>
                  <div><strong>Average Latency:</strong> {svc.data?.metrics?.avg ?? 'n/a'}</div>
                  <div><strong>Min Latency:</strong> {svc.data?.metrics?.min ?? 'n/a'}</div>
                  <div><strong>Max Latency:</strong> {svc.data?.metrics?.max ?? 'n/a'}</div>
                  {svc.dependencies && Array.isArray(svc.dependencies) && svc.dependencies.length > 0 && (
                    <div style={{ marginTop: 6 }}>
                      <strong>Dependencies:</strong>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                        {svc.dependencies.map((dep: string, dIdx: number) => (
                          <span key={dIdx} style={{
                            background: '#334155',
                            color: '#e2e8f0',
                            border: '1px solid #475569',
                            borderRadius: 6,
                            padding: '2px 6px',
                            fontSize: 10
                          }}>{dep}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
    </>
  );
};

const ServiceDetailPanel: React.FC<{ 
  host: any | null;
  onApplicationClick?: (appName: string, targetLayer?: string) => void;
}> = ({ host, onApplicationClick }) => {
  if (!host) return null;

  const name = host.name;
  const type = host.data.type;
  const operations = host.operations || [];
  // const targets: Array<{ id: string; label?: string }> = host.targets || [];
  const status = host.data.status;
  const zone = host.data.zone;
  const metricsAvg = host.data.metrics.avg;
  const metricsMin = host.data.metrics.min;
  const metricsMax = host.data.metrics.max;

  return (
    <>
    <div
      style={{
        position: 'absolute',
        width: '350px',
        background: 'rgba(30, 41, 59, 0.95)',
        border: '1px solid #334155',
        borderRadius: '12px',
        padding: '20px',
        color: '#ffffff',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        backdropFilter: 'blur(10px)',
        maxHeight: '700px',
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
            {name}
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
            SERVICE
          </div>
        </div>
      </div>

      {/* System Resources */}
      <div style={{ marginBottom: '16px', display: 'flex', gap: '16px' }}>
        <div style={{ flex: 1 }}>
          <h4 style={{ color: '#ffffff', margin: '0 0 8px 0', fontSize: '14px' }}>Service Info</h4>
          <div style={{ color: '#94a3b8', fontSize: '12px', lineHeight: '1.4' }}>
            <div><strong>Name:</strong> {name || 'N/A'}</div>
            <div><strong>Zone:</strong> {zone || 'N/A'}</div>
            <div><strong>Type:</strong> {type || 'N/A'}</div>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <h4 style={{ color: '#ffffff', margin: '0 0 8px 0', fontSize: '14px' }}>Metrics</h4>
          <div style={{ color: '#94a3b8', fontSize: '12px', lineHeight: '1.4' }}>
            <div><strong>Avg Lat:</strong> {metricsAvg || 'N/A'}</div>
            <div><strong>Min Lat:</strong> {metricsMin || 'N/A'}</div>
            <div><strong>Max Lat:</strong> {metricsMax || 'N/A'}</div>
          </div>
        </div>
      </div>

      {/* Status */}
      <div style={{ 
        marginBottom: '20px',
        padding: '12px',
        background: status === 'healthy' ? 'rgba(16, 185, 129, 0.1)' : 
                   status === 'warning' ? 'rgba(245, 158, 11, 0.1)' : 
                   'rgba(239, 68, 68, 0.1)',
        border: `1px solid ${status === 'healthy' ? '#10b981' : 
                           status === 'warning' ? '#f59e0b' : '#ef4444'}`,
        borderRadius: '8px'
      }}>
        <div style={{ 
          color: status === 'healthy' ? '#10b981' : 
                 status === 'warning' ? '#f59e0b' : '#ef4444',
          fontWeight: 'bold',
          fontSize: '14px',
          marginBottom: '4px'
        }}>
          {status?.toUpperCase() || 'UNKNOWN'}
        </div>
        <div style={{ color: '#94a3b8', fontSize: '12px' }}>
          System status monitoring active
        </div>
      </div>

      {/* operations */}
      {operations && operations.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h4 
            style={{ 
              color: '#3b82f6', 
              margin: '0 0 12px 0', 
              fontSize: '14px',
              cursor: onApplicationClick ? 'pointer' : 'default',
              padding: '6px 12px',
              borderRadius: '6px',
              transition: 'all 0.2s ease',
              display: 'inline-block',
              border: onApplicationClick ? '1px solid #3b82f6' : '1px solid transparent',
              background: onApplicationClick ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
              fontWeight: '600'
            }}
            onClick={() => {
              onApplicationClick?.(name, 'operation');
            }}
            onMouseEnter={(e) => {
              if (onApplicationClick) {
                e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.2)';
                e.currentTarget.style.borderColor = '#60a5fa';
                e.currentTarget.style.color = '#60a5fa';
              }
            }}
            onMouseLeave={(e) => {
              if (onApplicationClick) {
                e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
                e.currentTarget.style.borderColor = '#3b82f6';
                e.currentTarget.style.color = '#3b82f6';
              }
            }}
          >
            Operations →
          </h4>
          <div style={{ 
            background: 'rgba(15, 23, 42, 0.8)',
            padding: '12px',
            borderRadius: '8px',
            maxHeight: '200px',
            overflowY: 'auto'
          }}>
            {operations.map((op: any, index: number) => (
              <div key={index} style={{ 
                marginBottom: index < operations.length - 1 ? '12px' : '0',
                paddingBottom: index < operations.length - 1 ? '12px' : '0',
                borderBottom: index < operations.length - 1 ? '1px solid #334155' : 'none'
              }}>
                <div 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    marginBottom: '6px',
                    cursor: onApplicationClick ? 'pointer' : 'default',
                    padding: '4px',
                    borderRadius: '4px',
                    transition: 'background-color 0.2s ease'
                  }}
                  onClick={() => onApplicationClick?.(op.name, 'operation')}
                  onMouseEnter={(e) => {
                    if (onApplicationClick) {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (onApplicationClick) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: op.method === 'POST' ? '#f59e0b' : 
                               op.method === 'GET' ? '#10b981' : 
                               op.method === 'PUT' ? '#3b82f6' : '#64748b'
                  }} />
                  <span style={{ color: '#ffffff', fontWeight: 'bold', fontSize: '13px' }}>
                  {op.name} - {op.method}
                  </span>
                  <span style={{
                    background: '#64748b',
                    color: '#ffffff',
                    padding: '2px 6px',
                    borderRadius: '3px',
                    fontSize: '10px'
                  }}>
                    {op.path}
                  </span>
                </div>
                <div style={{ color: '#94a3b8', fontSize: '12px', lineHeight: '1.4', display: 'flex', gap: '12px' }}>
                  <div><strong>Avg Lat:</strong> {op.avg_latency_ms || 'N/A'}ms</div>
                  <div><strong>P95 Lat:</strong> {op.p95_ms || 'N/A'}ms</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}



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
          justifyContent: 'center',
          gap: '6px'
        }}>
          📊 Logs
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
          justifyContent: 'center',
          gap: '6px'
        }}>
          📈 Metrics
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
          justifyContent: 'center',
          gap: '6px'
        }}>
          🔍 Traces
        </button>
      </div>
    </div>
    </>
  );
};

const OperationDetailPanel: React.FC<{ 
  host: Host | null;
  onApplicationClick?: (appName: string, targetLayer?: string) => void;
}> = ({ host }) => {
  if (!host) return null;

  const name = (host as any)?.name;
  const method = (host as any)?.method;
  const path = (host as any)?.path;
  const avgLatency = (host as any)?.avg_latency_ms;
  const p95Latency = (host as any)?.p95_ms;
  const status = (host as any)?.status;

  return (
    <>
    <div
      style={{
        position: 'absolute',
        width: '350px',
        background: 'rgba(30, 41, 59, 0.95)',
        border: '1px solid #334155',
        borderRadius: '12px',
        padding: '20px',
        color: '#ffffff',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        backdropFilter: 'blur(10px)',
        maxHeight: '700px',
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
            {name}
          </h3>
          <div style={{
            display: 'flex',
            gap: 8,
            marginTop: 6,
            alignItems: 'center'
          }}>
            <div style={{
              background: '#f59e0b',
              color: '#0b1220',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: 700
            }}>
              OPERATION
            </div>
            {typeof method !== 'undefined' && (
              <div style={{
                background: '#334155',
                color: '#e2e8f0',
                padding: '2px 6px',
                borderRadius: '3px',
                fontSize: '10px'
              }}>
                {method}
              </div>
            )}
            {typeof status !== 'undefined' && (
              <div style={{
                background: status === 'ok' ? 'rgba(16,185,129,0.15)' : status === 'warning' ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                border: `1px solid ${status === 'ok' ? '#10b981' : status === 'warning' ? '#f59e0b' : '#ef4444'}`,
                color: status === 'ok' ? '#10b981' : status === 'warning' ? '#f59e0b' : '#ef4444',
                padding: '2px 8px',
                borderRadius: 6,
                fontSize: 10
              }}>{(status || 'unknown').toUpperCase()}</div>
            )}
          </div>
        </div>
      </div>

      {/* Operation Info */}
      <div style={{ color: '#94a3b8', fontSize: 12, lineHeight: 1.6 }}>
        <div><strong>Path:</strong> {path ?? '-'}</div>
        <div style={{ display: 'flex', gap: 12 }}>
          <span><strong>Avg:</strong> {avgLatency ?? 0}ms</span>
          <span><strong>P95:</strong> {p95Latency ?? 0}ms</span>
        </div>
      </div>
    </div>
    </>
  );
};

// ========== Ana İç Bileşen ==========
interface MapLayerProps {
  selectedNodeId?: string;
  onNodeClick?: (nodeId: string, nodeType: string, newLayer?: string) => void;
  onApplicationClick?: (appName: string, targetLayer?: string) => void;
  setDetailPanelContent?: (content: React.ReactNode) => void;
  data?: any;
  groupKeyName?: string;
  hostKeyName?: string;
  layer?: string;
}

// Data processing helper function
const processLayerData = (data: any, layer: string) => {
  let groups: Array<{
    name: string;
    items: any[];
    groupPosition: CustomPosition | undefined;
    groupSize: CustomSize | undefined;
  }> = [];

  // console.log('processLayerData called with layer:', layer, 'data:', data);

  if (layer === 'infra') {
    if (!data?.regions || !Array.isArray(data.regions)) {
      console.error('Invalid data.regions:', data?.regions);
      return { groups: [], groupsRef: null };
    }
    groups = data.regions.map((r: any) => ({
      name: r.name,
      items: r.infrastructures,
      groupPosition: r.groupPosition,
      groupSize: r.groupSize
    }));
  } else if (layer === 'application') {
    if (!data?.regions || !Array.isArray(data.regions)) {
      console.error('Invalid data.regions for application layer:', data?.regions);
      return { groups: [], groupsRef: null };
    }
    
    data.regions.forEach((region: any) => {
      region.infrastructures.forEach((infra: any) => {
        if (infra.applications) {
          groups.push({
            name: infra.name,
            items: infra.applications,
            groupPosition: infra.groupPosition,
            groupSize: infra.groupSize
          });
        }
      });
    });
  } else if (layer === 'service') {
    if (!data?.regions || !Array.isArray(data.regions)) {
      console.error('Invalid data.regions for service layer:', data?.regions);
      return { groups: [], groupsRef: null };
    }
    
    data.regions.forEach((region: any) => {
      region.infrastructures.forEach((infra: any) => {
        infra.applications.forEach((app: any) => {
          if (app.services) {
            groups.push({
              name: app.name,
              items: app.services,
              groupPosition: app.groupPosition,
              groupSize: app.groupSize
            });
          }
        });
      });
    });
  } else if (layer === 'operation') {
    if (!data?.regions || !Array.isArray(data.regions)) {
      console.error('Invalid data.regions for operation layer:', data?.regions);
      return { groups: [], groupsRef: null };
    }
    
    data.regions.forEach((region: any) => {
      region.infrastructures.forEach((infra: any) => {
        infra.applications.forEach((app: any) => {
          app.services.forEach((service: any) => {
            if (service.operations) {
              groups.push({
                name: service.name,
                items: service.operations,
                groupPosition: service.groupPosition,
                groupSize: service.groupSize
              });
            }
          });
        });
      });
    });
  }

  let groupsRef: any = null;
  groupsRef = groups;
  
  // console.log('processLayerData returning:', { groups, groupsRef });
  return { groups, groupsRef };
};

const MapInner = forwardRef<any, MapLayerProps>(({ selectedNodeId, onNodeClick, onApplicationClick, setDetailPanelContent, data, layer }, ref) => {
  const groupsRef = useRef<any>(null);
  const [processedData, setProcessedData] = useState<{ 
    groups: Array<{
      name: string;
      items: any[];
      groupPosition: CustomPosition | undefined;
      groupSize: CustomSize | undefined;
    }>, 
    groupsRef: any 
  }>(() => 
    processLayerData(data, layer || 'infra')
  );
  
  // Process layer data only when layer changes
  useEffect(() => {
    // console.log('Layer changed to:', layer, '- reprocessing data');
    const newProcessedData = processLayerData(data, layer || 'infra');
    setProcessedData(newProcessedData);
    groupsRef.current = newProcessedData.groupsRef;
  }, [layer]); // Only depend on layer
  
  const { groups } = processedData;  
  const { initialNodes, initialEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Debug: Check if groups is valid
    if (!groups || !Array.isArray(groups)) {
      console.error('Groups is not valid:', groups);
      return { initialNodes: nodes, initialEdges: [] };
    }

    groups.forEach((group) => {
      const { name: groupName, items: groupItems, groupPosition: groupPos, groupSize: groupSize } = group;
      const groupId = `group::${groupName}`;
      const startX = 24;
      const startY = 24;

      // Debug: Check if groupItems is valid
      if (!groupItems || !Array.isArray(groupItems)) {
        console.error('GroupItems is not valid for group:', groupName, groupItems);
        return;
      }
      nodes.push({
          id: groupId,
          type: 'group',
          position: groupPos || { x: 0, y: 0 },
          data: { 
            label: groupName, 
            groupSize: groupSize || { width: 560, height: 300 },
            accent: '#6b7fa4' 
          },
          style: { background: 'transparent' }
        } as any);

        groupItems.forEach((item) => {
          const pos = item.position || { x: startX, y: startY };
          let nodeData: any = {};
          
          if (layer === 'infra') {
            // Infrastructure items (hosts)
            nodeData = {
              label: item.name.split(' - ')[0],
              sub: `${item.status ?? 'healthy'} ${item.cpu?.usage_pct ?? 0}%`,
              accent: statusColor(item.status),
              w: 120,
              h: 160
            };
          } else if (layer === 'application') {
            // Application items
            nodeData = {
              label: item.name,
              sub: `${item.platform} ${item.version}`,
              accent: item.platform === 'java' ? '#f59e0b' : 
                      item.platform === 'go' ? '#10b981' : 
                      item.platform === 'node' ? '#3b82f6' : '#64748b',
              w: 120,
              h: 160
            };
          } else if (layer === 'service') {
            // Service items
            nodeData = {
              label: item.name,
              sub: `${item.kind}:${item.port} (${item.health})`,
              accent: item.health === 'healthy' ? '#10b981' : 
                      item.health === 'warning' ? '#f59e0b' : '#ef4444',
              w: 120,
              h: 160
            };
          } else if (layer === 'operation') {
            // Operation items
            nodeData = {
              label: item.name,
              sub: `${item.method} ${item.avg_latency_ms ?? 0}ms`,
              accent: item.status === 'ok' ? '#10b981' : 
                      item.status === 'warning' ? '#f59e0b' : '#ef4444',
              w: 120,
              h: 160
            };
          }
          
          nodes.push({
            id: item.id || item.name,
            type: layer === 'infra' ? 'isoInfra' : layer === 'application' ? 'isoApp' : layer === 'service' ? 'isoSvc' : 'isoOp',
            position: pos,
            data: {
              ...nodeData,
              id: item.id || item.name,
              ...item
            },
            parentNode: groupId,
            extent: 'parent'
          });


          item.targets?.forEach((target: any) => {
            edges.push({
              id: `${item.id}-${target.id}`,
              source: item.id,
              target: target.id,
              label: target.label,
              type: 'smoothstep', 
              animated: true
            });
          });
        });
      });

    return { initialNodes: nodes, initialEdges: edges };
  }, [groups]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);
  const reactFlowInstance = useRef<any>(null);

  // nodeTypes'i memoize et
  const nodeTypes = useMemo(() => ({
    isoInfra: InfraIsoBlockNode,
    isoApp: ApplicationIsoBlockNode,
    isoSvc: ServiceIsoBlockNode,
    isoOp: OperationIsoBlockNode,
    group: GroupNode
  }), []);

  // Seçili node için host bilgisini bul ve detail panel'i güncelle
  const selectedHost = useMemo(() => {
    if (!selectedNodeId) return null;
    const allItems = groups.flatMap((group) => group.items);
    return allItems.find(item => (item.id || item.name) === selectedNodeId);
  }, [selectedNodeId, groups]);

  // selectedHost değiştiğinde detail panel'i güncelle
  useEffect(() => {
    if (selectedHost && setDetailPanelContent) {
      setDetailPanelContent(
        (() => {
          if (layer === 'infra') {
            return <InfrastructureDetailPanel host={selectedHost} onApplicationClick={onApplicationClick}/>;
          } else if (layer === 'application') {
            return <ApplicationDetailPanel host={selectedHost} onApplicationClick={onApplicationClick}/>;
          } else if (layer === 'service') {
            return <ServiceDetailPanel host={selectedHost} onApplicationClick={onApplicationClick}/>;
          } else if (layer === 'operation') {
            return <OperationDetailPanel host={selectedHost} onApplicationClick={onApplicationClick}/>;
          }
          return null;
        })()
      );
    } else if (setDetailPanelContent) {
      setDetailPanelContent(null);
    }
  }, [selectedHost, setDetailPanelContent, onApplicationClick]);


  // Zoom to node fonksiyonu
  const zoomToNode = useCallback((nodeId: string) => {
    if (reactFlowInstance.current) {
      if (!nodeId || nodeId === '') {
        // Boş string ise tüm view'a fit yap
        reactFlowInstance.current.fitView({
          padding: 0.1,
          duration: 800
        });
      } else {
        // Node'u bul
        const node = nodes.find(n => n.id === nodeId || n.data?.label === nodeId);
        if (node) {
          // Node'a zoom yap
          reactFlowInstance.current.fitView({
            nodes: [{ id: node.id }],
            padding: 0.1,
            duration: 800
          });
        } else {
          // Node bulunamazsa tüm view'a fit yap
          reactFlowInstance.current.fitView({
            padding: 0.1,
            duration: 800
          });
        }
      }
    }
  }, [nodes]);

  // Ref'e zoom fonksiyonunu expose et
  useImperativeHandle(ref, () => ({
    zoomToNode
  }), [zoomToNode]);

  // selectedNodeId değiştiğinde zoom yap
  useEffect(() => {
    if (selectedNodeId) {
      setTimeout(() => {
        zoomToNode(selectedNodeId);
      }, 100);
    }
  }, [selectedNodeId, zoomToNode]);

  const handleSaveStorage = useCallback(() => {
    if (groupsRef.current) {
      const base = { ...(data || {}) } as any;
      
      // Layer'a göre pozisyon bilgilerini güncelle
      if (layer === 'infra') {
        // Group pozisyonlarını güncelle
        groupsRef.current.forEach((group: any) => {
          const region = base.regions.find((r: any) => r.name === group.name);
          if (region) {
            region.groupPosition = group.groupPosition;
          }
        });
        
        // Item pozisyonlarını güncelle
        groupsRef.current.forEach((group: any) => {
          const region = base.regions.find((r: any) => r.name === group.name);
          if (region && region.infrastructures) {
            group.items.forEach((item: any) => {
              const infrastructure = region.infrastructures.find((infra: any) => infra.name === item.name);
              if (infrastructure) {
                infrastructure.position = item.position;
              }
            });
          }
        });
      } else if (layer === 'application') {
        // Group pozisyonlarını güncelle (infrastructure level)
        groupsRef.current.forEach((group: any) => {
          base.regions.forEach((region: any) => {
            if (region.infrastructures) {
              const infrastructure = region.infrastructures.find((infra: any) => infra.name === group.name);
              if (infrastructure) {
                infrastructure.groupPosition = group.groupPosition;
              }
            }
          });
        });
        
        // Item pozisyonlarını güncelle (application level)
        groupsRef.current.forEach((group: any) => {
          base.regions.forEach((region: any) => {
            if (region.infrastructures) {
              const infrastructure = region.infrastructures.find((infra: any) => infra.name === group.name);
              if (infrastructure && infrastructure.applications) {
                group.items.forEach((item: any) => {
                  const application = infrastructure.applications.find((app: any) => app.name === item.name);
                  if (application) {
                    application.position = item.position;
                  }
                });
              }
            }
          });
        });
      }
      else if (layer === 'service') {
        // Group pozisyonlarını güncelle
        groupsRef.current.forEach((group: any) => {
          base.regions.forEach((region: any) => {
            region.infrastructures.forEach((infrastructure: any) => {
              if (infrastructure.services) {
                const service = infrastructure.services.find((service: any) => service.name === group.name);
                if (service) {
                  service.groupPosition = group.groupPosition;
                }
              }
            });
          });
        });
        
        // Item pozisyonlarını güncelle (application level)
        groupsRef.current.forEach((group: any) => {
          base.regions.forEach((region: any) => {
            region.infrastructures.forEach((infrastructure: any) => {
              if (infrastructure.services) {
                const service = infrastructure.services.find((service: any) => service.name === group.name);
                if (service && service.operations) {
                  group.items.forEach((item: any) => {
                    const operation = service.operations.find((op: any) => op.name === item.name);
                    if (operation) {
                      operation.position = item.position;
                    }
                  });
                }
              }
            });
          });
        });
      }
      else if (layer === 'operation') {
        // Group pozisyonlarını güncelle
        groupsRef.current.forEach((group: any) => {
          base.regions.forEach((region: any) => {
            region.infrastructures.forEach((infrastructure: any) => {
              infrastructure.services.forEach((service: any) => {
                if (service.operations) {
                  const operation = service.operations.find((op: any) => op.name === group.name);
                  if (operation) {
                    operation.groupPosition = group.groupPosition;
                  }
                }
              });
            });
          });
        });
      }
      // console.log(`Saving data for layer ${layer}:`, base);
      localStorage.setItem('map-data', JSON.stringify(base));
    }
  }, [data, layer]);


  const onNodeDrag = useCallback((_: any, node: any) => {
    if (!groupsRef.current || !['isoInfra','isoApp','isoSvc','isoOp'].includes(node.type)) return;
    
    const parentId = node.parentNode;
    const groupName = (parentId || '').replace(`group::`, '');
    const group = groupsRef.current.find((r: any) => r.name === groupName);
    if (!group) return;

    const startX = 24;
    const startY = 24;
    const blockW = 140;
    const blockH = 180;
    
    const itemArray = group.items;
    
    const allItemPositions = itemArray.map((item: any) => item.position || { x: startX, y: startY });
    const maxItemX = Math.max(0, ...allItemPositions.map((p: any) => p.x));
    const maxItemY = Math.max(0, ...allItemPositions.map((p: any) => p.y));
    const groupW = startX * 2 + maxItemX + blockW;
    const groupH = startY * 2 + maxItemY + blockH + 60;

    const itemCount = itemArray.length;
    const itemColumnCount = Math.min(itemCount, 3);

    const maxX = Math.max(startX, groupW - blockW - startX) * itemColumnCount;
    const maxY = Math.max(startY, groupH - blockH - startY) * itemColumnCount; 
    const clampedX = Math.max(Math.max(node.position.x, startX), maxX);
    const clampedY = Math.max(Math.max(node.position.y, startY), maxY);

    // Pozisyonu güncelle
    node.position = { x: clampedX, y: clampedY };
  }, []);

  // Drag stop: konumu localStorage'a yaz
  const onNodeDragStop = useCallback((_: any, node: any) => {
    if (!groupsRef.current) return;
    
    // Group pozisyonu kaydetme
    if (node.type === 'group' && node.id.startsWith(`group::`)) {
      const name = node.id.replace(`group::`, '');
      const group = groupsRef.current.find((g: any) => g.name === name);
      if (group) {
        group.groupPosition = { x: Math.round(node.position.x), y: Math.round(node.position.y) };
        console.log(`Group ${name} position saved to groupPosition:`, group.groupPosition);
      }
      handleSaveStorage();
      return;
    }
    
    // Item pozisyonu kaydetme
    const parentId = node.parentNode;
    const groupName = (parentId || '').replace(`group::`, '');
    const group = groupsRef.current.find((g: any) => g.name === groupName);
    if (!group) {
      handleSaveStorage();
      return;
    }

    const item = group.items.find((item: any) => (item.id || item.name) === node.id);
    if (item) {
      item.position = { x: Math.round(node.position.x), y: Math.round(node.position.y) };
      // console.log(`Item ${node.id} position saved to position:`, item.position);
    }
    
    handleSaveStorage();
  }, [handleSaveStorage, layer]);

  return (
    <div style={{ width: '100%', height: '100%', background: '#060a13' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        nodesDraggable={true}
        nodesConnectable={false}
        onNodeClick={(_, node) => {
          const nodeId = node.data?.id || node.id;
          if (onNodeClick && nodeId) {
            onNodeClick(nodeId, layer);
          }
        }}
        onPaneClick={(event) => {
          if (onNodeClick) {
            onNodeClick('', 'clear');
          }
        }}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.4}
        maxZoom={1.6}
        onInit={(instance) => {
          reactFlowInstance.current = instance;
        }}
      >
        <Background gap={24} color="#223047" />
        <MiniMap pannable zoomable nodeColor={() => '#6b7fa4'} maskColor="rgba(2,6,23,0.65)" />
        <Controls position="bottom-left" showInteractive={false} />
      </ReactFlow>
      
    </div>
  );
});

// ---------- Dış sarmalayıcı ----------
const MapLayer = forwardRef<any, MapLayerProps>((props, ref) => (
  <ReactFlowProvider>
    <MapInner ref={ref} {...props} />
  </ReactFlowProvider>
));

export default MapLayer;