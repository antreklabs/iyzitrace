import React, { JSX } from 'react';
import { Spin } from 'antd';
import FlameGraphRow from './FlameGraphRow';
import '../../../assets/styles/containers/trace-detail/flame-graph.css';

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
  resourceAttributes?: Record<string, any>;
  events?: SpanEvent[];
}

interface FlameGraphProps {
  data: SpanNode[];
  selectedSpanId?: string;
  onSpanSelect?: (spanId: string) => void;
  gridWidth?: number;
  serviceMetaMap?: Record<string, { color: string; icon: JSX.Element }>;
  eventColorMap?: Record<string, string>;
  onEventClick?: (spanId: string, eventIndex: number) => void;
}

const flattenSpans = (nodes: SpanNode[]): SpanNode[] =>
  nodes.flatMap((node) => [node, ...(node.children ? flattenSpans(node.children) : [])]);

const FlameGraph: React.FC<FlameGraphProps> = ({ data, selectedSpanId, onSpanSelect, gridWidth, serviceMetaMap, eventColorMap, onEventClick }) => {

  const spans = flattenSpans(data);

  if (!spans.length) {
    return (
      <div className="flamegraph-loading">
        <div className="flamegraph-loading-content">
          <Spin size="large" />
          <span className="flamegraph-loading-text">Loading flamegraph...</span>
        </div>
      </div>
    );
  }

  const minTime = Math.min(...spans.map((s) => s.startTime));
  const maxTime = Math.max(...spans.map((s) => s.endTime));

  return (
    <div className="flamegraph-container">
      {data.map((span) => (
        <FlameGraphRow
          key={span.id}
          span={span}
          depth={0}
          minTime={minTime}
          maxTime={maxTime}
          selectedSpanId={selectedSpanId}
          onSpanSelect={onSpanSelect}
          gridWidth={gridWidth}
          serviceMetaMap={serviceMetaMap}
          eventColorMap={eventColorMap}
          onEventClick={onEventClick}
        />
      ))}
    </div>
  );
};

export default FlameGraph;