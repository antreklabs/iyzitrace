import React, { JSX, useEffect, useMemo, useState } from 'react';
import '../../assets/styles/containers/trace-detail/index.styles';
import TraceMetaHeader from './TraceMetaHeader/TraceMetaHeader';
import TimelineHeader from './TimelineHeader/TimelineHeader';
import FlameGraph from './FlameGraph/FlameGraph';
import SelectedSpanDetails from './SelectedSpanDetails/SelectedSpanDetails';
import { TempoApi } from '../../api/provider/tempo.provider';
import BaseContainer from '../../components/core/basecontainer/basecontainer.component';
import { Spin } from 'antd';
import ServiceLegendPanel from './ServiceLegend/ServiceLegend';
import { FiBox } from 'react-icons/fi';
import { useAppSelector } from '../../store/hooks';

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

const EVENT_COLORS = [
  '#faad14', '#13c2c2', '#eb2f96', '#722ed1', '#52c41a',
  '#f5222d', '#2f54eb', '#fa541c', '#a0d911', '#d4b106',
  '#08979c', '#5cdbd3', '#b37feb', '#ff85c0', '#ffc069',
];

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
  statusCode?: string;
  tags?: Record<string, any>;
  resourceAttributes?: Record<string, any>;
  events?: SpanEvent[];
  children?: SpanNode[];
}

interface TraceDetailContainerProps {
  traceId: string;
  initialSpanId?: string;
}

const TraceDetailContainer: React.FC<TraceDetailContainerProps> = ({ traceId, initialSpanId }) => {
  const [traceData, setTraceData] = useState<SpanNode[]>([]);
  const [filteredTraceData, setFilteredTraceData] = useState<SpanNode[]>([]);
  const [selectedSpanId, setSelectedSpanId] = useState<string | null>(null);
  const [gridWidth, setGridWidth] = useState(0);
  const [selectedOperationTypes, setSelectedOperationTypes] = useState<string[]>([]);
  const [activeDetailTab, setActiveDetailTab] = useState<string>('span_attributes');
  const [expandedEventKey, setExpandedEventKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const { selectedUid } = useAppSelector((state) => state.datasource);

  const flattenSpans = (nodes: SpanNode[]): SpanNode[] =>
    nodes.flatMap((n) => [n, ...(n.children ? flattenSpans(n.children) : [])]);

  const getOperationType = (s: any): string => {
    let type = s.tags?.['type'];

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
      const name = s.serviceName?.toLowerCase() || '';
      if (Object.keys(s.tags || {}).includes('http.method') || name.includes('http')) {
        return 'HTTP';
      }
      if (
        ['postgre', 'postgresql', 'mysql', 'mariadb', 'mongo', 'mongodb', 'db', 'database'].some((db) =>
          name.includes(db)
        )
      ) {
        return 'DATABASE';
      }
      const netPeerName = s.tags?.['net.peer.name'];
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

  const getServiceIcon = (serviceName: string, s: any) => {
    const operationType = getOperationType(s);

    const OPERATION_TYPES = [
      { type: 'HTTP', color: 'blue', icon: '🌐' },
      { type: 'MESSAGING', color: 'orange', icon: '💬' },
      { type: 'CACHE', color: 'purple', icon: '⚡' },
      { type: 'DATABASE', color: 'green', icon: '🗄️' },
      { type: 'RPC', color: 'red', icon: '🔄' },
    ];

    return OPERATION_TYPES.find((type) => type.type === operationType)?.icon || <FiBox />;
  };

  useEffect(() => {
    const fetchTrace = async () => {
      try {
        setIsLoading(true);
        setHasError(false);

        const trace = await TempoApi.getTrace(traceId);

        if (!trace || !trace.batches || trace.batches.length === 0) {
          setTraceData([]);
          setFilteredTraceData([]);
          setIsLoading(false);
          return;
        }

        const extractAttrValue = (attr: any): any => {
          if (!attr?.value) return '';
          const v = attr.value;
          return v.stringValue ?? v.intValue ?? v.boolValue ?? v.doubleValue ?? JSON.stringify(v.arrayValue || v.kvlistValue || '') ?? '';
        };

        const spans: SpanNode[] = trace.batches.flatMap((batch: any) =>
          batch.scopeSpans.flatMap((scopeSpan: any) =>
            scopeSpan.spans.map((span: any) => {
              const serviceName = batch.resource.attributes.find((attr: any) => attr.key === 'service.name')?.value
                ?.stringValue;
              const statusCode = span.attributes?.find((attr: any) => attr.key === 'otel.status_code')?.value?.stringValue;
              const tags = Object.fromEntries(
                (span.attributes || []).map((attr: any) => [
                  attr.key,
                  extractAttrValue(attr),
                ])
              );

              const resourceAttributes = Object.fromEntries(
                (batch.resource.attributes || []).map((attr: any) => [
                  attr.key,
                  extractAttrValue(attr),
                ])
              );

              const events: SpanEvent[] = (span.events || []).map((evt: any) => ({
                name: evt.name || '',
                timeUnixNano: Number(evt.timeUnixNano),
                attributes: Object.fromEntries(
                  (evt.attributes || []).map((attr: any) => [
                    attr.key,
                    extractAttrValue(attr),
                  ])
                ),
              }));

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
                resourceAttributes,
                events,
              };
            })
          )
        );

        if (spans.length === 0) {
          setTraceData([]);
          setFilteredTraceData([]);
          setIsLoading(false);
          return;
        }

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
        setFilteredTraceData(result);
        setIsLoading(false);
      } catch (error) {
        setHasError(true);
        setIsLoading(false);
        setTraceData([]);
        setFilteredTraceData([]);
      }
    };

    fetchTrace();
  }, [traceId, selectedUid]);

  useEffect(() => {
    if (initialSpanId && traceData.length > 0 && !selectedSpanId) {
      const allSpansFlat = flattenSpans(traceData);
      const spanExists = allSpansFlat.some((span) => span.id === initialSpanId);
      if (spanExists) {
        setSelectedSpanId(initialSpanId);
      }
    }
  }, [initialSpanId, traceData, selectedSpanId]);

  useEffect(() => {
    if (selectedOperationTypes.length === 0) {
      setFilteredTraceData(traceData);
      return;
    }

    const filterSpans = (nodes: SpanNode[]): SpanNode[] => {
      const allMatchingSpans: SpanNode[] = [];

      const collectMatchingSpans = (nodes: SpanNode[]) => {
        nodes.forEach(node => {
          const operationType = getOperationType(node);
          const matchesFilter = selectedOperationTypes.includes(operationType);

          if (matchesFilter) {
            const { children, ...nodeWithoutChildren } = node;
            allMatchingSpans.push(nodeWithoutChildren as SpanNode);
          }

          if (node.children && node.children.length > 0) {
            collectMatchingSpans(node.children);
          }
        });
      };

      collectMatchingSpans(nodes);
      return allMatchingSpans;
    };

    const filtered = filterSpans(JSON.parse(JSON.stringify(traceData)));
    setFilteredTraceData(filtered);
  }, [traceData, selectedOperationTypes]);

  const allSpans = useMemo(() => flattenSpans(traceData), [traceData]);
  const minStartTime = allSpans.length > 0 ? Math.min(...allSpans.map((s) => s.startTime)) : 0;
  const maxEndTime = allSpans.length > 0 ? Math.max(...allSpans.map((s) => s.endTime)) : 0;
  const selectedSpan = allSpans.find((s) => s.id === selectedSpanId);

  const serviceMetaMap = useMemo(() => {
    const map: Record<string, { color: string; icon: JSX.Element; operationType: string }> = {};
    allSpans.forEach((s, i) => {
      if (!map[s.serviceName]) {
        map[s.serviceName] = {
          color: COLORS[i % COLORS.length],
          icon: getServiceIcon(s.serviceName, s) as JSX.Element,
          operationType: getOperationType(s),
        };
      }
    });

    return map;
  }, [allSpans]);

  const eventColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    let colorIdx = 0;
    allSpans.forEach((s) => {
      (s.events || []).forEach((evt) => {
        if (!map[evt.name]) {
          map[evt.name] = EVENT_COLORS[colorIdx % EVENT_COLORS.length];
          colorIdx++;
        }
      });
    });
    return map;
  }, [allSpans]);

  const handleOperationTypeFilter = (selectedTypes: string[]) => {
    setSelectedOperationTypes(selectedTypes);
  };

  const handleEventClick = (spanId: string, eventIndex: number) => {
    setSelectedSpanId(spanId);
    setActiveDetailTab('events');
    setExpandedEventKey(String(eventIndex));
  };

  return (
    <BaseContainer title="Trace Detail" showHeaderActions={false}>
      <TraceMetaHeader
        traceId={traceId}
        serviceName={allSpans[0]?.serviceName || 'Unknown'}
        httpMethod={allSpans[0]?.tags?.['http.method']}
        startTimeUnixNano={allSpans[0]?.startTime || 0}
        durationMs={allSpans.length > 0 ? (maxEndTime - minStartTime) / 1e6 : 0}
        totalSpans={allSpans.length}
        errorSpans={allSpans.filter((s) => s.statusCode === 'ERROR').length}
      />
      <ServiceLegendPanel
        serviceMetaMap={serviceMetaMap}
        onOperationTypeFilter={handleOperationTypeFilter}
      />
      <TimelineHeader startTime={minStartTime} endTime={maxEndTime} setGridWidth={setGridWidth} />
      <div className="trace-detail-body">
        <div className="trace-flamegraph">
          {isLoading ? (
            <div className="trace-detail-loading">
              <Spin size="large" />
              <span className="trace-detail-loading-text">Loading trace data...</span>
            </div>
          ) : hasError ? (
            <div className="trace-detail-error">
              <div className="trace-detail-error-title">Error loading trace</div>
              <div className="trace-detail-error-message">Unable to fetch trace data. Please try again.</div>
            </div>
          ) : filteredTraceData.length === 0 ? (
            <div className="trace-detail-empty">
              <div className="trace-detail-empty-title">No trace data found</div>
              <div className="trace-detail-empty-message">
                {selectedOperationTypes.length > 0
                  ? 'No spans match the selected operation types.'
                  : 'This trace contains no spans or the trace ID is invalid.'
                }
              </div>
            </div>
          ) : gridWidth > 0 ? (
            <FlameGraph
              data={filteredTraceData}
              selectedSpanId={selectedSpanId}
              onSpanSelect={(id) => setSelectedSpanId(id)}
              gridWidth={gridWidth}
              serviceMetaMap={serviceMetaMap}
              eventColorMap={eventColorMap}
              onEventClick={handleEventClick}
            />
          ) : (
            <div className="trace-detail-loading">
              <Spin size="large" />
              <span className="trace-detail-loading-text">Preparing flamegraph...</span>
            </div>
          )}
        </div>
        <div className="trace-sidebar">
          <SelectedSpanDetails
            span={selectedSpan}
            activeTab={activeDetailTab}
            onTabChange={setActiveDetailTab}
            expandedEventKey={expandedEventKey}
            onExpandedEventChange={setExpandedEventKey}
            eventColorMap={eventColorMap}
          />
        </div>
      </div>
    </BaseContainer>
  );
};

export default TraceDetailContainer;