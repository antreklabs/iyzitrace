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
import { Position as CustomPosition, CustomSize } from '../../interfaces/service-map/service-map.interface';
import { InfraIsoBlockNode, ServiceIsoBlockNode, GroupNode, statusColor } from './map.component';
import { Application, Operation, Service } from '../../api/service/interface.service';
import { getPluginSettings, savePluginSettings } from '../../api/service/settings.service';


// ID yardımcıları - removed unused function
// Uygulama/servis/operasyon id yardımcıları bu layer'da kullanılmıyor (yalın altyapı görünümü)

const InfrastructureDetailPanel: React.FC<{ 
  data: any | null;
  onButtonClick?: (id: string, targetLayer?: string, isItem?: boolean) => void;
}> = ({ data, onButtonClick }) => {
  if (!data) return null;
console.log('data', data);
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
            {data.name}
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
          <div><strong>IP:</strong> {data.ip || 'N/A'}</div>
          <div><strong>OS:</strong> {data.osVersion || 'N/A'}</div>
          <div><strong>Type:</strong> {data.type || 'server'}</div>
        </div>
      </div>

      {/* System Resources */}
      <div style={{ marginBottom: '16px' }}>
        <h4 style={{ color: '#ffffff', margin: '0 0 8px 0', fontSize: '14px' }}>System Resources</h4>
        <div style={{ color: '#94a3b8', fontSize: '12px', lineHeight: '1.4' }}>
          <div><strong>CPU Usage:</strong> {data.cpu?.percentage ?? 0}%</div>
          <div><strong>Memory:</strong> {data.memory?.usage ?? 0}/{data.memory?.capacity ?? 0} GB</div>
          <div><strong>Memory Usage:</strong> {data.memory?.percentage}%</div>
        </div>
      </div>

      {/* Status */}
      <div style={{ 
        marginBottom: '20px',
        padding: '12px',
        background: data.status.value.toLowerCase() === 'healthy' ? 'rgba(16, 185, 129, 0.1)' : 
                   data.status.value.toLowerCase() === 'warning' ? 'rgba(245, 158, 11, 0.1)' : 
                   'rgba(239, 68, 68, 0.1)',
        border: `1px solid ${data.status.value.toLowerCase() === 'healthy' ? '#10b981' : 
                           data.status.value.toLowerCase() === 'warning' ? '#f59e0b' : '#ef4444'}`,
        borderRadius: '8px'
      }}>
        <div style={{ 
          color: data.status.value.toLowerCase() === 'healthy' ? '#10b981' : 
                 data.status.value.toLowerCase() === 'warning' ? '#f59e0b' : '#ef4444',
          fontWeight: 'bold',
          fontSize: '14px',
          marginBottom: '4px'
        }}>
          {data.status?.value?.toUpperCase() || 'UNKNOWN'}
        </div>
        <div style={{ color: '#94a3b8', fontSize: '12px' }}>
          System status monitoring active
        </div>
      </div>

      {/* Applications */}
      {data.applications && data.applications.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h4 
            style={{ 
              color: '#3b82f6', 
              margin: '0 0 12px 0', 
              fontSize: '14px',
              cursor: onButtonClick ? 'pointer' : 'default',
              padding: '6px 12px',
              borderRadius: '6px',
              transition: 'all 0.2s ease',
              display: 'inline-block',
              border: onButtonClick ? '1px solid #3b82f6' : '1px solid transparent',
              background: onButtonClick ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
              fontWeight: '600'
            }}
            onClick={() => {
              onButtonClick?.(data.id, 'application');
            }}
            onMouseEnter={(e) => {
              if (onButtonClick) {
                e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.2)';
                e.currentTarget.style.borderColor = '#60a5fa';
                e.currentTarget.style.color = '#60a5fa';
              }
            }}
            onMouseLeave={(e) => {
              if (onButtonClick) {
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
            {data.applications.map((app: any, index: number) => (
              <div key={index} style={{ 
                marginBottom: index < data.applications.length - 1 ? '12px' : '0',
                paddingBottom: index < data.applications.length - 1 ? '12px' : '0',
                borderBottom: index < data.applications.length - 1 ? '1px solid #334155' : 'none'
              }}>
                <div 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    marginBottom: '6px',
                    cursor: onButtonClick ? 'pointer' : 'default',
                    padding: '4px',
                    borderRadius: '4px',
                    transition: 'background-color 0.2s ease'
                  }}
                  onClick={() => onButtonClick?.(app.id, 'service')}
                  onMouseEnter={(e) => {
                    if (onButtonClick) {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (onButtonClick) {
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
                    {app.services.map((service: any, sIndex: number) => (
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
  data: Application;
  onButtonClick?: (id: string, targetLayer?: string, isItem?: boolean) => void;
}> = ({ data, onButtonClick }) => {
  if (!data) return null;

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
            {data.name}
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
            {data.platform && (
              <div style={{
                background: '#64748b',
                color: '#ffffff',
                padding: '2px 6px',
                borderRadius: '3px',
                fontSize: '10px'
              }}>
                {data.platform}
              </div>
            )}
            {data.version && (
              <div style={{
                background: '#334155',
                color: '#e2e8f0',
                padding: '2px 6px',
                borderRadius: '3px',
                fontSize: '10px'
              }}>
                v{data.version}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status */}
      <div style={{ 
        marginBottom: '20px',
        padding: '12px',
        background: data.status.value.toLowerCase() === 'healthy' || data.status.value.toLowerCase() === 'ok' ? 'rgba(16, 185, 129, 0.1)' : 
                   data.status.value.toLowerCase() === 'warning' || data.status.value.toLowerCase() === 'degraded' ? 'rgba(245, 158, 11, 0.1)' : 
                   'rgba(239, 68, 68, 0.1)',
        border: `1px solid ${data.status?.value?.toLowerCase() === 'healthy' || data.status?.value?.toLowerCase() === 'ok' ? '#10b981' : 
                           data.status?.value?.toLowerCase() === 'warning' || data.status?.value?.toLowerCase() === 'degraded' ? '#f59e0b' : '#ef4444'}`,
        borderRadius: '8px'
      }}>
        <div style={{ 
          color: data.status.value.toLowerCase() === 'healthy' || data.status.value.toLowerCase() === 'ok' ? '#10b981' : 
                 data.status.value.toLowerCase() === 'warning' || data.status.value.toLowerCase() === 'degraded' ? '#f59e0b' : '#ef4444',
          fontWeight: 'bold',
          fontSize: '14px',
          marginBottom: '4px'
        }}>
          {(data.status?.value?.toUpperCase() || 'UNKNOWN')}
        </div>
        <div style={{ color: '#94a3b8', fontSize: '12px' }}>
          Application status monitoring active
        </div>
      </div>

      {/* Services */}
      {data.services && data.services.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <h4 
            style={{ 
              color: '#3b82f6', 
              margin: '0 0 12px 0', 
              fontSize: '14px',
              cursor: onButtonClick ? 'pointer' : 'default',
              padding: '6px 12px',
              borderRadius: '6px',
              transition: 'all 0.2s ease',
              display: 'inline-block',
              border: onButtonClick ? '1px solid #3b82f6' : '1px solid transparent',
              background: onButtonClick ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
              fontWeight: '600'
            }}
            onClick={() => {
              onButtonClick?.(data.id, 'service');
            }}
            onMouseEnter={(e) => {
              if (onButtonClick) {
                e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.2)';
                e.currentTarget.style.borderColor = '#60a5fa';
                e.currentTarget.style.color = '#60a5fa';
              }
            }}
            onMouseLeave={(e) => {
              if (onButtonClick) {
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
            maxHeight: '350px',
            overflowY: 'auto',
            marginBottom: 10
          }}>
            {data.services.map((svc: Service, idx: number) => (
              <div key={idx} style={{
                borderBottom: idx < data.services.length - 1 ? '1px solid #334155' : 'none',
                paddingBottom: idx < data.services.length - 1 ? 12 : 0,
                marginBottom: idx < data.services.length - 1 ? 12 : 0
              }}>
                <div 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    cursor: onButtonClick ? 'pointer' : 'default',
                    padding: '4px 6px',
                    borderRadius: 6,
                    transition: 'background-color 0.2s ease'
                  }}
                  onClick={() => onButtonClick?.(svc.id, 'service', true)}
                  onMouseEnter={(e) => {
                    if (onButtonClick) {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (onButtonClick) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <div style={{ color: '#e5e7eb', fontWeight: 600 }}>{svc.name}</div>
                  <div style={{
                    background: svc.status.value.toLowerCase() === 'healthy' ? 'rgba(16,185,129,0.15)' : svc.status.value.toLowerCase() === 'warning' ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                    border: `1px solid ${svc.status.value.toLowerCase() === 'healthy' ? '#10b981' : svc.status.value.toLowerCase() === 'warning' ? '#f59e0b' : '#ef4444'}`,
                    color: svc.status.value.toLowerCase() === 'healthy' ? '#10b981' : svc.status.value.toLowerCase() === 'warning' ? '#f59e0b' : '#ef4444',
                    padding: '2px 8px',
                    borderRadius: 6,
                    fontSize: 10
                  }}>{(svc.status.value || 'unknown').toUpperCase()}</div>
                </div>
                <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 6 }}>
                  <div><strong>Average Latency:</strong> {svc.metrics?.avgLatencyMs ?? 'n/a'}</div>
                  <div><strong>Min Latency:</strong> {svc.metrics?.minLatencyMs ?? 'n/a'}</div>
                  <div><strong>Max Latency:</strong> {svc.metrics?.maxLatencyMs ?? 'n/a'}</div>
                  {/* {svc.dependencies && Array.isArray(svc.dependencies) && svc.dependencies.length > 0 && (
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
                  )} */}
                </div>
              </div>
            ))}
          </div>
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
      )}
    </div>
    </>
  );
};

const ServiceDetailPanel: React.FC<{ 
  data: Service | null;
  onButtonClick?: (id: string, targetLayer?: string, isItem?: boolean) => void;
}> = ({ data, onButtonClick }) => {
  if (!data) return null;

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
            {data.name}
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
            <div><strong>Name:</strong> {data.name || 'N/A'}</div>
            <div><strong>Type:</strong> {data.type || 'N/A'}</div>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <h4 style={{ color: '#ffffff', margin: '0 0 8px 0', fontSize: '14px' }}>Metrics</h4>
          <div style={{ color: '#94a3b8', fontSize: '12px', lineHeight: '1.4' }}>
            <div><strong>Avg Lat:</strong> {data.metrics.avgLatencyMs || 'N/A'}</div>
            <div><strong>Min Lat:</strong> {data.metrics.minLatencyMs || 'N/A'}</div>
            <div><strong>Max Lat:</strong> {data.metrics.maxLatencyMs || 'N/A'}</div>
          </div>
        </div>
      </div>

      {/* Status */}
      <div style={{ 
        marginBottom: '20px',
        padding: '12px',
        background: data.status.value.toLowerCase() === 'healthy' ? 'rgba(16, 185, 129, 0.1)' : 
                   data.status.value.toLowerCase() === 'warning' ? 'rgba(245, 158, 11, 0.1)' : 
                   'rgba(239, 68, 68, 0.1)',
        border: `1px solid ${data.status.value.toLowerCase() === 'healthy' ? '#10b981' : 
                           data.status.value.toLowerCase() === 'warning' ? '#f59e0b' : '#ef4444'}`,
        borderRadius: '8px'
      }}>
        <div style={{ 
          color: data.status.value.toLowerCase() === 'healthy' ? '#10b981' : 
                 data.status.value.toLowerCase() === 'warning' ? '#f59e0b' : '#ef4444',
          fontWeight: 'bold',
          fontSize: '14px',
          marginBottom: '4px'
        }}>
          {data.status?.value?.toUpperCase() || 'UNKNOWN'}
        </div>
        <div style={{ color: '#94a3b8', fontSize: '12px' }}>
          System status monitoring active
        </div>
      </div>

      {/* operations */}
      {data.operations && data.operations.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h4 
            style={{ 
              color: '#3b82f6', 
              margin: '0 0 12px 0', 
              fontSize: '14px',
              cursor: 'default',
              padding: '6px 12px',
              borderRadius: '6px',
              transition: 'all 0.2s ease',
              display: 'inline-block',
              border: '1px solid transparent',
              background: 'transparent',
              fontWeight: '600'
            }}
          >
            Operations
          </h4>
          <div style={{ 
            background: 'rgba(15, 23, 42, 0.8)',
            padding: '12px',
            borderRadius: '8px',
            maxHeight: '200px',
            overflowY: 'auto'
          }}>
            {data.operations.map((op: any, index: number) => (
              <div key={index} style={{ 
                marginBottom: index < data.operations.length - 1 ? '12px' : '0',
                paddingBottom: index < data.operations.length - 1 ? '12px' : '0',
                borderBottom: index < data.operations.length - 1 ? '1px solid #334155' : 'none'
              }}>
                <div 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    marginBottom: '6px',
                    cursor: 'default',
                    padding: '4px',
                    borderRadius: '4px',
                    transition: 'background-color 0.2s ease'
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
                  <div><strong>Avg Lat:</strong> {op.metrics.avgLatencyMs || 'N/A'}ms</div>
                  <div><strong>P95 Lat:</strong> {op.metrics.p95LatencyMs || 'N/A'}ms</div>
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
  data: Operation | null;
}> = ({ data }) => {
  if (!data) return null;

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
            {data.name}
          </h3>
          <div style={{ display: 'flex', gap: 8, marginTop: 6, alignItems: 'center' }}>
            <div style={{
              background: '#64748b',
              color: '#ffffff',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '10px',
              marginTop: '4px',
              display: 'inline-block'
            }}>
              OPERATION
            </div>
            <div style={{
              background: data.type?.toLowerCase().includes('grpc') ? 'rgba(34,197,94,0.12)' : 'rgba(37,99,235,0.12)',
              color: data.type?.toLowerCase().includes('grpc') ? '#22c55e' : '#60a5fa',
              padding: '2px 8px',
              borderRadius: '8px',
              fontSize: '10px',
              border: `1px solid ${data.type?.toLowerCase().includes('grpc') ? '#14532d' : '#1e3a8a'}`
            }}>
              {data.type}
            </div>
            <div style={{
              background: 'rgba(100,116,139,0.12)',
              color: '#e2e8f0',
              padding: '2px 8px',
              borderRadius: '8px',
              fontSize: '10px',
              border: '1px solid #334155'
            }}>
              {data.method}
            </div>
          </div>
        </div>
      </div>

      {/* System Resources */}
      <div style={{ marginBottom: '16px', display: 'flex', gap: '16px' }}>
        <div style={{ flex: 1 }}>
          <h4 style={{ color: '#ffffff', margin: '0 0 8px 0', fontSize: '14px' }}>Operation Info</h4>
          <div style={{ color: '#94a3b8', fontSize: '12px', lineHeight: '1.4' }}>
            <div><strong>Name:</strong> {data.name || 'N/A'}</div>
            <div><strong>Path:</strong> {data.path || 'N/A'}</div>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <h4 style={{ color: '#ffffff', margin: '0 0 8px 0', fontSize: '14px' }}>Metrics</h4>
          <div style={{ color: '#94a3b8', fontSize: '12px', lineHeight: '1.4' }}>
            <div><strong>Avg Lat:</strong> {data.metrics.avgLatencyMs || 'N/A'}</div>
            <div><strong>p95:</strong> {data.metrics.p95LatencyMs || 'N/A'}</div>
          </div>
        </div>
      </div>

      {/* Status */}
      <div style={{ 
        marginBottom: '20px',
        padding: '12px',
        background: data.status.value.toLowerCase() === 'healthy' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
        border: `1px solid ${data.status.value.toLowerCase() === 'healthy' ? '#10b981' : '#ef4444'}`,
        borderRadius: '8px'
      }}>
        <div style={{ 
          color: data.status.value.toLowerCase() === 'healthy' ? '#10b981' : '#ef4444',
          fontWeight: 'bold',
          fontSize: '14px',
          marginBottom: '4px'
        }}>
          {data.status?.value?.toUpperCase() || 'UNKNOWN'}
        </div>
        <div style={{ color: '#94a3b8', fontSize: '12px' }}>
          System status monitoring active
        </div>
      </div>

      {/* Source/Target */}
      <div style={{ 
        display: 'flex', 
        gap: '12px',
        background: 'rgba(15, 23, 42, 0.8)',
        padding: '12px',
        borderRadius: '8px',
        marginTop: '8px',
        marginBottom: '12px'
      }}>
        <div style={{ flex: 1, color: '#94a3b8', fontSize: 12 }}>
          <div style={{ color: '#e2e8f0', fontWeight: 700, marginBottom: 6 }}>Source Service</div>
          <div>{(data as any)?.sourceName || '-'}</div>
        </div>
        <div style={{ flex: 1, color: '#94a3b8', fontSize: 12 }}>
          <div style={{ color: '#e2e8f0', fontWeight: 700, marginBottom: 6 }}>Target Service</div>
          <div>{(data as any)?.targetName || '-'}</div>
        </div>
      </div>

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

// ========== Ana İç Bileşen ==========
interface MapLayerProps {
  selectedNodeId?: string;
  onNodeClick?: (nodeId: string, nodeType: string, newLayer?: string) => void;
  onButtonClick?: (id: string, targetLayer?: string) => void;
  setDetailPanelContent?: (content: React.ReactNode) => void;
  data?: any;
  layer?: string;
}

// Data processing helper function
const processLayerData = (data: any, layer: string) => {
  let groups: Array<{
    id: string;
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
      id: r.id,
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
            id: infra.id,
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
              id: app.id,
              name: app.name,
              items: app.services,
              groupPosition: app.groupPosition,
              groupSize: app.groupSize
            });
          }
        });
      });
    });
  } 

  let groupsRef: any = null;
  groupsRef = groups;
  
  // console.log('processLayerData returning:', { groups, groupsRef });
  return { groups, groupsRef };
};

const MapInner = forwardRef<any, MapLayerProps>(({ selectedNodeId, onNodeClick, onButtonClick, setDetailPanelContent, data, layer }, ref) => {
  const groupsRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [processedData, setProcessedData] = useState<{ 
    groups: Array<{
      id: string;
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
  // Expanded grouped edge state: `${sourceId}-${targetServiceId}` or null
  const [expandedEdgeKey, setExpandedEdgeKey] = useState<string | null>(null);

  // Resolve service name by id from full map data
  const getServiceNameById = useCallback((serviceId: string | null | undefined): string | undefined => {
    if (!serviceId || !data || !Array.isArray((data as any).regions)) return undefined;
    try {
      for (const region of (data as any).regions) {
        if (!region?.infrastructures) continue;
        for (const infra of region.infrastructures) {
          if (!infra?.applications) continue;
          for (const app of infra.applications) {
            if (!app?.services) continue;
            const found = app.services.find((s: any) => s && s.id === serviceId);
            if (found) return found.name as string;
          }
        }
      }
    } catch {}
    return undefined;
  }, [data]);

  // Find infrastructure id (and name) by a service id in full data
  const getInfrastructureIdByServiceId = useCallback((serviceId: string | null | undefined): { infraId?: string; infraName?: string } => {
    if (!serviceId || !data || !Array.isArray((data as any).regions)) return {};
    try {
      for (const region of (data as any).regions) {
        if (!region?.infrastructures) continue;
        for (const infra of region.infrastructures) {
          if (!infra?.applications) continue;
          for (const app of infra.applications) {
            if (!app?.services) continue;
            const found = app.services.find((s: any) => s && s.id === serviceId);
            if (found) return { infraId: infra.id as string, infraName: infra.name as string };
          }
        }
      }
    } catch {}
    return {};
  }, [data]);

  // Find application id (and name) by a service id in full data
  const getApplicationIdByServiceId = useCallback((serviceId: string | null | undefined): { appId?: string; appName?: string } => {
    if (!serviceId || !data || !Array.isArray((data as any).regions)) return {};
    try {
      for (const region of (data as any).regions) {
        if (!region?.infrastructures) continue;
        for (const infra of region.infrastructures) {
          if (!infra?.applications) continue;
          for (const app of infra.applications) {
            if (!app?.services) continue;
            const found = app.services.find((s: any) => s && s.id === serviceId);
            if (found) return { appId: app.id as string, appName: app.name as string };
          }
        }
      }
    } catch {}
    return {};
  }, [data]);

  // Tag-like label styles per type
  const getEdgeLabelStyles = useCallback((labelText: string) => {
    const t = (labelText || '').toLowerCase();
    if (t.includes('grpc')) {
      return {
        labelStyle: { fill: '#22c55e', fontWeight: 700 },
        labelBgStyle: { fill: 'rgba(34,197,94,0.12)', stroke: '#14532d', strokeWidth: 1.25 },
        labelBgPadding: [3, 6] as any,
        labelBgBorderRadius: 8
      };
    }
    if (t.includes('http')) {
      return {
        labelStyle: { fill: '#60a5fa', fontWeight: 700 },
        labelBgStyle: { fill: 'rgba(37,99,235,0.12)', stroke: '#1e3a8a', strokeWidth: 1.25 },
        labelBgPadding: [3, 6] as any,
        labelBgBorderRadius: 8
      };
    }
    return {
      labelStyle: { fill: '#a3a3a3', fontWeight: 700 },
      labelBgStyle: { fill: 'rgba(120,120,120,0.12)', stroke: '#404040', strokeWidth: 1.25 },
      labelBgPadding: [3, 6] as any,
      labelBgBorderRadius: 8
    };
  }, []);
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
      const groupId = `group::${group.id}`;
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
          const edgeList: any[] = [];
          
          if (layer === 'infra') {
            // Infrastructure items (hosts)
            nodeData = {
              id: item.id,
              label: item.name,
              sub: `${item.status?.value} ${Math.round(item.status?.metrics?.errorPercentage)}%`,
              accent: statusColor(item.status?.value),
              w: 120,
              h: 160
            };
            // Build infra-level edges by inspecting underlying applications/services/operations
            try {
              const applications = Array.isArray((item as any).applications) ? (item as any).applications : [];
              const groupedInfraTargets = new Map<string, number>();
              applications.forEach((app: any) => {
                const services = Array.isArray(app?.services) ? app.services : [];
                services.forEach((svc: any) => {
                  const ops = Array.isArray(svc?.operations) ? svc.operations : [];
                  ops.forEach((op: any) => {
                    const tgt = op?.targetServiceId ? String(op.targetServiceId).trim() : '';
                    if (!tgt) return;
                    const { infraId: targetInfraId } = getInfrastructureIdByServiceId(tgt);
                    if (!targetInfraId || targetInfraId === item.id) return;
                    const key = `${item.id}__${targetInfraId}`;
                    groupedInfraTargets.set(key, (groupedInfraTargets.get(key) || 0) + 1);
                  });
                });
              });
              groupedInfraTargets.forEach((count, key) => {
                const [, targetInfraId] = key.split('__');
                edges.push({
                  id: `infra-edge-${item.id}-${targetInfraId}`,
                  source: item.id,
                  target: targetInfraId,
                  // label: count > 1 ? `+${count}` : 'link',
                  type: 'smoothstep',
                  animated: true
                } as any);
              });
            } catch {}
          } else if (layer === 'application') {
            // Application items
            nodeData = {
              id: item.id,
              label: item.name,
              sub: `${item.platform} ${item.version}`,
              accent: item.platform.toLowerCase() === 'java' ? '#f59e0b' : 
                      item.platform.toLowerCase() === 'go' ? '#10b981' : 
                      item.platform.toLowerCase() === 'node' ? '#3b82f6' : '#64748b',
              w: 120,
              h: 160
            };

            // Build application-level edges by inspecting services' operations targetServiceId
            try {
              const appServices = Array.isArray((item as any).services) ? (item as any).services : [];
              const groupedTargets = new Map<string, number>();
              appServices.forEach((svc: any) => {
                const ops = Array.isArray(svc?.operations) ? svc.operations : [];
                ops.forEach((op: any) => {
                  const tgt = op?.targetServiceId ? String(op.targetServiceId).trim() : '';
                  if (!tgt) return;
                  const { appId: targetAppId } = getApplicationIdByServiceId(tgt);
                  if (!targetAppId || targetAppId === item.id) return; // ignore self or unresolved
                  const key = `${item.id}__${targetAppId}`;
                  groupedTargets.set(key, (groupedTargets.get(key) || 0) + 1);
                });
              });
              groupedTargets.forEach((count, key) => {
                const [, targetAppId] = key.split('__');
                // Add one edge between applications; show count if >1
                edges.push({
                  id: `app-edge-${item.id}-${targetAppId}`,
                  source: item.id,
                  target: targetAppId,
                  // label: count > 1 ? `+${count}` : 'link',
                  type: 'smoothstep',
                  animated: true
                } as any);
              });
            } catch {}

          } else if (layer === 'service') {
            // Service items
            nodeData = {
              id: item.id,
              label: item.name,
              sub: `${item.kind}:${item.port} (${item.health})`,
              accent: item.health === 'healthy' ? '#10b981' : 
                      item.health === 'warning' ? '#f59e0b' : '#ef4444',
              w: 120,
              h: 160
            };


            if (Array.isArray(item.operations) && item.operations.length > 0) {
              const typesByTargetServiceId = new Map<string, Set<string>>();
              const opsByTargetServiceId = new Map<string, any[]>();
              item.operations.forEach((operation: any) => {
                const raw = operation.targetServiceId;
                if (raw === null || raw === undefined) return;
                const key = String(raw).trim();
                if (!key) return;
                const type = String(operation.type || 'HTTP');
                if (!typesByTargetServiceId.has(key)) typesByTargetServiceId.set(key, new Set());
                typesByTargetServiceId.get(key)!.add(type);
                if (!opsByTargetServiceId.has(key)) opsByTargetServiceId.set(key, []);
                opsByTargetServiceId.get(key)!.push(operation);
              });

              typesByTargetServiceId.forEach((typeSet, targetServiceId) => {
                const groupKey = `${item.id}-${targetServiceId}`;
                if (expandedEdgeKey === groupKey) {
                  // Expanded: render all operations to this target as separate edges
                  const ops = opsByTargetServiceId.get(targetServiceId) || [];
                  const targetServiceName = getServiceNameById(targetServiceId) || 'N/A';
                  const count = ops.length;
                  const step = 30; // px offset between parallel edges
                  const start = -((count - 1) * step) / 2; // center around 0
                  ops.forEach((op: any, idx: number) => {
                    const offset = start + idx * step;
                    const styles = getEdgeLabelStyles(String(op.type || 'HTTP'));
                    op.sourceName = item.name;
                    op.targetName = targetServiceName;
                    edgeList.push({
                      id: `${item.id}-${targetServiceId}-${op.id || idx}`,
                      source: item.id,
                      target: targetServiceId,
                      label: String(`${op.type || 'HTTP'} ${op.method || 'GET'} ${op.path || ''}`),
                      type: 'smoothstep',
                      animated: true,
                      data: { operation: op },
                      // try to visually separate: offset path and shift label
                      pathOptions: { offset },
                      labelStyle: { ...(styles.labelStyle as any), transform: `translateY(${offset}px)` },
                      labelBgStyle: { ...(styles.labelBgStyle as any), transform: `translateY(${offset}px)` },
                      labelBgPadding: styles.labelBgPadding,
                      labelBgBorderRadius: styles.labelBgBorderRadius
                    } as any);
                  });
                } else {
                  // Grouped: single edge per target
                  let label: string;
                  if (typeSet.size === 1) {
                    label = Array.from(typeSet)[0] as string;
                  } else {
                    label = `+${typeSet.size}`;
                  }
                  const styles = getEdgeLabelStyles(label);
                  edgeList.push({
                    id: groupKey,
                    source: item.id,
                    target: targetServiceId,
                    label,
                    type: 'smoothstep',
                    animated: true,
                    labelStyle: styles.labelStyle as any,
                    labelBgStyle: styles.labelBgStyle as any,
                    labelBgPadding: styles.labelBgPadding,
                    labelBgBorderRadius: styles.labelBgBorderRadius
                  });
                }
              });
            }
          } 
          
          nodes.push({
            id: item.id,
            type: layer === 'application' ? 'isoApp' : layer === 'service' ? 'isoSvc' : 'isoInfra',
            position: pos,
            data: {
              ...nodeData,
              id: item.id,
              ...item
            },
            parentNode: groupId,
            extent: 'parent'
          });


          if (edgeList.length > 0) {
            edges.push(...edgeList);
          }
        });
      });

    return { initialNodes: nodes, initialEdges: edges };
  }, [groups, expandedEdgeKey]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const reactFlowInstance = useRef<any>(null);

  // nodeTypes'i memoize et
  const nodeTypes = useMemo(() => ({
    isoInfra: InfraIsoBlockNode,
    isoApp: InfraIsoBlockNode,
    isoSvc: ServiceIsoBlockNode,
    group: GroupNode
  }), []);

  // Seçili node için host bilgisini bul ve detail panel'i güncelle
  const selectedHost = useMemo(() => {
    if (!selectedNodeId) return null;
    const allItems = groups.flatMap((group) => group.items);
    return allItems.find(item => (item.id) === selectedNodeId);
  }, [selectedNodeId, groups]);

  // selectedHost değiştiğinde detail panel'i güncelle
  useEffect(() => {
    if (selectedHost && setDetailPanelContent) {
      setDetailPanelContent(
        (() => {
          if (layer === 'infra') {
            return <InfrastructureDetailPanel data={selectedHost} onButtonClick={onButtonClick}/>;
          } else if (layer === 'application') {
            return <ApplicationDetailPanel data={selectedHost} onButtonClick={onButtonClick}/>;
          } else if (layer === 'service') {
            return <ServiceDetailPanel data={selectedHost} onButtonClick={onButtonClick}/>;
          } 
          return null;
        })()
      );
    } else if (setDetailPanelContent) {
      setDetailPanelContent(null);
    }
  }, [selectedHost, setDetailPanelContent, onButtonClick]);


  // Zoom to node fonksiyonu
  const zoomToNode = useCallback((nodeId: string) => {
    // console.log('zoomToNode:', nodeId);
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

  // Keep nodes/edges in sync when initialNodes/initialEdges change (e.g., expand/collapse)
  useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  // Helpers to compute connected elements for hover highlighting
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

  // selectedNodeId değiştiğinde zoom yap (zoomToNode referansı değişse bile tekrar tetikleme)
  useEffect(() => {
    if (!selectedNodeId) return undefined;
    const t = setTimeout(() => {
      zoomToNode(selectedNodeId);
    }, 100);
    return () => clearTimeout(t);
  }, [selectedNodeId]);

const handleSaveOnView = useCallback(async () => {
    if (groupsRef.current) {
      const base = { ...(data || {}) } as any;
      
      // Layer'a göre pozisyon bilgilerini güncelle
      if (layer === 'infra') {
        // Group pozisyonlarını güncelle
        groupsRef.current.forEach((group: any) => {
          const region = base.regions.find((r: any) => r.id === group.id);
          if (region) {
            region.groupPosition = group.groupPosition;
          }
        });
        
        // Item pozisyonlarını güncelle
        groupsRef.current.forEach((group: any) => {
          const region = base.regions.find((r: any) => r.id === group.id);
          if (region && region.infrastructures) {
            group.items.forEach((item: any) => {
              const infrastructure = region.infrastructures.find((infra: any) => infra.id === item.id);
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
              const infrastructure = region.infrastructures.find((infra: any) => infra.id === group.id);
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
              const infrastructure = region.infrastructures.find((infra: any) => infra.id === group.id);
              if (infrastructure && infrastructure.applications) {
                group.items.forEach((item: any) => {
                  const application = infrastructure.applications.find((app: any) => app.id === item.id);
                  if (application) {
                    application.position = item.position;
                  }
                });
              }
            }
          });
        });
      }else if (layer === 'service') {
        // Group pozisyonlarını güncelle (infrastructure level)
        groupsRef.current.forEach((group: any) => {
          base.regions.forEach((region: any) => {
            region.infrastructures.forEach((infrastructure: any) => {
              if (infrastructure.applications) {
                const application = infrastructure.applications.find((app: any) => app.id === group.id);
                if (application) {
                  application.groupPosition = group.groupPosition;
                }
              }
            });
          });
        });
        
        // Item pozisyonlarını güncelle (application level)
        groupsRef.current.forEach((group: any) => {
          base.regions.forEach((region: any) => {
            region.infrastructures.forEach((infrastructure: any) => {
              if (infrastructure.applications) {
              const application = infrastructure.applications.find((app: any) => app.id === group.id);
              if (application && application.services) {
                group.items.forEach((item: any) => {
                  const service = application.services.find((srv: any) => srv.id === item.id);
                  if (service) {
                    service.position = item.position;
                  }
                });
              }
            }
          });
          });
        });
      }
    
      // Düz (flat) satır formatı: { id, type, position, groupPosition, groupSize }
      const items: Array<any> = [];
      (base.regions || []).forEach((region: any) => {
        items.push({ id: region.id, type: 'region', position: region.position, groupPosition: region.groupPosition, groupSize: region.groupSize });
        (region.infrastructures || []).forEach((infra: any) => {
          items.push({ id: infra.id, type: 'infrastructure', position: infra.position, groupPosition: infra.groupPosition, groupSize: infra.groupSize });
          (infra.applications || []).forEach((app: any) => {
            items.push({ id: app.id, type: 'application', position: app.position, groupPosition: app.groupPosition, groupSize: app.groupSize });
            (app.services || []).forEach((svc: any) => {
              items.push({ id: svc.id, type: 'service', position: svc.position, groupPosition: svc.groupPosition, groupSize: svc.groupSize });
            });
          });
        });
      });
      const minimized = { items };

      // Seçili view'i bul: lastSelectedPageView -> { pageName, viewId }
      let pageName: string | undefined;
      let viewId: string | undefined;
      try {
        const lastRaw = localStorage.getItem(`lastSelectedPageView_service-map`);
        if (lastRaw) {
          const last = JSON.parse(lastRaw);
          pageName = last?.pageName;
          viewId = last?.viewId;
        }
      } catch {}

      // path'ten türet (yedek)
      if (!pageName) {
        try { pageName = window.location.pathname.split('/').pop() || 'unknown'; } catch { pageName = 'unknown'; }
      }

      if (!viewId) {
        // bir seçim yoksa kaydetme yapma
        return;
      }

      // Önce plugin settings'e yazmayı dene, başarısız olursa localStorage'a düş
      try {
        const settings = await getPluginSettings();
        const pageViews = settings.pageViews || [];
        const updated = pageViews.map((v: any) => (
          v.id === viewId && v.page === pageName ? { ...v, data: minimized } : v
        ));
        await savePluginSettings({ ...settings, pageViews: updated });
      } catch (e) {
        try {
          const key = `iyzitrace-views-${pageName}`;
          const localViews = JSON.parse(localStorage.getItem(key) || '[]');
          const updatedLocal = (localViews || []).map((v: any) => (
            v.id === viewId ? { ...v, data: minimized } : v
          ));
          localStorage.setItem(key, JSON.stringify(updatedLocal));
        } catch {}
      }
    }
  }, [data, layer]);


  const onNodeDrag = useCallback((_: any, node: any) => {
    if (!groupsRef.current || !['isoInfra','isoApp','isoSvc','isoOp'].includes(node.type)) return;
    
    const parentId = node.parentNode;
    const groupId = (parentId || '').replace(`group::`, '');
    const group = groupsRef.current.find((r: any) => r.id === groupId);
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
      const groupId = node.id.replace(`group::`, '');
      const group = groupsRef.current.find((g: any) => g.id === groupId);
      if (group) {
        group.groupPosition = { x: Math.round(node.position.x), y: Math.round(node.position.y) };
        // console.log(`Group ${groupId} position saved to groupPosition:`, group.groupPosition);
      }
      handleSaveOnView();
      return;
    }
    
    // Item pozisyonu kaydetme
    const parentId = node.parentNode;
    const groupId = (parentId || '').replace(`group::`, '');
    const group = groupsRef.current.find((g: any) => g.id === groupId);
    if (!group) {
      handleSaveOnView();
      return;
    }

    const item = group.items.find((item: any) => (item.id) === node.id);
    if (item) {
      item.position = { x: Math.round(node.position.x), y: Math.round(node.position.y) };
      // console.log(`Item ${node.id} position saved to position:`, item.position);
    }
    
    handleSaveOnView();
  }, [handleSaveOnView, layer]);

  // Delegate click from edge labels to zoomToNode
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;
    const options = { capture: true } as AddEventListenerOptions;
    const handler = (e: Event) => {
      const raw = e.target as Element | null;
      const link = raw && (raw instanceof Element) ? (raw.matches('.edge-label-link') ? raw : raw.closest('.edge-label-link')) : null;
      if (link) {
        e.stopPropagation();
        const targetId = (link as Element).getAttribute('data-target');
        if (targetId) {
          zoomToNode(String(targetId));
        }
      }
    };
    el.addEventListener('click', handler, options);
    return () => {
      el.removeEventListener('click', handler, options);
    };
  }, [zoomToNode]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', background: '#060a13' }}>
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
        onEdgeClick={(event, edge) => {
          // ensure edge click doesn't bubble to group/pane
          event?.stopPropagation?.();
          const key = `${edge.source}-${edge.target}`;
          // Do NOT collapse on edge clicks; only expand when different
          setExpandedEdgeKey(prev => (prev === key ? prev : key));
          if (edge?.source) {
            setTimeout(() => {
              zoomToNode(String(edge.source));
            }, 0);
          }
          // If expanded and specific operation edge clicked, open detail panel
          const operation = (edge as any)?.data?.operation;
          if (operation && setDetailPanelContent) {
            setDetailPanelContent(<OperationDetailPanel data={operation} />);
          }
        }}
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
        onNodeMouseEnter={(_, node) => {
          if (node.type === 'group') {
            // Group'un üzerindeyken hover'ı temizle
            setHoveredNodeId(null);
          } else {
            setHoveredNodeId(node.id);
          }
        }}
        onNodeMouseLeave={(_, node) => {
          if (node.type !== 'group') {
            setHoveredNodeId(null);
          }
        }}
        onPaneClick={(event) => {
          if (onNodeClick) {
            onNodeClick('', 'clear');
          }
          // Collapse expanded grouped edges on pane click
          setExpandedEdgeKey(null);
          // Clear hover states
          setHoveredNodeId(null);
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
        <style>{`
          /* Ensure edges (and labels) are above nodes/groups to receive clicks */
          .react-flow__edges { z-index: 1000 !important; }
          .react-flow__nodes { z-index: 1 !important; }
          /* Make edge labels clickable */
          .react-flow__edge-text, .react-flow__edge-textbg { pointer-events: all; cursor: pointer; }
          /* Allow edge path clicks as well */
          .react-flow__edge-path { pointer-events: stroke; }
        `}</style>
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