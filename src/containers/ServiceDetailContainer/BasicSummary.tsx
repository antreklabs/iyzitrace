import React, { useEffect, useState } from 'react';
import { Card, Col, Flex, Row, Spin, Typography } from 'antd';
import { prometheusApi } from '../../providers';
import {randomBackgroundGradient } from '../../utils';
import { PiSteps } from "react-icons/pi";

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
    maxLatencySpan: '',
    maxLatency: 0,
    minLatencySpan: '',
    minLatency: 0,
    totalMin: 0,
  });
  const makeServiceName = (name: string) => {
    const parts = name.split('-');
    if (parts.length > 1) {
      return parts.slice(0, -1).join(' -').toUpperCase() + ' ' + parts[parts.length - 1].toUpperCase();
    }
    return name.toUpperCase();
  };
  const cardStyle = () => {
    return {
      background:  randomBackgroundGradient(),
      color: '#fff',
      borderRadius: 10,
      padding: '16px',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
    };
  };
  const getMetrics = async () => {
    setLoading(true);

    const queries = {
      operationCount: `count(count by (span_name) (rate(traces_spanmetrics_calls_total{service="${serviceName}"}[${
        end - start
      }s])))`,
      totalCalls: `sum(increase(traces_spanmetrics_calls_total{service="${serviceName}"}[${end - start}s]))`,
      maxLatencySpan: `topk(1, sum_over_time(traces_spanmetrics_latency_sum{service="${serviceName}"}[${end - start}s]) 
  / sum_over_time(traces_spanmetrics_latency_count{service="${serviceName}"}[${end - start}s]) 
) by (span_name)
`,
      minLatencySpan: `bottomk(1, sum_over_time(traces_spanmetrics_latency_sum{service="${serviceName}"}[${end - start}s]) 
  / sum_over_time(traces_spanmetrics_latency_count{service="${serviceName}"}[${end - start}s]) 
) by (span_name)
`,
    };

    try {
      const [operationCountRes, totalCallsRes, maxSpanRes, minSpanRes] = await Promise.all([
        prometheusApi.runTraceQLQuery(queries.operationCount),
        prometheusApi.runTraceQLQuery(queries.totalCalls),
        prometheusApi.runTraceQLQuery(queries.maxLatencySpan),
        prometheusApi.runTraceQLQuery(queries.minLatencySpan),
      ]);

      console.log('Operation Count:', operationCountRes);
      const operationCount = parseInt(operationCountRes[0]?.value?.[1] || '0', 10);
      const totalCalls = parseInt(totalCallsRes[0]?.value?.[1] || '0', 10);
      const maxLatencySpan = maxSpanRes[0]?.metric?.span_name || 'N/A';
      const minLatencySpan = minSpanRes[0]?.metric?.span_name || 'N/A';
      const maxLatency = parseFloat(maxSpanRes[0]?.value?.[1] || '0');
      const minLatency = parseFloat(minSpanRes[0]?.value?.[1] || '0');
      const totalMin = ((start - end)/60)/1000;

      setData({
        operationCount,
        totalCalls,
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
    return <Spin tip="Loading metrics..." />;
  }

  return (
    <Row gutter={[16, 16]}>
      <Col span={6}>
        <Card
          hoverable
          title={
            <Flex gap={8}>
              <Text strong style={{fontSize:20}}>Operation Count in {data.totalMin}m</Text>
            </Flex>
          }
          size="small"
          style={cardStyle()}
        >
          {loading ? (
            <Spin size="small" />
          ) : (
            <Flex vertical>
              <Text style={{fontSize:30,fontWeight:"bolder"}}>{data.operationCount}</Text>
              
            </Flex>
          )}
        </Card>
      </Col>
      <Col span={6}>
      <Card
          hoverable
          title={
            <Flex gap={8}>
              <Text strong style={{fontSize:20}}>Total Call Count in {data.totalMin}m</Text>
            </Flex>
          }
          size="small"
          style={cardStyle()}
        >
          {loading ? (
            <Spin size="small" />
          ) : (
            <Flex vertical>
              <Text style={{fontSize:30,fontWeight:"bolder"}}>{data.totalCalls}</Text>
              
            </Flex>
          )}
        </Card>
      </Col>
      <Col span={6}>
      <Card
          hoverable
          title={
            <Flex gap={8}>
              <Text strong style={{fontSize:20}}>Max Latencied Span in {data.totalMin}m</Text>
            </Flex>
          }
          size="small"
          style={cardStyle()}
        >
          {loading ? (
            <Spin size="small" />
          ) : (
            <Flex vertical>
              <Text style={{fontSize:30,fontWeight:"bolder"}}>{data.maxLatencySpan} / {data.maxLatency.toFixed(2)}</Text>
              
            </Flex>
          )}
        </Card>
      </Col>
      <Col span={6}>
      <Card
          hoverable
          title={
            <Flex gap={8}>
              <Text strong style={{fontSize:20}}>Min Latencied Span in {data.totalMin.toFixed(2)}m</Text>
            </Flex>
          }
          size="small"
          style={cardStyle()}
        >
          {loading ? (
            <Spin size="small" />
          ) : (
            <Flex vertical>
              <Text style={{fontSize:30,fontWeight:"bolder"}}>{data.minLatencySpan} / {data.minLatency.toFixed(2)}</Text>
              
            </Flex>
          )}
        </Card>
      </Col>
    </Row>
  );
};

export default BasicSummary;
