import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BaseContainerComponent, { FetchedModel } from '../base.container';
import TraceFilter from './trace.filter';
import TraceMetricsCard from '../../components/trace/trace.container.card.component';
import { TraceItem } from '../../interfaces/pages/trace/trace.response.interface';
import { tempoReadApi } from '../../providers/api/tempo/tempo.api.read';
import dayjs from 'dayjs';
import { TableColumn } from '../../api/service/table.services';
import { FilterParamsModel } from '../../api/service/query.service';

const TraceContainer: React.FC = () => {
  const navigate = useNavigate();
  const [statsData, setStatsData] = useState<any[]>([]);

  const fetchModelData = async (filterModel: FilterParamsModel): Promise<FetchedModel> => {
    try {
      const res = await tempoReadApi.search("{}", 0, 0, 100);
      // console.log('apiResult', res);
      
      // Convert apiResult.traces to TraceItem[]
      if (res && res.traces && Array.isArray(res.traces)) {
        const mapped = res.traces.map((trace: any): TraceItem => {
          const spans = trace.spanSets?.[0]?.spans ?? [];

          // Fallback: Tempo bazı sürümlerde serviceStats dönmeyebilir.
          // Bu durumda span'lerden service bazlı istatistik üretelim.
          let serviceStatsChildren: any[] = [];
          if (trace.serviceStats && typeof trace.serviceStats === 'object') {
            serviceStatsChildren = Object.entries(trace.serviceStats).map(
              ([serviceName, s]: any, i: number) => ({
                key: `${trace.traceID}-stat-${i}`,
                type: 'serviceStats',
                serviceName,
                spanCount: s.spanCount,
                durationMs: s.sumDurationNanos / 1e6,
              })
            );
          } else if (Array.isArray(spans) && spans.length > 0) {
            const byService = new Map<string, { spanCount: number; sumDurationNanos: number }>();
            for (const span of spans) {
              const serviceName = span.serviceName || 'unknown';
              const durationNanos = Number(span.durationNanos) || 0;
              const current = byService.get(serviceName) || { spanCount: 0, sumDurationNanos: 0 };
              current.spanCount += 1;
              current.sumDurationNanos += durationNanos;
              byService.set(serviceName, current);
            }
            serviceStatsChildren = Array.from(byService.entries()).map(([serviceName, s], i) => ({
              key: `${trace.traceID}-stat-${i}`,
              type: 'serviceStats',
              serviceName,
              spanCount: s.spanCount,
              durationMs: s.sumDurationNanos / 1e6,
            }));
          }

          const spanChildren = spans.map((span: any, i: number) => ({
            key: `${trace.traceID}-span-${i}`,
            type: 'span',
            spanID: span.spanID,
            name: span.name,
            serviceName: span.serviceName,
            startTime: dayjs(Number(span.startTimeUnixNano) / 1e6).format('YYYY-MM-DD HH:mm:ss.SSS'),
            durationMs: Number(span.durationNanos) / 1e6,
          }));

          // Min start and max end across spans
          const startTimeUnixNano = spans.reduce((min: number, curr: any) => {
            const v = Number(curr.startTimeUnixNano);
            return Number.isFinite(v) && v > 0 ? Math.min(min, v) : min;
          }, Number.POSITIVE_INFINITY);

          const endTimeUnixNano = spans.reduce((max: number, curr: any) => {
            const start = Number(curr.startTimeUnixNano) || 0;
            const end = Number(curr.endTimeUnixNano ?? (start + (Number(curr.durationNanos) || 0)));
            return Number.isFinite(end) && end > 0 ? Math.max(max, end) : max;
          }, 0);

          const durationNanos =
            startTimeUnixNano !== Number.POSITIVE_INFINITY && endTimeUnixNano > 0
              ? endTimeUnixNano - startTimeUnixNano
              : 0;

          return ({
            key: trace.traceID,
            traceID: trace.traceID,
            rootServiceName: trace.rootServiceName === '<root span not yet received>' ? '' : trace.rootServiceName,
            rootTraceName: trace.rootTraceName === '-' ? '' : trace.rootTraceName,
            spanCount: spanChildren.length,
            durationMs: Number(durationNanos) / 1e6,
            startTimeUnixNano: startTimeUnixNano,
            endTimeUnixNano: endTimeUnixNano,
            spanSet: trace.spanSet,
            spanSets: trace.spanSets,
            children: [...serviceStatsChildren, ...spanChildren],
          });
        });

        makeStats(mapped);

        return { data: mapped, columns: columns };
      }
      
      return { data: [], columns: { RootColumns: [] } };
    } catch (e) {
      console.error('[TraceContainer] tempoReadApi.query error:', e);
    }
    
    return { data: [], columns: { RootColumns: [] } };
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

    // Generate chart data for each metric (ordered by startTime)
    const ordered = validData
      .slice()
      .sort((a, b) => Number(a.startTimeUnixNano) - Number(b.startTimeUnixNano));
    
    // Group data into max 50 buckets by time
    const groupSize = Math.max(1, Math.ceil(ordered.length / 50));
    const grouped = [];
    for (let i = 0; i < ordered.length; i += groupSize) {
      const group = ordered.slice(i, i + groupSize);
      grouped.push(group);
    }
    
    // Aggregate span count data (sum)
    const spanCountChartData = grouped.map(group => 
      group.reduce((sum, item) => sum + (item.spanCount || 0), 0)
    );
    
    // Aggregate latency data (min, max, avg)
    const latencyMinChartData = grouped.map(group => 
      Math.min(...group.map(item => item.durationMs || 0))
    );
    const latencyMaxChartData = grouped.map(group => 
      Math.max(...group.map(item => item.durationMs || 0))
    );
    const latencyAvgChartData = grouped.map(group => {
      const sum = group.reduce((sum, item) => sum + (item.durationMs || 0), 0);
      return sum / group.length;
    });

    const statsData = [
      {
        title: 'Max Latency',
        value: (maxLatencyRow?.durationMs || 0).toFixed(2),
        unit: 'ms',
        meta: `${maxLatencyRow?.rootServiceName || 'Unknown'} → ${maxLatencyRow?.rootTraceName || 'Unknown'}`,
        traceID: maxLatencyRow?.traceID,
        serviceName: maxLatencyRow?.rootServiceName,
        chartData: latencyMaxChartData,
      },
      {
        title: 'Min Latency',
        value: (minLatencyRow?.durationMs || 0).toFixed(2),
        unit: 'ms',
        meta: `${minLatencyRow?.rootServiceName || 'Unknown'} → ${minLatencyRow?.rootTraceName || 'Unknown'}`,
        traceID: minLatencyRow?.traceID,
        rootServiceName: minLatencyRow?.rootServiceName,
        chartData: latencyMinChartData,
      },
      {
        title: 'Avg Latency',
        value: (avgLatency || 0).toFixed(2),
        unit: 'ms',
        chartData: latencyAvgChartData,
      },
      {
        title: 'Total Span Count',
        value: totalSpanCount,
        unit: 'spans',
        chartData: spanCountChartData,
      },
    ];

    setStatsData(statsData);
  };

  const columns: TableColumn = {
    RootColumns: [
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
      title: 'Service',
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
      title: 'Duration',
      dataIndex: 'durationMs',
      key: 'durationMs',
      width: 120,
      sorter: (a: TraceItem, b: TraceItem) => (a.durationMs ?? 0) - (b.durationMs ?? 0),
      render: (duration: number) => (
        <span style={{ textAlign: 'right', display: 'block' }}>
          {(duration ?? 0).toFixed(2)} ms
        </span>
      ),
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
    }
  ],
};

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
      filterComponent={<TraceFilter onChange={fetchModelData} columns={columns.RootColumns} />}
    >
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
                  <TraceMetricsCard title={stat.title} value={stat.value} unit={stat.unit} meta={stat.meta} traceID={stat.traceID} serviceName={stat.serviceName} chartData={stat.chartData} />
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