
import React, { useEffect, useState } from 'react';
import { Card, Col, Row, Spin } from 'antd';
import { prometheusApi } from '../../../providers';
import { buildQuery, QueryKeys } from '../../../providers/api/prometheus/prometheus.registry';
import OperationsMsCharts from './OperationsMsCharts';

interface OperationsProps {
  serviceName: string;
  start: number;
  end: number;
}
const Operations: React.FC<OperationsProps> = ({ serviceName, start, end }) => {
  const [loading, setLoading] = useState(true);
  const [latencyData, setLatencyData] = useState<any[]>([]);
  const [rateData, setRateData] = useState<any[]>([]);
  const [apdexData, setApdexData] = useState<any[]>([]);
  const [keyOpsData, setKeyOpsData] = useState<any[]>([]);
  const [chartsReady, setChartsReady] = useState(false);


  const getQueryRange = async (query: string) => {
    const fixedStart = Math.floor(start / 1000);
    const fixedEnd = Math.floor(end / 1000);
    const maxPoints = 1;
    const step = Math.max(Math.ceil((fixedEnd - fixedStart) / maxPoints), 60);
    return prometheusApi.runTraceQlQueryRange(query, fixedStart, fixedEnd, step + 's');
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const ctx = { serviceName, windowSeconds: Math.floor((end - start) / 1000) };
      const [p50, p90, p99, rate, apdex, keyops] = await Promise.all([
        getQueryRange(await buildQuery(QueryKeys.p50Latency, ctx)),
        getQueryRange(await buildQuery(QueryKeys.p90Latency, ctx)),
        getQueryRange(await buildQuery(QueryKeys.p99Latency, ctx)),
        getQueryRange(await buildQuery(QueryKeys.callsPerSecond, ctx)),
        getQueryRange(await buildQuery(QueryKeys.apdexBySpan, ctx)),
        getQueryRange(await buildQuery(QueryKeys.topKeyOperations, ctx)),
      ]);

      const mapMetricByOperation = (res: any[], metricType: string) => {
        return res.map((series: any) => ({
          name: `${series.metric.span_name || 'unknown'} - ${metricType}`,
          data: series.values?.map(([ts, val]: [number, string]) => ({
            x: new Date(ts * 1000),
            y: parseFloat(val),
          })) ?? [],
        }));
      };

      // Her operasyon için ayrı P50, P90, P99 metrikleri
      setLatencyData([
        ...mapMetricByOperation(p50, 'P50'),
        ...mapMetricByOperation(p90, 'P90'),
        ...mapMetricByOperation(p99, 'P99'),
      ]);

      // Her operasyon için ayrı rate metrikleri
      setRateData(mapMetricByOperation(rate, 'Ops/sec'));

      // Her operasyon için ayrı apdex metrikleri
      setApdexData(mapMetricByOperation(apdex, 'Apdex'));

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
      
      // Delay chart rendering to ensure proper container sizing
      setTimeout(() => {
        setChartsReady(true);
      }, 100);
    }
  };

  useEffect(() => {
    fetchData();
  }, [serviceName, start, end]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
        <Spin size="large" />
        <span style={{ marginLeft: '8px' }}>Loading Metrics...</span>
      </div>
    );
  }

  return (
    <Row gutter={[16, 16]}>
      <Col span={12}>
        <Card 
          title="Latency (ms)" 
          loading={loading}
          style={{ height: '350px' }}
          styles={{ body: { height: '300px', padding: '16px' } }}
        >
          {chartsReady && <OperationsMsCharts chartId="latency-chart" series={latencyData as any} />}
        </Card>
      </Col>

      <Col span={12}>
        <Card 
          title="Operation Rate (ops/s)" 
          loading={loading}
          style={{ height: '350px' }}
          styles={{ body: { height: '300px', padding: '16px' } }}
        >
          {chartsReady && <OperationsMsCharts chartId="rate-chart" series={rateData as any} />}
        </Card>
      </Col>

      <Col span={12}>
        <Card 
          title="Apdex Score" 
          loading={loading}
          style={{ height: '350px' }}
          styles={{ body: { height: '300px', padding: '16px' } }}
        >
          {chartsReady && <OperationsMsCharts chartId="apdex-chart" series={apdexData as any} />}
        </Card>
      </Col>

      <Col span={12}>
        <Card 
          title="Key Operations (ops/sec)" 
          loading={loading}
          style={{ height: '350px' }}
          styles={{ body: { height: '300px', padding: '16px' } }}
        >
          {chartsReady && <OperationsMsCharts chartId="keyops-chart" series={keyOpsData as any} />}
        </Card>
      </Col>
    </Row>
  );
};

export default Operations;
