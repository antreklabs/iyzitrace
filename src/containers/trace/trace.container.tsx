import React, { useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import BaseContainerComponent, { PageState, getPageState } from '../base.container';
import TraceFilter from './trace.filter';
import TraceExpandedRowComponent from '../../components/trace/trace.container.expanded-row.component';
import TraceMetricsCard from '../../components/trace/trace.container.card.component';
import { TraceItem } from '../../interfaces/pages/trace/trace.response.interface';
// import { TempoRequestModel } from '../../interfaces/tempo/tempo.request.interface';
// import { getIntervalLabel } from '../../utils/extensions.utils';
import { tempoReadApi } from '../../providers/api/tempo/tempo.api.read';
import dayjs from 'dayjs';
// import { dateTime } from '@grafana/data';

const TraceContainer: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const pageName = location.pathname.split('/').filter(Boolean).join('_') || 'home';
  const currentPageState = getPageState(pageName);
  const [statsData, setStatsData] = useState<any[]>([]);

  const fetchModelData = async (pageState?: PageState | null): Promise<TraceItem[]> => {
    const selectedOptions = pageState?.filters?.options;
    const limit = selectedOptions?.limit || 100;
    // const intervalMs = selectedOptions?.interval || 1000;
    // const interval = getIntervalLabel(intervalMs);
    const [rangeStart, rangeEnd] = pageState?.range || [Date.now() - 15 * 60 * 1000, Date.now()];
    const rangeStartSeconds = Math.floor(rangeStart / 1000);
    const rangeEndSeconds = Math.floor(rangeEnd / 1000);

    try {
      const res = await tempoReadApi.search("{}", rangeStartSeconds, rangeEndSeconds, limit);
      console.log('apiResult', res);
      
      // Convert apiResult.traces to TraceItem[]
      if (res && res.traces && Array.isArray(res.traces)) {
        const mapped = res.traces.map((trace: any): TraceItem => {
          const spans = trace.spanSets?.[0]?.spans ?? [];

          const serviceStatsChildren = Object.entries(trace.serviceStats || {}).map(
            ([serviceName, s]: any, i: number) => ({
              key: `${trace.traceID}-stat-${i}`,
              type: 'serviceStats',
              serviceName,
              spanCount: s.spanCount,
              durationMs: s.sumDurationNanos / 1e6,
            })
          );

          const spanChildren = spans.map((span: any, i: number) => ({
            key: `${trace.traceID}-span-${i}`,
            type: 'span',
            spanID: span.spanID,
            name: span.name,
            serviceName: span.serviceName,
            startTime: dayjs(Number(span.startTimeUnixNano) / 1e6).format('YYYY-MM-DD HH:mm:ss.SSS'),
            durationMs: Number(span.durationNanos) / 1e6,
          }));
  
          return ({
            key: trace.traceID,
            traceID: trace.traceID,
            rootServiceName: trace.rootServiceName === '<root span not yet received>' ? '' : trace.rootServiceName,
            rootTraceName: trace.rootTraceName === '-' ? '' : trace.rootTraceName,
            spanCount: trace.spanCount,
            durationMs: trace.durationMs,
            startTimeUnixNano: trace.startTimeUnixNano,
            endTimeUnixNano: trace.startTimeUnixNano + trace.durationMs * 1e6,
            spanSet: trace.spanSet,
            spanSets: trace.spanSets,
            children: [...serviceStatsChildren, ...spanChildren],
          });
        });

        makeStats(mapped);

        return mapped;
      }
      
      return [];
    } catch (e) {
      console.error('[TraceContainer] tempoReadApi.query error:', e);
    }
    
    return [];
  };

  const makeStats = (data: any) => {
    if (!Array.isArray(data) || data.length === 0) {
      setStatsData([]);
      return;
    }

    // Filter out items with invalid durationMs
    const validData = data.filter(item => item && typeof item.durationMs === 'number' && !isNaN(item.durationMs));
    
    if (validData.length === 0) {
      setStatsData([]);
      return;
    }

    const maxLatencyRow = validData.reduce((prev, curr) => (prev.durationMs > curr.durationMs ? prev : curr));
    const minLatencyRow = validData.reduce((prev, curr) => (prev.durationMs < curr.durationMs ? prev : curr));
    const totalLatency = validData.reduce((sum, curr) => sum + (curr.durationMs || 0), 0);
    const totalSpanCount = validData.reduce((sum, curr) => sum + (curr.spanCount || 0), 0);
    const avgLatency = totalLatency / validData.length;

    const statsData = [
      {
        title: 'Max Latency',
        value: (maxLatencyRow?.durationMs || 0).toFixed(2),
        unit: 'ms',
        meta: `${maxLatencyRow?.rootServiceName || 'Unknown'} → ${maxLatencyRow?.rootTraceName || 'Unknown'}`,
        traceID: maxLatencyRow?.traceID,
        serviceName: maxLatencyRow?.rootServiceName,
      },
      {
        title: 'Min Latency',
        value: (minLatencyRow?.durationMs || 0).toFixed(2),
        unit: 'ms',
        meta: `${minLatencyRow?.rootServiceName || 'Unknown'} → ${minLatencyRow?.rootTraceName || 'Unknown'}`,
        traceID: minLatencyRow?.traceID,
        rootServiceName: minLatencyRow?.rootServiceName,
      },
      {
        title: 'Avg Latency',
        value: (avgLatency || 0).toFixed(2),
        unit: 'ms',
      },
      {
        title: 'Total Span Count',
        value: totalSpanCount,
        unit: 'spans',
      },
    ];

    setStatsData(statsData);
  };

  const expandedRowRender = (record: any) => {
    const start = currentPageState?.range?.[0] || (Date.now() - 60 * 60 * 1000); // Default: 1 hour ago
    const end = currentPageState?.range?.[1] || Date.now(); // Default: now
    return <TraceExpandedRowComponent record={record} start={start} end={end} />;
  };

  const columns = [
    {
      title: 'Trace ID',
      dataIndex: 'traceID',
      key: 'traceID',
      width: 200,
      sorter: (a: TraceItem, b: TraceItem) => a.traceID.localeCompare(b.traceID),
      render: (traceID: string) => (
        <span style={{ color: '#1890ff', cursor: 'pointer', fontFamily: 'monospace' }} 
        onClick={() => navigate(`/a/iyzitrace-app/traces/${traceID}`)}>
          {traceID}
        </span>
      ),
    },
    {
      title: 'Root Service',
      dataIndex: 'rootServiceName',
      key: 'rootServiceName',
      width: 180,
      sorter: (a: TraceItem, b: TraceItem) => a.rootServiceName.localeCompare(b.rootServiceName),
      render: (serviceName: string) => (
        <span style={{ color: '#1890ff', cursor: 'pointer' }} onClick={() => navigate(`/a/iyzitrace-app/services/${serviceName}`)}>
          {serviceName}
        </span>
      ),
    },
    {
      title: 'Root Trace Name',
      dataIndex: 'rootTraceName',
      key: 'rootTraceName',
      width: 200,
      sorter: (a: TraceItem, b: TraceItem) => (a.rootTraceName || '').localeCompare(b.rootTraceName || ''),
      render: (traceName: string) => traceName || '-',
    },
    {
      title: 'Duration',
      dataIndex: 'durationMs',
      key: 'durationMs',
      width: 120,
      sorter: (a: TraceItem, b: TraceItem) => (a.durationMs ?? 0) - (b.durationMs ?? 0),
      render: (duration: number) => `${duration ?? 0} ms`,
    },
    {
      title: 'Start Time',
      dataIndex: 'startTimeUnixNano',
      key: 'startTimeUnixNano',
      width: 180,
      sorter: (a: TraceItem, b: TraceItem) => a.startTimeUnixNano.localeCompare(b.startTimeUnixNano),
      render: (startTime: string) => {
        const date = new Date(parseInt(startTime) / 1000000); // Convert nanoseconds to milliseconds
        return date.toLocaleString();
      },
    },
    {
      title: 'End Time',
      dataIndex: 'endTimeUnixNano',
      key: 'endTimeUnixNano',
      width: 180,
      sorter: (a: TraceItem, b: TraceItem) => a.endTimeUnixNano.localeCompare(b.endTimeUnixNano),
      render: (endTime: string) => {
        const date = new Date(parseInt(endTime) / 1000000); // Convert nanoseconds to milliseconds
        return date.toLocaleString();
      },
    },
    {
      title: 'Span Count',
      dataIndex: 'spanCount',
      key: 'spanCount',
      width: 100,
      sorter: (a: TraceItem, b: TraceItem) => (a.spanCount ?? 0) - (b.spanCount ?? 0),
      render: (spanCount: number) => spanCount ?? 0,
    },
    {
      title: 'Children',
      dataIndex: 'children',
      key: 'children',
      width: 100,
      sorter: (a: TraceItem, b: TraceItem) => (a.children?.length ?? 0) - (b.children?.length ?? 0),
      render: (children: any[]) => children?.length ?? 0,
    },
  ];

  const scrollerRef = useRef<HTMLDivElement | null>(null);

  const scrollBy = (delta: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: delta, behavior: 'smooth' });
  };

  return (
    <BaseContainerComponent
      title="Traces"
      initialFilterCollapsed={false}
      onFetchData={fetchModelData}
      onExpandedRowRender={expandedRowRender}
      showExpandableRowRender={false}
      columns={columns}
      filterComponent={<TraceFilter onChange={fetchModelData} collapsed={false} columns={columns} />}
      datasourceType="tempo">
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => scrollBy(-400)}
            style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', zIndex: 1, background: '#1f1f1f', border: '1px solid #303030', color: '#d9d9d9', borderRadius: 6, padding: '4px 8px' }}
          >
            ◀
          </button>
          <div
            ref={scrollerRef}
            style={{ overflowX: 'auto', overflowY: 'hidden', whiteSpace: 'nowrap', padding: '0 36px' }}
          >
            <div style={{ display: 'inline-flex', gap: 16 }}>
              {statsData.map((stat) => (
                <div key={stat.title}>
                  <TraceMetricsCard title={stat.title} value={stat.value} unit={stat.unit} meta={stat.meta} traceID={stat.traceID} serviceName={stat.serviceName} />
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={() => scrollBy(400)}
            style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', zIndex: 1, background: '#1f1f1f', border: '1px solid #303030', color: '#d9d9d9', borderRadius: 6, padding: '4px 8px' }}
          >
            ▶
          </button>
        </div>
    </BaseContainerComponent>
  );
};

export default TraceContainer;