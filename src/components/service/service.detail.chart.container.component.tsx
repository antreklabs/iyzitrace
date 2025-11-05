
import React, { useEffect, useState } from 'react';
import { Card, Col, Row, Spin } from 'antd';
import MsCharts from './service.detail.chart.component';
import { Service } from '../../api/service/interface.service';

interface CallMetricsProps {
  data?: Service[];
  serviceBased: boolean;
}
const CallMetrics: React.FC<CallMetricsProps> = ({ data, serviceBased }) => {
  const [loading, setLoading] = useState(true);
  const [chartsReady, setChartsReady] = useState(false);
  const [latencyData, setLatencyData] = useState<any[]>([]);
  const [apdexData, setApdexData] = useState<any[]>([]);
  const [rateDataByOperation, setRateDataByOperation] = useState<any[]>([]);
  const [keyOpsDataByOperation, setKeyOpsDataByOperation] = useState<any[]>([]);
  const [latencyDataByOperation, setLatencyDataByOperation] = useState<any[]>([]);
  const [apdexDataByOperation, setApdexDataByOperation] = useState<any[]>([]);


  const fetchData = async () => {
    setLoading(true);
    try {
      setLatencyData(data[0].rangeMetrics?.latency ?? []);
      setApdexData(data[0].rangeMetrics?.apdex ?? []);
      setRateDataByOperation(data[0].rangeMetrics?.rateByOperation ?? []);
      setKeyOpsDataByOperation(data[0].rangeMetrics?.keyopsByOperation ?? []);
      setLatencyDataByOperation(data[0].rangeMetrics?.latencyByOperation ?? []);
      setApdexDataByOperation(data[0].rangeMetrics?.apdexByOperation ?? []);
    } catch (err) {
      console.error('Failed to fetch metrics', err);
    } finally {
      setLoading(false);
      setTimeout(() => {
        setChartsReady(true);
      }, 100);
    }
  };

  useEffect(() => {
    fetchData();
  }, [data, serviceBased]);

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
          {chartsReady && <MsCharts chartId="latency-chart" series={serviceBased ? latencyData : latencyDataByOperation as any} />}
        </Card>
      </Col>

      <Col span={12}>
        <Card 
          title="Operation Rate (ops/s)" 
          loading={loading}
          style={{ height: '350px' }}
          styles={{ body: { height: '300px', padding: '16px' } }}
        >
          {chartsReady && <MsCharts chartId="rate-chart" series={rateDataByOperation as any} />}
        </Card>
      </Col>

      <Col span={12}>
        <Card 
          title="Apdex Score" 
          loading={loading}
          style={{ height: '350px' }}
          styles={{ body: { height: '300px', padding: '16px' } }}
        >
          {chartsReady && <MsCharts chartId="apdex-chart" series={serviceBased ? apdexData : apdexDataByOperation as any} />}
        </Card>
      </Col>

      <Col span={12}>
        <Card 
          title="Key Operations (ops/sec)" 
          loading={loading}
          style={{ height: '350px' }}
          styles={{ body: { height: '300px', padding: '16px' } }}
        >
          {chartsReady && <MsCharts chartId="keyops-chart" series={keyOpsDataByOperation as any} />}
        </Card>
      </Col>
    </Row>
  );
};

export default CallMetrics;
