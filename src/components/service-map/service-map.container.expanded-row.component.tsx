import React from 'react';
import { ServiceMapItem } from '../../interfaces/pages/service-map/service-map.response.interface';

interface ServiceMapExpandedRowProps {
  record: ServiceMapItem;
}

const ServiceMapExpandedRowComponent: React.FC<ServiceMapExpandedRowProps> = ({ record }) => {
  const formatLatency = (latency: number) => `${latency.toFixed(2)}ms`;
  const formatPercentage = (value: number) => `${value.toFixed(2)}%`;

  return (
    <div style={{
      padding: '16px',
      backgroundColor: '#1f1f1f',
      margin: '8px 0',
      border: '1px solid #434343',
      borderRadius: '6px'
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Left Column - Service Information */}
        <div>
          <h5 style={{ color: '#fff', marginBottom: '12px', fontSize: '16px' }}>Service Information</h5>
          
          <div style={{ marginBottom: '16px' }}>
            <p style={{ color: '#d9d9d9', margin: '4px 0' }}>
              <strong style={{ color: '#fff' }}>Service ID:</strong>
              <span style={{ marginLeft: '8px', fontFamily: 'monospace' }}>{record.id}</span>
            </p>
            <p style={{ color: '#d9d9d9', margin: '4px 0' }}>
              <strong style={{ color: '#fff' }}>Service Name:</strong>
              <span style={{ marginLeft: '8px', color: '#1890ff' }}>{record.service}</span>
            </p>
            {record.operation && (
              <p style={{ color: '#d9d9d9', margin: '4px 0' }}>
                <strong style={{ color: '#fff' }}>Operation:</strong>
                <span style={{ marginLeft: '8px' }}>{record.operation}</span>
              </p>
            )}
            <p style={{ color: '#d9d9d9', margin: '4px 0' }}>
              <strong style={{ color: '#fff' }}>Type:</strong>
              <span style={{
                marginLeft: '8px',
                backgroundColor: record.type === 'service' ? '#52c41a' : '#1890ff',
                color: 'white',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '12px'
              }}>
                {record.type.toUpperCase()}
              </span>
            </p>
            {record.parentId && (
              <p style={{ color: '#d9d9d9', margin: '4px 0' }}>
                <strong style={{ color: '#fff' }}>Parent ID:</strong>
                <span style={{ marginLeft: '8px', fontFamily: 'monospace' }}>{record.parentId}</span>
              </p>
            )}
          </div>

          <h5 style={{ color: '#fff', marginBottom: '12px', fontSize: '16px' }}>Performance Metrics</h5>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div style={{ backgroundColor: '#262626', padding: '8px', borderRadius: '4px' }}>
              <div style={{ color: '#1890ff', fontSize: '12px' }}>Request Count</div>
              <div style={{ color: '#fff', fontSize: '16px', fontWeight: 'bold' }}>
                {record.requestCount.toLocaleString()}
              </div>
            </div>
            <div style={{ backgroundColor: '#262626', padding: '8px', borderRadius: '4px' }}>
              <div style={{ color: '#1890ff', fontSize: '12px' }}>Error Rate</div>
              <div style={{ 
                color: record.errorRate > 5 ? '#ff4d4f' : record.errorRate > 1 ? '#faad14' : '#52c41a',
                fontSize: '16px', 
                fontWeight: 'bold' 
              }}>
                {formatPercentage(record.errorRate)}
              </div>
            </div>
            <div style={{ backgroundColor: '#262626', padding: '8px', borderRadius: '4px' }}>
              <div style={{ color: '#1890ff', fontSize: '12px' }}>Avg Latency</div>
              <div style={{ color: '#fff', fontSize: '16px', fontWeight: 'bold' }}>
                {formatLatency(record.avgLatency)}
              </div>
            </div>
            <div style={{ backgroundColor: '#262626', padding: '8px', borderRadius: '4px' }}>
              <div style={{ color: '#1890ff', fontSize: '12px' }}>P95 Latency</div>
              <div style={{ color: '#fff', fontSize: '16px', fontWeight: 'bold' }}>
                {formatLatency(record.p95Latency)}
              </div>
            </div>
            <div style={{ backgroundColor: '#262626', padding: '8px', borderRadius: '4px' }}>
              <div style={{ color: '#1890ff', fontSize: '12px' }}>P99 Latency</div>
              <div style={{ color: '#fff', fontSize: '16px', fontWeight: 'bold' }}>
                {formatLatency(record.p99Latency)}
              </div>
            </div>
            <div style={{ backgroundColor: '#262626', padding: '8px', borderRadius: '4px' }}>
              <div style={{ color: '#1890ff', fontSize: '12px' }}>Last Seen</div>
              <div style={{ color: '#fff', fontSize: '12px' }}>
                {new Date(record.lastSeen).toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Relationships and Attributes */}
        <div>
          <h5 style={{ color: '#fff', marginBottom: '12px', fontSize: '16px' }}>Relationships</h5>
          
          {record.relatedServices.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ color: '#1890ff', fontSize: '14px', marginBottom: '8px' }}>Related Services</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {record.relatedServices.map((service, index) => (
                  <span key={index} style={{
                    backgroundColor: '#111b26',
                    border: '1px solid #1890ff',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    fontSize: '12px',
                    color: '#d9d9d9'
                  }}>
                    {service}
                  </span>
                ))}
              </div>
            </div>
          )}

          {record.relatedOperations.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ color: '#1890ff', fontSize: '14px', marginBottom: '8px' }}>Related Operations</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {record.relatedOperations.map((operation, index) => (
                  <span key={index} style={{
                    backgroundColor: '#111b26',
                    border: '1px solid #52c41a',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    fontSize: '12px',
                    color: '#d9d9d9'
                  }}>
                    {operation}
                  </span>
                ))}
              </div>
            </div>
          )}

          {Object.keys(record.attributes).length > 0 && (
            <div>
              <h5 style={{ color: '#fff', marginBottom: '12px', fontSize: '16px' }}>Attributes</h5>
              <div style={{
                backgroundColor: '#262626',
                border: '1px solid #434343',
                borderRadius: '4px',
                padding: '12px',
                maxHeight: '200px',
                overflowY: 'auto'
              }}>
                {Object.entries(record.attributes).map(([key, value], index, array) => (
                  <div key={key} style={{
                    padding: '8px 0',
                    borderBottom: index < array.length - 1 ? '1px solid #434343' : 'none',
                    color: '#d9d9d9',
                    fontSize: '12px'
                  }}>
                    <div style={{ color: '#1890ff', marginBottom: '4px' }}>{key}</div>
                    <div style={{
                      wordBreak: 'break-all',
                      fontFamily: 'monospace'
                    }}>{String(value)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServiceMapExpandedRowComponent;
