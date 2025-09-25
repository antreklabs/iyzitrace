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
}

interface ServiceMeta {
  color: string;
  icon: JSX.Element;
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
  console.log('rowspan', span);
  const [collapsed, setCollapsed] = useState(false);

  const totalDurationMs = (maxTime - minTime) / 1e6;
  const spanStartMs = (span.startTime - minTime) / 1e6;
  const spanDurationMs = span.durationMs;

  const timelineWidth = gridWidth - LABEL_WIDTH;
  const leftPx = (spanStartMs / totalDurationMs) * timelineWidth + 75;
  const widthPx = (spanDurationMs / totalDurationMs) * timelineWidth;

  const isSelected = span.id === selectedSpanId;

  const serviceMeta = serviceMetaMap[span.serviceName];

  return (
    <>
      <div className="flamegraph-row">
        <div className="flamegraph-label" style={{ paddingLeft: `${depth * 16}px` }}>
          {span.children && span.children.length > 0 && (
            <span className="collapse-toggle" onClick={() => setCollapsed(!collapsed)}>
              {collapsed ? <FiChevronRight /> : <FiChevronDown />}
            </span>
          )}
          {serviceMeta?.icon} {span.serviceName} → {span.name}
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
