import React from 'react';
import './TraceDetail.css';
import ServiceTreePanel from './ServiceTreePanel';
import TimelineBars from './TimelineBars';

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

interface FlameGraphLayoutProps {
  data: SpanNode[];
  selectedSpanId?: string;
  onSpanSelect?: (spanId: string) => void;
}

const FlameGraphLayout: React.FC<FlameGraphLayoutProps> = ({ data, selectedSpanId, onSpanSelect }) => {
  return (
    <div className="flamegraph-container">
      <div className="tree-panel">
        <ServiceTreePanel data={data} selectedSpanId={selectedSpanId} onSpanSelect={onSpanSelect} />
      </div>
      <div className="timeline-panel">
        <TimelineBars data={data} selectedSpanId={selectedSpanId} onSpanSelect={onSpanSelect} />
      </div>
    </div>
  );
};

export default FlameGraphLayout;
