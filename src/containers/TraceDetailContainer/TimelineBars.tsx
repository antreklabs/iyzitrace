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

interface TimelineBarsProps {
  data: SpanNode[];
  selectedSpanId?: string;
  onSpanSelect?: (spanId: string) => void;
}

const flattenSpans = (nodes: SpanNode[], depth = 0): (SpanNode & { depth: number })[] =>
  nodes.flatMap((node) => [
    { ...node, depth },
    ...(node.children ? flattenSpans(node.children, depth + 1) : []),
  ]);

const TimelineBars: React.FC<TimelineBarsProps> = ({ data, selectedSpanId, onSpanSelect }) => {
  const spans = flattenSpans(data);
  const minTime = Math.min(...spans.map((s) => s.startTime));
  const maxTime = Math.max(...spans.map((s) => s.endTime));

  return (
    <div className="timeline-bars-container">
      {spans.map((span) => {
        const left = ((span.startTime - minTime) / (maxTime - minTime)) * 100;
        const widthPercent = (span.durationMs / (maxTime - minTime)) * 100;
        const width = widthPercent < 0.5 ? 0.5 : widthPercent;
        const isSelected = span.id === selectedSpanId;

        return (
          <div key={span.id} className="timeline-bar-row">
            <div
              className={`timeline-bar ${isSelected ? 'selected' : ''}`}
              style={{ left: `${left}%`, width: `${width}%` }}
              onClick={() => onSpanSelect?.(span.id)}
            />
          </div>
        );
      })}
    </div>
  );
};

export default TimelineBars;
