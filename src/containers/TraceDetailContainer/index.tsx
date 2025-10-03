import React, { JSX, useEffect, useMemo, useState } from 'react';
import './TraceDetailContainer.css';
import TraceMetaHeader from './TraceMetaHeader/TraceMetaHeader';
import TimelineHeader from './TimelineHeader/TimelineHeader';
import FlameGraph from './FlameGraph/FlameGraph';
import SelectedSpanDetails from './SelectedSpanDetails/SelectedSpanDetails';
import { TempoApi } from '../../providers';
import BaseContainer from '../../components/core/basecontainer/basecontainer';
import { Spin } from 'antd';
import ServiceLegendPanel from './ServiceLegend/ServiceLegend';
import { FiDatabase, FiZap, FiBox } from 'react-icons/fi';
import { useAppSelector } from '../../store/hooks';
import { MdHttp } from 'react-icons/md';

const COLORS = [
  '#1890ff',
  '#f5222d',
  '#52c41a',
  '#faad14',
  '#13c2c2',
  '#eb2f96',
  '#722ed1',
  '#2f54eb',
  '#fa541c',
  '#a0d911',
  '#1d39c4',
  '#d4b106',
  '#eb8c00',
  '#a8071a',
  '#531dab',
  '#08979c',
  '#5cdbd3',
  '#b37feb',
  '#ff85c0',
  '#ffc069',
];

interface SpanNode {
  id: string;
  parentId: string | null;
  serviceName: string;
  name: string;
  startTime: number;
  endTime: number;
  durationMs: number;
  statusCode?: string;
  tags?: Record<string, any>;
  children?: SpanNode[];
}

interface TraceDetailContainerProps {
  traceId: string;
}

const TraceDetailContainer: React.FC<TraceDetailContainerProps> = ({ traceId }) => {
  const [traceData, setTraceData] = useState<SpanNode[]>([]);
  const [selectedSpanId, setSelectedSpanId] = useState<string | null>(null);
  const [gridWidth, setGridWidth] = useState(0);
  const { selectedUid } = useAppSelector((state) => state.datasource);

  const flattenSpans = (nodes: SpanNode[]): SpanNode[] =>
    nodes.flatMap((n) => [n, ...(n.children ? flattenSpans(n.children) : [])]);

  const getServiceIcon = (serviceName: string, s: any) => {
    console.log('span', s);
    const name = serviceName.toLowerCase();
    if (Object.keys(s.tags).includes('http.method') || name.includes('http')) {
      return <MdHttp />;
    }
    if (
      ['postgre', 'postgresql', 'mysql', 'mariadb', 'mongo', 'mongodb', 'db', 'database'].some((db) =>
        name.includes(db)
      )
    ) {
      return <FiDatabase />;
    }
    const netPeerName = s.tags['net.peer.name'];
    if (
      ['postgre', 'postgresql', 'mysql', 'mariadb', 'mongo', 'mongodb', 'db', 'database'].some((db) =>
        name.includes(db)
      ) &&
      netPeerName
    ) {
      return <FiDatabase />;
    }
    if (name.includes('redis') || name.includes('cache')) {
      return <FiZap />;
    }
    return <FiBox />;
  };

  useEffect(() => {
    const fetchTrace = async () => {
      const trace = await TempoApi.getTrace(traceId);

      const spans: SpanNode[] = trace.batches.flatMap((batch: any) =>
        batch.scopeSpans.flatMap((scopeSpan: any) =>
          scopeSpan.spans.map((span: any) => {
            const serviceName = batch.resource.attributes.find((attr: any) => attr.key === 'service.name')?.value
              ?.stringValue;
            const statusCode = span.attributes.find((attr: any) => attr.key === 'otel.status_code')?.value?.stringValue;
            const tags = Object.fromEntries(
              span.attributes.map((attr: any) => [
                attr.key,
                attr.value.stringValue || attr.value.intValue || attr.value.boolValue || '',
              ])
            );

            return {
              id: span.spanId,
              parentId: span.parentSpanId || null,
              serviceName,
              name: span.name,
              startTime: Number(span.startTimeUnixNano),
              endTime: Number(span.endTimeUnixNano),
              durationMs: (Number(span.endTimeUnixNano) - Number(span.startTimeUnixNano)) / 1e6,
              statusCode,
              tags,
            };
          })
        )
      );

      const buildTree = (spans: SpanNode[]): SpanNode[] => {
        const idSet = new Set(spans.map((s) => s.id));
        const rootCandidates = spans.filter((s) => !s.parentId || !idSet.has(s.parentId));
        const build = (parentId: string): SpanNode[] =>
          spans
            .filter((s) => s.parentId === parentId)
            .map((s) => ({
              ...s,
              children: build(s.id),
            }));
      
        return rootCandidates.map((s) => ({
          ...s,
          children: build(s.id),
        }));
      };
        const result = buildTree(spans);
      setTraceData(result);
    };

    fetchTrace();
  }, [traceId, selectedUid]);

  const spans = useMemo(() => flattenSpans(traceData), [traceData]);
  const minStartTime = Math.min(...spans.map((s) => s.startTime));
  const maxEndTime = Math.max(...spans.map((s) => s.endTime));
  const selectedSpan = spans.find((s) => s.id === selectedSpanId);

  const serviceMetaMap = useMemo(() => {
    const map: Record<string, { color: string; icon: JSX.Element }> = {};
    spans.forEach((s, i) => {
      if (!map[s.serviceName]) {
        map[s.serviceName] = {
          color: COLORS[i % COLORS.length],
          icon: getServiceIcon(s.serviceName, s),
        };
      }
    });
    return map;
  }, [spans]);

  return (
    <BaseContainer title="Trace Detail">
      <TraceMetaHeader
        traceId={traceId}
        serviceName={spans[0]?.serviceName}
        httpMethod={spans[0]?.tags?.['http.method']}
        startTimeUnixNano={spans[0]?.startTime}
        durationMs={(maxEndTime - minStartTime) / 1e6}
        totalSpans={spans.length}
        errorSpans={spans.filter((s) => s.statusCode === 'ERROR').length}
      />
      <ServiceLegendPanel serviceMetaMap={serviceMetaMap} />
      <TimelineHeader startTime={minStartTime} endTime={maxEndTime} setGridWidth={setGridWidth} />
      <div className="trace-detail-body">
        <div className="trace-flamegraph">
          {gridWidth > 0 ? (
            <FlameGraph
              data={traceData}
              selectedSpanId={selectedSpanId}
              onSpanSelect={(id) => setSelectedSpanId(id)}
              gridWidth={gridWidth}
              serviceMetaMap={serviceMetaMap}
            />
          ) : (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
              <Spin size="large" />
              <span style={{ marginLeft: '8px' }}>Loading flamegraph...</span>
            </div>
          )}
        </div>
        <div className="trace-sidebar">
          <SelectedSpanDetails span={selectedSpan} />
        </div>
      </div>
    </BaseContainer>
  );
};

export default TraceDetailContainer;
