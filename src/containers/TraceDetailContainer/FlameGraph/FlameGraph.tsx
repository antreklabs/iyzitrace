import React, { JSX } from 'react';
import { Spin } from 'antd';
import FlameGraphRow from './FlameGraphRow';
import './FlameGraph.css';

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

interface FlameGraphProps {
  data: SpanNode[];
  selectedSpanId?: string;
  onSpanSelect?: (spanId: string) => void;
  gridWidth?: number;
  serviceMetaMap?: Record<string, { color: string; icon: JSX.Element }>;
}

const flattenSpans = (nodes: SpanNode[]): SpanNode[] =>
  nodes.flatMap((node) => [node, ...(node.children ? flattenSpans(node.children) : [])]);

const FlameGraph: React.FC<FlameGraphProps> = ({ data, selectedSpanId, onSpanSelect,gridWidth,serviceMetaMap }) => {
console.log(gridWidth, "gridWidth")

  const spans = flattenSpans(data);

  if (!spans.length) {
    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <Spin tip="Loading flamegraph..." />
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
        />
      ))}
    </div>
  );
};

export default FlameGraph;
