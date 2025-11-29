import React from 'react';
import { CloseOutlined } from '@ant-design/icons';
import { Infrastructure } from '../../api/service/interface.service';

interface InfrastructureDetailPanelProps {
  infrastructure: Infrastructure | null;
  onClose?: () => void;
  onServicesClick?: () => void;
}

const statusColor = (s?: string) =>
  s === 'ok' || s === 'healthy'
    ? '#22c55e'
    : s === 'warning' || s === 'degraded'
    ? '#f59e0b'
    : s === 'error'
    ? '#ef4444'
    : '#6b7280';

export const InfrastructureDetailPanel: React.FC<InfrastructureDetailPanelProps> = ({ 
  infrastructure, 
  onClose,
  onServicesClick 
}) => {
  if (!infrastructure) return null;

  return (
    <div
      style={{
        position: 'absolute',
        width: '450px',
        background: 'rgba(30, 41, 59, 0.95)',
        border: '1px solid #334155',
        borderRadius: '12px',
        padding: '20px',
        color: '#ffffff',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        backdropFilter: 'blur(10px)',
        maxHeight: '700px',
        overflowY: 'auto',
        zIndex: 1000
      }}
    >
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
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
            {infrastructure.name}
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
        {onClose && (
          <button
            onClick={onClose}
            style={{
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid #ef4444',
              borderRadius: '6px',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#ef4444',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
            }}
          >
            <CloseOutlined style={{ fontSize: '12px' }} />
          </button>
        )}
      </div>

      {/* Infrastructure Info & System Resources - Side by Side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        <div>
          <h4 style={{ color: '#ffffff', margin: '0 0 8px 0', fontSize: '14px' }}>Infrastructure</h4>
          <div style={{ color: '#94a3b8', fontSize: '12px', lineHeight: '1.6' }}>
            <div><strong>IP:</strong> {infrastructure.ip || 'N/A'}</div>
            <div><strong>OS:</strong> {infrastructure.osVersion || 'N/A'}</div>
            <div><strong>Type:</strong> {infrastructure.type || 'server'}</div>
          </div>
        </div>
        <div>
          <h4 style={{ color: '#ffffff', margin: '0 0 8px 0', fontSize: '14px' }}>System Resources</h4>
          <div style={{ color: '#94a3b8', fontSize: '12px', lineHeight: '1.6' }}>
            <div><strong>CPU:</strong> {infrastructure.cpu?.percentage?.toFixed(1) ?? 0}%</div>
            <div><strong>Memory:</strong> {infrastructure.memory?.usage?.toFixed(1) ?? 0}/{infrastructure.memory?.capacity?.toFixed(1) ?? 0} GB</div>
            <div><strong>Usage:</strong> {(infrastructure.memory?.percentage ? infrastructure.memory.percentage * 100 : 0).toFixed(1)}%</div>
          </div>
        </div>
      </div>

      {/* Status */}
      <div style={{ 
        marginBottom: '20px',
        padding: '12px',
        background: statusColor(infrastructure.status?.value),
        border: `1px solid ${statusColor(infrastructure.status?.value)}`,
        borderRadius: '8px'
      }}>
        <div style={{ 
          color: '#ffffff',
          fontWeight: 'bold',
          fontSize: '14px',
          marginBottom: '4px'
        }}>
          {(infrastructure.status?.value?.toUpperCase() || 'UNKNOWN')}
        </div>
        <div style={{ color: '#ffffff', fontSize: '12px', opacity: 0.9 }}>
          Infrastructure monitoring active
        </div>
      </div>

      {/* Applications */}
      {infrastructure.applications && infrastructure.applications.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <h4 style={{ color: '#ffffff', margin: '0 0 8px 0', fontSize: '14px' }}>
            Applications ({infrastructure.applications.length})
          </h4>
          <div style={{ 
            background: 'rgba(15, 23, 42, 0.8)',
            padding: '12px',
            borderRadius: '8px',
            maxHeight: '150px',
            overflowY: 'auto'
          }}>
            {infrastructure.applications.map((app, idx) => (
              <div 
                key={idx} 
                style={{
                  borderBottom: idx < infrastructure.applications!.length - 1 ? '1px solid #334155' : 'none',
                  paddingBottom: idx < infrastructure.applications!.length - 1 ? 8 : 0,
                  marginBottom: idx < infrastructure.applications!.length - 1 ? 8 : 0
                }}
              >
                <div style={{ 
                  color: '#e2e8f0', 
                  fontSize: '13px',
                  fontWeight: 600,
                  marginBottom: '4px'
                }}>
                  {app.name}
                </div>
                <div style={{ 
                  display: 'flex', 
                  gap: '8px',
                  fontSize: '11px',
                  color: '#94a3b8'
                }}>
                  <span>{app.platform}</span>
                  <span>•</span>
                  <span>v{app.version}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Services - Now as Button */}
      {infrastructure.services && infrastructure.services.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <button
            onClick={onServicesClick}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              border: '1px solid #60a5fa',
              borderRadius: '8px',
              padding: '12px 16px',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: '0 2px 8px rgba(59, 130, 246, 0.2)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.2)';
            }}
          >
            <span>View Services Map ({infrastructure.services.length})</span>
            <span style={{ fontSize: '18px' }}>→</span>
          </button>
        </div>
      )}
    </div>
  );
};

