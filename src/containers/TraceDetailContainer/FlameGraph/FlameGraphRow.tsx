import React, { useState } from 'react';
import './FlameGraph.css';
import { FiChevronDown, FiChevronRight } from 'react-icons/fi';

interface SpanNode {
  id: string;
  parentId: string | null;
  serviceName: string;
  name: string;
  startTime: number;
  endTime: number;
  durationMs: number;
  children?: SpanNode[];
  tags?: Record<string, any>;
}

interface ServiceMeta {
  color: string;
  icon: React.ReactElement;
}

interface FlameGraphRowProps {
  span: SpanNode;
  depth: number;
  minTime: number;
  maxTime: number;
  gridWidth: number;
  selectedSpanId?: string;
  onSpanSelect?: (spanId: string) => void;
  serviceMetaMap: Record<string, ServiceMeta>;
}

const LABEL_WIDTH = 350; // Sol label alanı genişliği

const getOperationType = (span: SpanNode): string => {
  let type = span.tags?.['type'];
  
  if (type === 'http') {
    return 'HTTP';
  }
  else if (type === 'messaging') {
    return 'MESSAGING';
  }
  else if (type === 'cache') {
    return 'CACHE';
  }
  else if (type === 'database') {
    return 'DATABASE';
  }
  else if (type === 'rpc') {
    return 'RPC';
  }
  else {
    const name = span.serviceName?.toLowerCase() || '';
    if (span.tags && Object.keys(span.tags).includes('http.method') || name.includes('http')) {
      return 'HTTP';
    }
    if (
      ['postgre', 'postgresql', 'mysql', 'mariadb', 'mongo', 'mongodb', 'db', 'database'].some((db) =>
        name.includes(db)
      )
    ) {
      return 'DATABASE';
    }
    const netPeerName = span.tags?.['net.peer.name'];
    if (
      ['postgre', 'postgresql', 'mysql', 'mariadb', 'mongo', 'mongodb', 'db', 'database'].some((db) =>
        name.includes(db)
      ) &&
      netPeerName
    ) {
      return 'DATABASE';
    }
    if (name.includes('redis') || name.includes('cache')) {
      return 'CACHE';
    }
    return 'GENERAL';
  }
};

const FlameGraphRow: React.FC<FlameGraphRowProps> = ({
  span,
  depth,
  minTime,
  maxTime,
  gridWidth,
  selectedSpanId,
  onSpanSelect,
  serviceMetaMap,
}) => {
  // console.log('rowspan', span);
  const [collapsed, setCollapsed] = useState(false);

  const totalDurationMs = (maxTime - minTime) / 1e6;
  const spanStartMs = (span.startTime - minTime) / 1e6;
  const spanDurationMs = span.durationMs;

  const timelineWidth = gridWidth - LABEL_WIDTH;
  const leftPx = (spanStartMs / totalDurationMs) * timelineWidth + 75;
  const widthPx = (spanDurationMs / totalDurationMs) * timelineWidth;

  const isSelected = span.id === selectedSpanId;

  const serviceMeta = serviceMetaMap[span.serviceName];
  const operationType = getOperationType(span);
  const OPERATION_TYPES = [
    { type: 'HTTP', color: 'blue', icon: '🌐' },
    { type: 'MESSAGING', color: 'orange', icon: '💬' },
    { type: 'CACHE', color: 'purple', icon: '⚡' },
    { type: 'DATABASE', color: 'green', icon: '🗄️' },
    { type: 'RPC', color: 'red', icon: '🔄' },
  ];
  const spanIcon = OPERATION_TYPES.find((type) => type.type === operationType)?.icon || serviceMeta?.icon;

  return (
    <>
      <div className="flamegraph-row">
        <div className="flamegraph-label" style={{ paddingLeft: `${depth * 16}px` }}>
          {span.children && span.children.length > 0 && (
            <span className="collapse-toggle" onClick={() => setCollapsed(!collapsed)}>
              {collapsed ? <FiChevronRight /> : <FiChevronDown />}
            </span>
          )}
          {spanIcon} {span.serviceName} → {span.name}
        </div>
        <div className="flamegraph-bar-container">
          <div
            className={`flamegraph-bar ${isSelected ? 'selected' : ''}`}
            style={{
              left: `${leftPx}px`,
              width: `${Math.max(2, widthPx)}px`,
              backgroundColor: serviceMeta?.color || '#1890ff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0 6px',
            }}
            onClick={() => onSpanSelect?.(span.id)}
          >
            {widthPx > 80 ? (
              <>
                <span className="flamegraph-bar-start">
                  {span.tags?.['http.method'] || ''} {span.tags?.['http.target'] || ''}{' '}
                  {span.tags?.['http.status_code'] || ''}
                </span>
                <span className="duration-label">
                  {spanDurationMs > 1000
                    ? `${(spanDurationMs / 1000).toFixed(2)} s`
                    : `${spanDurationMs.toFixed(2)} ms`}
                </span>
              </>
            ) : (
              <span className="duration-label">
                {spanDurationMs > 1000 ? `${(spanDurationMs / 1000).toFixed(2)} s` : `${spanDurationMs.toFixed(2)} ms`}
              </span>
            )}
          </div>
        </div>
      </div>

      {!collapsed &&
        span.children?.map((child) => (
          <FlameGraphRow
            key={child.id}
            span={child}
            depth={depth + 1}
            minTime={minTime}
            maxTime={maxTime}
            gridWidth={gridWidth}
            selectedSpanId={selectedSpanId}
            onSpanSelect={onSpanSelect}
            serviceMetaMap={serviceMetaMap}
          />
        ))}
    </>
  );
};

export default FlameGraphRow;
