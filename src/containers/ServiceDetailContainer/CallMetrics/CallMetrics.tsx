
import React, { useEffect, useState } from 'react';
import { Card, Col, Row, Spin } from 'antd';
import { prometheusApi } from '../../../providers';
import MsCharts from './MsCharts';
interface CallMetricsProps {
  serviceName: string;
  start: number;
  end: number;
}
const CallMetrics: React.FC<CallMetricsProps> = ({ serviceName, start, end }) => {
  const [loading, setLoading] = useState(true);
  const [latencyData, setLatencyData] = useState<any[]>([]);
  const [rateData, setRateData] = useState<any[]>([]);
  const [apdexData, setApdexData] = useState<any[]>([]);
  const [keyOpsData, setKeyOpsData] = useState<any[]>([]);


  const getQueryRange = async (query: string) => {
    const fixedStart = Math.floor(start / 1000);
    const fixedEnd = Math.floor(end / 1000);
    const maxPoints = 10000;
    const step = Math.max(Math.ceil((fixedEnd - fixedStart) / maxPoints), 60);
    return prometheusApi.runTraceQlQueryRange(query, fixedStart, fixedEnd,step+'s');
  };

  const fetchData = async () => {
    setLoading(true);
    try {
     
      const [p50, p90, p99, rate, apdex, keyops] = await Promise.all([
        getQueryRange(
          `histogram_quantile(0.50, sum(rate(traces_spanmetrics_latency_bucket{service="${serviceName}"}[1m])) by (le))`
        ),
        getQueryRange(
          `histogram_quantile(0.90, sum(rate(traces_spanmetrics_latency_bucket{service="${serviceName}"}[1m])) by (le))`
        ),
        getQueryRange(
          `histogram_quantile(0.99, sum(rate(traces_spanmetrics_latency_bucket{service="${serviceName}"}[1m])) by (le))`
        ),
        getQueryRange(`sum(rate(traces_spanmetrics_calls_total{service="${serviceName}"}[1m]))`),
        getQueryRange(`(
          sum(rate(traces_spanmetrics_latency_bucket{le="0.5",service="${serviceName}"}[1m]))
          + sum(rate(traces_spanmetrics_latency_bucket{le="2",service="${serviceName}"}[1m])) / 2
        ) / sum(rate(traces_spanmetrics_latency_count{service="${serviceName}"}[1m]))`),
        getQueryRange(
          `topk(5, sum(rate(traces_spanmetrics_calls_total{service="${serviceName}"}[1m])) by (span_name))`
        ),
      ]);

      const mapMetric = (res: any[], label: string) =>
        res[0]?.values?.map(([ts, val]: [number, string]) => ({
          x: new Date(ts * 1000),
          y: parseFloat(val),
          name: label,
        })) ?? [];

      setLatencyData([
        { name: 'P50', data: mapMetric(p50, 'P50') },
        { name: 'P90', data: mapMetric(p90, 'P90') },
        { name: 'P99', data: mapMetric(p99, 'P99') },
      ]);

      setRateData([{ name: 'Ops/sec', data: mapMetric(rate, 'ops') }]);
      setApdexData([{ name: 'Apdex', data: mapMetric(apdex, 'Apdex') }]);

      // keyOpsData: [{ name: span_name, data: [ { x: time, y: value } ] }]
      const ops = keyops.map((s: any) => ({
        name: s.metric.span_name,
        data: s.values.map(([ts, val]: [number, string]) => ({
          x: new Date(ts * 1000),
          y: parseFloat(val),
        })),
      }));
      setKeyOpsData(ops);
    } catch (err) {
      console.error('Failed to fetch metrics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [serviceName, start, end]);

  if (loading) {
    return <Spin tip="Loading Metrics..." />;
  }

  return (
    <Row gutter={[16, 16]}>
      <Col span={12}>
        <Card title="Latency (ms)" styles={{body: { padding: 0 }}} loading={loading}>
          <MsCharts series={latencyData as any} />
        </Card>
      </Col>

      <Col span={12}>
        <Card title="Operation Rate (ops/s)" loading={loading}>
         <MsCharts colors={["#d5521e"]} series={rateData as any} />
        </Card>
      </Col>

      <Col span={12}>
        <Card title="Apdex Score" loading={loading}>
          <MsCharts colors={["#d5521e"]} series={apdexData as any} />
        </Card>
      </Col>

      <Col span={12}>
        <Card title="Key Operations (ops/sec)" loading={loading}>
          <MsCharts colors={["#d5521e"]} series={keyOpsData as any} />
        </Card>
      </Col>
    </Row>
  );
};

export default CallMetrics;
