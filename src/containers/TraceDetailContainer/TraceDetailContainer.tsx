import React, { useEffect, useState } from 'react';
import TraceMetaHeader from './TraceMetaHeader';
import { TempoApi } from '../../providers';
import BaseContainer from '../../components/core/basecontainer/basecontainer';
import TimelineView from './TimelineView';
import TimelineHeader from './TimelineHeader';
import FlameGraphLayout from './FlameGraphLayout';

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

interface TraceDetailPageProps {
  traceId: string;
}

const TraceDetailPage: React.FC<TraceDetailPageProps> = ({ traceId }) => {
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState<any>(null);
  const [traceData, setTraceData] = useState<SpanNode[]>([]);
  const [selectedSpanId, setSelectedSpanId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const trace = await TempoApi.getTrace(traceId);

      const spans: SpanNode[] = trace.batches.flatMap((batch: any) =>
        batch.scopeSpans.flatMap((scopeSpan: any) =>
          scopeSpan.spans.map((span: any) => {
            const serviceName = batch.resource.attributes.find((attr: any) => attr.key === 'service.name')?.value?.stringValue;
            return {
              id: span.spanId,
              parentId: span.parentSpanId || null,
              serviceName,
              name: span.name,
              startTime: Number(span.startTimeUnixNano),
              endTime: Number(span.endTimeUnixNano),
              durationMs: (Number(span.endTimeUnixNano) - Number(span.startTimeUnixNano)) / 1e6,
            };
          })
        )
      );

      const buildTree = (spans: SpanNode[], parentId: string | null = null): SpanNode[] =>
        spans
          .filter((span) => span.parentId === parentId)
          .map((span) => ({
            ...span,
            children: buildTree(spans, span.id),
          }));

      const treeData = buildTree(spans);
      setTraceData(treeData);

      const rootSpan = spans.find((span) => !span.parentId);
      if (rootSpan) {
        setMeta({
          name: `${rootSpan.serviceName}: ${rootSpan.name}`,
          startTime: new Date(rootSpan.startTime / 1e6).toLocaleString(),
          durationMs: rootSpan.durationMs,
        });
      }

      setLoading(false);
    };

    fetchData();
  }, [traceId]);

  const flattenSpans = (nodes: SpanNode[]): SpanNode[] =>
    nodes.flatMap((node) => [node, ...(node.children ? flattenSpans(node.children) : [])]);

  const getMaxDepth = (nodes: SpanNode[], depth = 0): number =>
    nodes.length === 0 ? depth : Math.max(...nodes.map((n) => getMaxDepth(n.children || [], depth + 1)));

  const spans = flattenSpans(traceData);
  const minStartTime = Math.min(...spans.map((s) => s.startTime));
  const maxEndTime = Math.max(...spans.map((s) => s.endTime));
  const maxDepth = getMaxDepth(traceData);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!meta || traceData.length === 0) {
    return <div>No trace data found.</div>;
  }

  return (
    <BaseContainer title={`Trace Detail: ${traceId}`}>
    <TraceMetaHeader meta={meta} />
    <TimelineHeader startTime={minStartTime} endTime={maxEndTime} paddingLeft={300} /> {/* Tree genişliği */}
    <FlameGraphLayout
      data={traceData}
      selectedSpanId={selectedSpanId}
      onSpanSelect={(id) => setSelectedSpanId(id)}
    />
  </BaseContainer>
  );
};

export default TraceDetailPage;
