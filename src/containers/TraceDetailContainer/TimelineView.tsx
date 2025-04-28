import React from 'react';
import './TraceDetail.css';

interface SpanNode {
  id: string;
  name: string;
  serviceName: string;
  startTime: number;
  endTime: number;
  durationMs: number;
  children?: SpanNode[];
}

interface TimelineViewProps {
  data: SpanNode[];
  selectedSpanId?: string;
  onSpanSelect?: (spanId: string) => void;
}

const TimelineView: React.FC<TimelineViewProps> = ({ data, selectedSpanId, onSpanSelect }) => {
  const flattenSpans = (nodes: SpanNode[], depth = 0): (SpanNode & { depth: number })[] =>
    nodes.flatMap((node) => [
      { ...node, depth },
      ...(node.children ? flattenSpans(node.children, depth + 1) : []),
    ]);

  const spans = flattenSpans(data);
  const minTime = Math.min(...spans.map((s) => s.startTime));
  const maxTime = Math.max(...spans.map((s) => s.endTime));

  return (
    <div className="timeline-rows">
      {spans.map((span) => {
        const left = ((span.startTime - minTime) / (maxTime - minTime)) * 100;
        const widthPercent = (span.durationMs / (maxTime - minTime)) * 100;
        const width = widthPercent < 0.5 ? 0.5 : widthPercent; // min %0.5
        const isSelected = span.id === selectedSpanId;

        return (
          <div key={span.id} className="timeline-row" onClick={() => onSpanSelect?.(span.id)}>
            <div className="timeline-label">{span.serviceName} → {span.name}</div>
            <div className="timeline-bar-container">
              <div
                className={`timeline-bar ${isSelected ? 'selected' : ''}`}
                style={{ left: `${left}%`, width: `${width}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TimelineView;
