import React, { useState } from 'react';
import '../../../assets/styles/containers/trace-detail/flame-graph.css';
import { FiChevronDown, FiChevronRight } from 'react-icons/fi';
import { Tooltip } from 'antd';

interface SpanEvent {
  name: string;
  timeUnixNano: number;
  attributes: Record<string, any>;
}

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
  events?: SpanEvent[];
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
  eventColorMap?: Record<string, string>;
  onEventClick?: (spanId: string, eventIndex: number) => void;
}

const LABEL_WIDTH = 350;

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
  eventColorMap,
  onEventClick,
}) => {
  const [collapsed, setCollapsed] = useState(false);

  const totalDurationMs = (maxTime - minTime) / 1e6;
  const spanStartMs = (span.startTime - minTime) / 1e6;
  const spanDurationMs = span.durationMs;

  const leftPercent = totalDurationMs > 0 ? (spanStartMs / totalDurationMs) * 100 : 0;
  const widthPercent = totalDurationMs > 0 ? (spanDurationMs / totalDurationMs) * 100 : 0;
  const widthPx = (spanDurationMs / totalDurationMs) * (gridWidth || 800);

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

  // Calculate depth-based padding
  const depthAttribute = Math.min(depth, 10);

  // Dynamic inline styles are necessary for computed values (position, width, color)
  const barStyle: React.CSSProperties = {
    left: `${leftPercent}%`,
    width: `${Math.max(0.3, widthPercent)}%`,
    backgroundColor: serviceMeta?.color || '#1890ff',
  };

  const labelStyle: React.CSSProperties = {
    paddingLeft: `${8 + depth * 12}px`,
  };

  const fullLabel = `${span.serviceName} → ${span.name}`;

  // Event markers on the bar — colored by event name
  const eventMarkers = (span.events || []).map((evt, i) => {
    const evtTimeMs = (evt.timeUnixNano - minTime) / 1e6;
    const evtRelMs = evtTimeMs - spanStartMs;
    const evtPosPercent = spanDurationMs > 0 ? (evtRelMs / spanDurationMs) * 100 : 0;
    const clampedPercent = Math.max(0, Math.min(100, evtPosPercent));
    const color = eventColorMap?.[evt.name] || '#faad14';
    return { ...evt, posPercent: clampedPercent, index: i, color };
  });

  return (
    <>
      <div className="flamegraph-row">
        <div className="flamegraph-label" style={labelStyle} data-depth={depthAttribute}>
          {span.children && span.children.length > 0 && (
            <span className="collapse-toggle" onClick={() => setCollapsed(!collapsed)}>
              {collapsed ? <FiChevronRight /> : <FiChevronDown />}
            </span>
          )}
          <Tooltip title={fullLabel} placement="topLeft" mouseEnterDelay={0.4}>
            <span className="flamegraph-label-text">
              {spanIcon} {fullLabel}
            </span>
          </Tooltip>
        </div>
        <div className="flamegraph-bar-container">
          <div
            className={`flamegraph-bar ${isSelected ? 'selected' : ''}`}
            style={barStyle}
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
            {/* Event markers — colored by event name */}
            {eventMarkers.map((evt) => (
              <Tooltip
                key={evt.index}
                title={`${evt.name} (${((evt.timeUnixNano - minTime) / 1e6).toFixed(2)} ms)`}
                placement="top"
              >
                <span
                  className="event-marker"
                  style={{
                    left: `${evt.posPercent}%`,
                    backgroundColor: evt.color,
                    borderColor: evt.color,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEventClick?.(span.id, evt.index);
                  }}
                />
              </Tooltip>
            ))}
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
            eventColorMap={eventColorMap}
            onEventClick={onEventClick}
          />
        ))}
    </>
  );
};

export default FlameGraphRow;