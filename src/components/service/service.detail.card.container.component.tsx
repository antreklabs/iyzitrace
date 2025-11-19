import React, { useEffect, useState } from 'react';
import { Card, Col, Flex, Row, Spin, Typography } from 'antd';
import { Operation, Service } from '@/api/service/interface.service';
import { FilterParamsModel } from '@/api/service/query.service';

// import {randomBackgroundGradient } from '../../utils';

interface BasicSummaryProps {
  data: Service[];
  filterModel: FilterParamsModel;
}
const { Text } = Typography;
const BasicSummary: React.FC<BasicSummaryProps> = ({ data, filterModel }) => {
  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState({
    operationCount: 0,
    totalCalls: 0,
    totalCallsSpan: '',
    operationCountSpan: '',
    maxLatencySpan: '',
    maxDuration: 0,
    minLatencySpan: '',
    minDuration: 0,
    totalMin: '',
  });
  
  const getMetrics = async () => {
    setLoading(true);

    try {
      const operations = data[0]?.operations || [];
      const operationCount = operations.length;
      const totalCalls = data[0].metrics.callsCount;
      
      // En yüksek maxLatencyMs değerine sahip operation'ı bul
      const maxLatencyOperation = operations.length > 0 
        ? operations.reduce((max: Operation, operation: Operation) => {
            const maxValue = max.metrics.maxDurationMs || 0;
            const currentValue = operation.metrics.maxDurationMs || 0;
            return currentValue > maxValue ? operation : max;
          })
        : null;
      const maxLatencySpan = maxLatencyOperation?.name || '';
      
      // En düşük minLatencyMs değerine sahip operation'ı bul
      const minLatencyOperation = operations.length > 0
        ? operations.reduce((min: Operation, operation: Operation) => {
            const minValue = min.metrics.minDurationMs ?? Infinity;
            const currentValue = operation.metrics.minDurationMs ?? Infinity;
            return currentValue < minValue ? operation : min;
          })
        : null;
      const minLatencySpan = minLatencyOperation?.name || '';
      
      const maxDuration = data[0].metrics.maxDurationMs;
      const minDuration = data[0].metrics.minDurationMs;
      const totalMin = filterModel?.options.interval;
      const totalCallsSpan = 'N/A';
      const operationCountSpan = 'N/A';
      
      setSummaryData({
        operationCount,
        totalCalls,
        totalCallsSpan,
        operationCountSpan,
        maxLatencySpan,
        minLatencySpan,
        maxDuration,
        minDuration,
        totalMin,
      });
    } catch (err) {
      console.error('Metric fetch error', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getMetrics();
  }, [data?.length, filterModel?.options.interval]);

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
                Operation Count in {summaryData.totalMin}m
              </Text>
              <Text style={{ color: '#52c41a', fontSize: '28px', fontWeight: 'bold', lineHeight: 1 }}>
                {summaryData.operationCount}
              </Text>
              <Text style={{ color: '#8c8c8c', fontSize: '14px' }}>
                {summaryData.operationCountSpan}
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
                Total Call Count in {summaryData.totalMin}m
              </Text>
              <Text style={{ color: '#52c41a', fontSize: '28px', fontWeight: 'bold', lineHeight: 1 }}>
                {summaryData.totalCalls}
              </Text>
              <Text style={{ color: '#8c8c8c', fontSize: '14px' }}>
                {summaryData.totalCallsSpan}
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
                Max Latency Span in {summaryData.totalMin}m
              </Text>
              <Text style={{ color: '#52c41a', fontSize: '28px', fontWeight: 'bold', lineHeight: 1 }}>
                {summaryData.maxDuration.toFixed(2)} ms
              </Text>
              <Text style={{ color: '#8c8c8c', fontSize: '14px' }}>
                {summaryData.maxLatencySpan}
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
                Min Latency Span in {summaryData.totalMin}m
              </Text>
              <Text style={{ color: '#52c41a', fontSize: '28px', fontWeight: 'bold', lineHeight: 1 }}>
                {summaryData.minDuration.toFixed(2)} ms
              </Text>
              <Text style={{ color: '#8c8c8c', fontSize: '14px' }}>
                {summaryData.minLatencySpan}
              </Text>
            </Flex>
          )}
        </Card>
      </Col>
    </Row>
  );
};

export default BasicSummary;
