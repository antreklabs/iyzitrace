import React from 'react';
import { TraceItem } from '../../interfaces/pages/trace/trace.response.interface';

interface TraceExpandedRowProps {
  record: TraceItem;
  start?: number | undefined;
  end?: number | undefined;
}

const TraceExpandedRowComponent: React.FC<TraceExpandedRowProps> = ({ record, start, end }) => {
  const formatTime = (unixNano: string) => {
    const date = new Date(parseInt(unixNano) / 1000000);
    return date.toLocaleString();
  };

  const renderSpanSet = (spanSet: any, index: number) => {
    if (!spanSet) return null;

    return (
      <div key={index} style={{ marginBottom: '16px', padding: '12px', border: '1px solid #303030', borderRadius: '6px' }}>
        <h4 style={{ margin: '0 0 8px 0', color: '#d9d9d9' }}>Span Set {index + 1}</h4>
        <div style={{ marginBottom: '8px' }}>
          <strong style={{ color: '#1890ff' }}>Matched:</strong> {spanSet.matched}
        </div>
        <div style={{ marginBottom: '8px' }}>
          <strong style={{ color: '#1890ff' }}>Spans Count:</strong> {spanSet.spans?.length || 0}
        </div>
        
        {spanSet.spans && spanSet.spans.length > 0 && (
          <div>
            <strong style={{ color: '#1890ff' }}>Spans:</strong>
            <div style={{ marginTop: '8px', maxHeight: '200px', overflowY: 'auto' }}>
              {spanSet.spans.map((span: any, spanIndex: number) => (
                <div key={spanIndex} style={{ 
                  padding: '8px', 
                  margin: '4px 0', 
                  background: '#1f1f1f', 
                  borderRadius: '4px',
                  border: '1px solid #404040'
                }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {span.spanID && (
                      <span style={{ color: '#52c41a' }}>
                        <strong>ID:</strong> {span.spanID}
                      </span>
                    )}
                    {span.operationName && (
                      <span style={{ color: '#faad14' }}>
                        <strong>Operation:</strong> {span.operationName}
                      </span>
                    )}
                    {span.durationNanos && (
                      <span style={{ color: '#722ed1' }}>
                        <strong>Duration:</strong> {Math.round(span.durationNanos / 1000000)}ms
                      </span>
                    )}
                    {span.startTimeUnixNano && (
                      <span style={{ color: '#13c2c2' }}>
                        <strong>Start:</strong> {formatTime(span.startTimeUnixNano)}
                      </span>
                    )}
                  </div>
                  {span.tags && Object.keys(span.tags).length > 0 && (
                    <div style={{ marginTop: '4px' }}>
                      <strong style={{ color: '#1890ff' }}>Tags:</strong>
                      <div style={{ marginLeft: '8px' }}>
                        {Object.entries(span.tags).map(([key, value]) => (
                          <div key={key} style={{ fontSize: '12px', color: '#8c8c8c' }}>
                            {key}: {String(value)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ padding: '16px', background: '#141414', borderRadius: '6px' }}>
      <h3 style={{ margin: '0 0 16px 0', color: '#d9d9d9' }}>Trace Details</h3>
      
      {/* Basic Trace Information */}
      <div style={{ marginBottom: '16px', padding: '12px', border: '1px solid #303030', borderRadius: '6px' }}>
        <h4 style={{ margin: '0 0 8px 0', color: '#d9d9d9' }}>Basic Information</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
          <div><strong style={{ color: '#1890ff' }}>Key:</strong> {record.key}</div>
          <div><strong style={{ color: '#1890ff' }}>Trace ID:</strong> {record.traceID}</div>
          <div><strong style={{ color: '#1890ff' }}>Root Service:</strong> {record.rootServiceName || 'N/A'}</div>
          <div><strong style={{ color: '#1890ff' }}>Root Trace Name:</strong> {record.rootTraceName || 'N/A'}</div>
          <div><strong style={{ color: '#1890ff' }}>Duration:</strong> {record.durationMs}ms</div>
          <div><strong style={{ color: '#1890ff' }}>Start Time:</strong> {formatTime(record.startTimeUnixNano)}</div>
          <div><strong style={{ color: '#1890ff' }}>End Time:</strong> {formatTime(record.endTimeUnixNano)}</div>
          <div><strong style={{ color: '#1890ff' }}>Span Count:</strong> {record.spanCount}</div>
          <div><strong style={{ color: '#1890ff' }}>Children Count:</strong> {record.children?.length || 0}</div>
        </div>
      </div>

      {/* Span Set Information */}
      {record.spanSet && (
        <div style={{ marginBottom: '16px' }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#d9d9d9' }}>Main Span Set</h4>
          {renderSpanSet(record.spanSet, 0)}
        </div>
      )}

      {/* Additional Span Sets */}
      {record.spanSets && record.spanSets.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#d9d9d9' }}>Additional Span Sets</h4>
          {record.spanSets.map((spanSet: any, index: number) => renderSpanSet(spanSet, index + 1))}
        </div>
      )}

      {/* Children Information */}
      {record.children && record.children.length > 0 && (
        <div>
          <h4 style={{ margin: '0 0 8px 0', color: '#d9d9d9' }}>Children</h4>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {record.children.map((child: any, index: number) => (
              <div key={index} style={{ 
                padding: '12px', 
                margin: '8px 0', 
                background: '#1f1f1f', 
                borderRadius: '6px',
                border: '1px solid #404040'
              }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '8px' }}>
                  {child.traceID && (
                    <span style={{ color: '#52c41a' }}>
                      <strong>Trace ID:</strong> {child.traceID}
                    </span>
                  )}
                  {child.serviceName && (
                    <span style={{ color: '#faad14' }}>
                      <strong>Service:</strong> {child.serviceName}
                    </span>
                  )}
                  {child.operationName && (
                    <span style={{ color: '#722ed1' }}>
                      <strong>Operation:</strong> {child.operationName}
                    </span>
                  )}
                  {child.durationNanos && (
                    <span style={{ color: '#13c2c2' }}>
                      <strong>Duration:</strong> {Math.round(child.durationNanos / 1000000)}ms
                    </span>
                  )}
                  {child.startTimeUnixNano && (
                    <span style={{ color: '#eb2f96' }}>
                      <strong>Start:</strong> {formatTime(child.startTimeUnixNano)}
                    </span>
                  )}
                </div>
                {child.tags && Object.keys(child.tags).length > 0 && (
                  <div>
                    <strong style={{ color: '#1890ff' }}>Tags:</strong>
                    <div style={{ marginLeft: '8px', marginTop: '4px' }}>
                      {Object.entries(child.tags).map(([key, value]) => (
                        <div key={key} style={{ fontSize: '12px', color: '#8c8c8c' }}>
                          {key}: {String(value)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TraceExpandedRowComponent;
