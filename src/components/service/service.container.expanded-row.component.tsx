import React, { useEffect, useState } from 'react';
import { Table } from 'antd';
import { prometheusApi } from '../../providers';
import { buildQuery, QueryKeys } from '../../providers/api/prometheus/prometheus.registry';

interface ServiceExpandedRowProps {
  record: any;
  start?: number | undefined;
  end?: number | undefined;
}

const ServiceExpandedRowComponent: React.FC<ServiceExpandedRowProps> = ({ record, start, end }) => {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);

        const startMs = start;
        const endMs = end;
        const fixedStart = Math.floor(startMs / 1000);
        const fixedEnd = Math.floor(endMs / 1000);
        const maxPoints = 1;
        const step = Math.max(Math.ceil((fixedEnd - fixedStart) / maxPoints), 60);
        // Fetch top operations metrics for this service (example queries)
        const ctx = { serviceName: record.service, windowSeconds: step } as any;
        const [p50Res, p90Res, p99Res, callsRes, errRes] = await Promise.all([
          prometheusApi.runTraceQLQuery(await buildQuery(QueryKeys.p50Latency, ctx)),
          prometheusApi.runTraceQLQuery(await buildQuery(QueryKeys.p90Latency, ctx)),
          prometheusApi.runTraceQLQuery(await buildQuery(QueryKeys.p99Latency, ctx)),
          prometheusApi.runTraceQLQuery(await buildQuery(QueryKeys.totalCalls, ctx)),
          prometheusApi.runTraceQLQuery(await buildQuery(QueryKeys.errorRate, ctx)),
        ]);

        // Shape responses into a per-operation map
        const byOp: Record<string, any> = {};
        const attach = (res: any[], key: string, scale = 1) => {
          res?.forEach((s: any) => {
            const op = s?.metric?.span_name ?? 'unknown';
            const val = parseFloat(s?.value?.[1] ?? '0') * scale;
            byOp[op] = { ...(byOp[op] || { name: op }), [key]: val };
          });
        };
        attach(p50Res, 'p50');
        attach(p90Res, 'p90');
        attach(p99Res, 'p99');
        attach(callsRes, 'calls');
        attach(errRes, 'errorRate', 100); // to percent

        setRows(Object.values(byOp));
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [record?.service, start, end]);

  const columns = [
    { title: 'Span Name', dataIndex: 'name', key: 'name' },
    { title: 'P50 (ms)', dataIndex: 'p50', key: 'p50', render: (v: number) => (v ?? 0).toFixed(2) },
    { title: 'P90 (ms)', dataIndex: 'p90', key: 'p90', render: (v: number) => (v ?? 0).toFixed(2) },
    { title: 'P99 (ms)', dataIndex: 'p99', key: 'p99', render: (v: number) => (v ?? 0).toFixed(2) },
    { title: 'Number of Calls', dataIndex: 'calls', key: 'calls', render: (v: number) => Math.round(v ?? 0) },
    { title: 'Error Rate', dataIndex: 'errorRate', key: 'errorRate', render: (v: number) => `${(v ?? 0).toFixed(2)} %` },
  ];

  return (
    <Table size="small" pagination={false} loading={loading} dataSource={rows} columns={columns} rowKey={(r) => r.name} />
  );
};

export default ServiceExpandedRowComponent;
