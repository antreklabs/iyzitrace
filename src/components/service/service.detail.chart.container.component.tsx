
import React, { useEffect, useState } from 'react';
import { Card, Col, Row, Spin } from 'antd';
import MsCharts from './service.detail.chart.component';
import { Service } from '../../api/service/interface.service';
import '../../assets/styles/components/service/service.styles';

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
      <div className="service-summary-loading">
        <Spin size="large" />
        <span className="service-summary-loading-text">Loading Metrics...</span>
      </div>
    );
  }

  return (
    <Row gutter={[16, 16]}>

      <Col span={12}>
        <Card
          title={<span className="service-chart-title-text">Latency</span>}
          loading={loading}
          className="service-detail-chart-card-blue"
          styles={{ body: { height: '330px', padding: '20px' } }}
        >
          {chartsReady && <MsCharts chartId="latency-chart" series={serviceBased ? latencyData : latencyDataByOperation as any} />}
        </Card>
      </Col>

      <Col span={12}>
        <Card
          title={<span className="service-chart-title-text">Operation Rate</span>}
          loading={loading}
          className="service-detail-chart-card-green"
          styles={{ body: { height: '330px', padding: '20px' } }}
        >
          {chartsReady && <MsCharts chartId="rate-chart" series={rateDataByOperation as any} />}
        </Card>
      </Col>

      <Col span={12}>
        <Card
          title={<span className="service-chart-title-text">Apdex Score</span>}
          loading={loading}
          className="service-detail-chart-card-amber"
          styles={{ body: { height: '330px', padding: '20px' } }}
        >
          {chartsReady && <MsCharts chartId="apdex-chart" series={serviceBased ? apdexData : apdexDataByOperation as any} />}
        </Card>
      </Col>

      <Col span={12}>
        <Card
          title={<span className="service-chart-title-text">Key Operations</span>}
          loading={loading}
          className="service-detail-chart-card-purple"
          styles={{ body: { height: '330px', padding: '20px' } }}
        >
          {chartsReady && <MsCharts chartId="keyops-chart" series={keyOpsDataByOperation as any} />}
        </Card>
      </Col>
    </Row>
  );
};

export default CallMetrics;