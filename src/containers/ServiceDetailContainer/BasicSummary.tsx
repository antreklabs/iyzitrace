import React, { useEffect, useState } from 'react';
import { Card, Col, Flex, Row, Spin, Typography } from 'antd';
import { prometheusApi } from '../../providers';
import { buildQuery } from '../../providers/api/prometheus/prometheus.registry';
// import {randomBackgroundGradient } from '../../utils';

interface BasicSummaryProps {
  serviceName: string;
  start: number;
  end: number;
}
const { Text } = Typography;
const BasicSummary: React.FC<BasicSummaryProps> = ({ serviceName, start, end }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    operationCount: 0,
    totalCalls: 0,
    totalCallsSpan: '',
    operationCountSpan: '',
    maxLatencySpan: '',
    maxLatency: 0,
    minLatencySpan: '',
    minLatency: 0,
    totalMin: 0,
  });
  // const cardStyle = () => {
  //   return {
  //     background:  randomBackgroundGradient(),
  //     color: '#fff',
  //     borderRadius: 10,
  //     padding: '16px',
  //     height: '100%',
  //     display: 'flex',
  //     flexDirection: 'column' as const,
  //     justifyContent: 'center',
  //     alignItems: 'center',
  //     boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
  //   };
  // };
  const getMetrics = async () => {
    setLoading(true);

    const ctx = { serviceName, windowSeconds: end - start };
    const operationCountQuery = await buildQuery('operationCount', ctx);
    const totalCallsQuery = await buildQuery('totalCalls', ctx);
    const maxLatencySpanQuery = await buildQuery('maxLatencySpan', ctx);
    const minLatencySpanQuery = await buildQuery('minLatencySpan', ctx);

    try {
      const [operationCountRes, totalCallsRes, maxSpanRes, minSpanRes] = await Promise.all([
        prometheusApi.runTraceQLQuery(operationCountQuery),
        prometheusApi.runTraceQLQuery(totalCallsQuery),
        prometheusApi.runTraceQLQuery(maxLatencySpanQuery),
        prometheusApi.runTraceQLQuery(minLatencySpanQuery),
      ]);

      const operationCount = parseInt(operationCountRes[0]?.value?.[1] || '0', 10);
      const totalCalls = parseInt(totalCallsRes[0]?.value?.[1] || '0', 10);
      const maxLatencySpan = maxSpanRes[0]?.metric?.span_name || 'N/A';
      const minLatencySpan = minSpanRes[0]?.metric?.span_name || 'N/A';
      const maxLatency = parseFloat(maxSpanRes[0]?.value?.[1] || '0');
      const minLatency = parseFloat(minSpanRes[0]?.value?.[1] || '0');
      const totalMin = ((start - end)/60)/1000;
      const totalCallsSpan = totalCallsRes[0]?.metric?.span_name || 'N/A';
      const operationCountSpan = operationCountRes[0]?.metric?.span_name || 'N/A';
      
      setData({
        operationCount,
        totalCalls,
        totalCallsSpan,
        operationCountSpan,
        maxLatencySpan,
        minLatencySpan,
        maxLatency,
        minLatency,
        totalMin:Math.floor(totalMin),
      });
    } catch (err) {
      console.error('Metric fetch error', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getMetrics();
  }, [serviceName, start, end]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
        <Spin size="large" />
        <span style={{ marginLeft: '8px' }}>Loading metrics...</span>
      </div>
    );
  }

  return (
    <Row gutter={[16, 16]}>
      <Col span={6}>
        <Card
          hoverable
          size="small"
          style={{
            backgroundColor: '#1f1f1f',
            border: '1px solid #303030',
            borderRadius: '8px',
            color: '#d9d9d9'
          }}
          styles={{ body: { padding: '16px' } }}
        >
          {loading ? (
            <Flex justify="center"><Spin size="small" /></Flex>
          ) : (
            <Flex vertical gap={8}>
              <Text style={{ color: '#8c8c8c', fontSize: '12px', fontWeight: 500 }}>
                Operation Count in {data.totalMin * -1}m
              </Text>
              <Text style={{ color: '#52c41a', fontSize: '28px', fontWeight: 'bold', lineHeight: 1 }}>
                {data.operationCount}
              </Text>
              <Text style={{ color: '#8c8c8c', fontSize: '14px' }}>
                {data.operationCountSpan}
              </Text>
            </Flex>
          )}
        </Card>
      </Col>
      <Col span={6}>
        <Card
          hoverable
          size="small"
          style={{
            backgroundColor: '#1f1f1f',
            border: '1px solid #303030',
            borderRadius: '8px',
            color: '#d9d9d9'
          }}
          styles={{ body: { padding: '16px' } }}
        >
          {loading ? (
            <Flex justify="center"><Spin size="small" /></Flex>
          ) : (
            <Flex vertical gap={8}>
              <Text style={{ color: '#8c8c8c', fontSize: '12px', fontWeight: 500 }}>
                Total Call Count in {data.totalMin * -1}m
              </Text>
              <Text style={{ color: '#52c41a', fontSize: '28px', fontWeight: 'bold', lineHeight: 1 }}>
                {data.totalCalls}
              </Text>
              <Text style={{ color: '#8c8c8c', fontSize: '14px' }}>
                {data.totalCallsSpan}
              </Text>
            </Flex>
          )}
        </Card>
      </Col>
      <Col span={6}>
        <Card
          hoverable
          size="small"
          style={{
            backgroundColor: '#1f1f1f',
            border: '1px solid #303030',
            borderRadius: '8px',
            color: '#d9d9d9'
          }}
          styles={{ body: { padding: '16px' } }}
        >
          {loading ? (
            <Flex justify="center"><Spin size="small" /></Flex>
          ) : (
            <Flex vertical gap={8}>
              <Text style={{ color: '#8c8c8c', fontSize: '12px', fontWeight: 500 }}>
                Max Latency Span in {data.totalMin * -1}m
              </Text>
              <Text style={{ color: '#52c41a', fontSize: '28px', fontWeight: 'bold', lineHeight: 1 }}>
                {data.maxLatency.toFixed(2)} ms
              </Text>
              <Text style={{ color: '#8c8c8c', fontSize: '14px' }}>
                {data.maxLatencySpan}
              </Text>
            </Flex>
          )}
        </Card>
      </Col>
      <Col span={6}>
        <Card
          hoverable
          size="small"
          style={{
            backgroundColor: '#1f1f1f',
            border: '1px solid #303030',
            borderRadius: '8px',
            color: '#d9d9d9'
          }}
          styles={{ body: { padding: '16px' } }}
        >
          {loading ? (
            <Flex justify="center"><Spin size="small" /></Flex>
          ) : (
            <Flex vertical gap={8}>
              <Text style={{ color: '#8c8c8c', fontSize: '12px', fontWeight: 500 }}>
                Min Latency Span in {data.totalMin * -1}m
              </Text>
              <Text style={{ color: '#52c41a', fontSize: '28px', fontWeight: 'bold', lineHeight: 1 }}>
                {data.minLatency.toFixed(2)} ms
              </Text>
              <Text style={{ color: '#8c8c8c', fontSize: '14px' }}>
                {data.minLatencySpan}
              </Text>
            </Flex>
          )}
        </Card>
      </Col>
    </Row>
  );
};

export default BasicSummary;
