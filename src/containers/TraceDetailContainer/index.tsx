import React, { JSX, useEffect, useMemo, useState } from 'react';
import './TraceDetailContainer.css';
import TraceMetaHeader from './TraceMetaHeader/TraceMetaHeader';
import TimelineHeader from './TimelineHeader/TimelineHeader';
import FlameGraph from './FlameGraph/FlameGraph';
import SelectedSpanDetails from './SelectedSpanDetails/SelectedSpanDetails';
import { TempoApi } from '../../providers';
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
  const [filteredTraceData, setFilteredTraceData] = useState<SpanNode[]>([]);
  const [selectedSpanId, setSelectedSpanId] = useState<string | null>(null);
  const [gridWidth, setGridWidth] = useState(0);
  const [selectedOperationTypes, setSelectedOperationTypes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const { selectedUid } = useAppSelector((state) => state.datasource);

  const flattenSpans = (nodes: SpanNode[]): SpanNode[] =>
    nodes.flatMap((n) => [n, ...(n.children ? flattenSpans(n.children) : [])]);

  const getOperationType = (s: any): string => {
    let type = s.tags['type'];
    
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
      if (Object.keys(s.tags).includes('http.method') || name.includes('http')) {
        return 'HTTP';
      }
      if (
        ['postgre', 'postgresql', 'mysql', 'mariadb', 'mongo', 'mongodb', 'db', 'database'].some((db) =>
          name.includes(db)
        )
      ) {
        return 'DATABASE';
      }
      const netPeerName = s.tags['net.peer.name'];
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
    // console.log('span', s);

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
          // console.log('No trace data received');
          setTraceData([]);
          setFilteredTraceData([]);
          setIsLoading(false);
          return;
        }

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

        if (spans.length === 0) {
          // console.log('No spans found in trace data');
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
        console.error('Error fetching trace:', error);
        setHasError(true);
        setIsLoading(false);
        setTraceData([]);
        setFilteredTraceData([]);
      }
    };

    fetchTrace();
  }, [traceId, selectedUid]);

  // Filter trace data based on selected operation types
  useEffect(() => {
    // console.log('Filtering effect triggered. Selected types:', selectedOperationTypes);
    // console.log('Original trace data length:', traceData.length);
    
    if (selectedOperationTypes.length === 0) {
      // console.log('No filters selected, showing all spans');
      setFilteredTraceData(traceData);
      return;
    }

    const filterSpans = (nodes: SpanNode[]): SpanNode[] => {
      return nodes.filter(node => {
        const operationType = getOperationType(node);
        const matchesFilter = selectedOperationTypes.includes(operationType);
        
        // console.log(`Span ${node.serviceName} -> ${node.name}: operationType=${operationType}, matches=${matchesFilter}`);
        
        // If this node matches, include it and all its children
        if (matchesFilter) {
          return true;
        }
        
        // If this node doesn't match but has children that might match, check children
        if (node.children && node.children.length > 0) {
          const filteredChildren = filterSpans(node.children);
          if (filteredChildren.length > 0) {
            // Update the node with filtered children
            node.children = filteredChildren;
            return true;
          }
        }
        
        return false;
      });
    };

    const filtered = filterSpans(traceData);
    // console.log('Filtered trace data length:', filtered.length);
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

    // console.log('serviceMetaMap', map);
    return map;
  }, [allSpans]);

  const handleOperationTypeFilter = (selectedTypes: string[]) => {
    // console.log('Filtering by operation types:', selectedTypes);
    setSelectedOperationTypes(selectedTypes);
  };

  return (
    <BaseContainer title="Trace Detail" pageName="trace-detail">
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
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
              <Spin size="large" />
              <span style={{ marginLeft: '8px' }}>Loading trace data...</span>
            </div>
          ) : hasError ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px', flexDirection: 'column' }}>
              <div style={{ color: '#ff4d4f', fontSize: '16px', marginBottom: '8px' }}>Error loading trace</div>
              <div style={{ color: '#8c8c8c', fontSize: '14px' }}>Unable to fetch trace data. Please try again.</div>
            </div>
          ) : filteredTraceData.length === 0 ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px', flexDirection: 'column' }}>
              <div style={{ color: '#8c8c8c', fontSize: '16px', marginBottom: '8px' }}>No trace data found</div>
              <div style={{ color: '#666', fontSize: '14px' }}>
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
            />
          ) : (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
              <Spin size="large" />
              <span style={{ marginLeft: '8px' }}>Preparing flamegraph...</span>
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
