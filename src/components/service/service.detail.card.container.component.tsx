import React, { useEffect, useState } from 'react';
import { Card, Col, Flex, Row, Spin, Typography } from 'antd';
import { Operation, Service } from '@/api/service/interface.service';
import { FilterParamsModel } from '@/api/service/query.service';
import { FundOutlined, ThunderboltOutlined, RiseOutlined, FallOutlined } from '@ant-design/icons';

const formatDuration = (ms: number): string => {
  if (ms >= 1000) {
    return `${(ms / 1000).toFixed(2)} s`;
  }
  return `${ms.toFixed(2)} ms`;
};

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
      
      const maxLatencyOperation = operations.length > 0 
        ? operations.reduce((max: Operation, operation: Operation) => {
            const maxValue = max.metrics.maxDurationMs || 0;
            const currentValue = operation.metrics.maxDurationMs || 0;
            return currentValue > maxValue ? operation : max;
          })
        : null;
      const maxLatencySpan = maxLatencyOperation?.name || '';
      
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
    <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
      <Col span={6}>
        <Card
          hoverable
          size="small"
          style={{
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(0, 0, 0, 0.4) 100%)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '12px',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          }}
          styles={{ body: { padding: '20px' } }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(59, 130, 246, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
          }}
        >
          {loading ? (
            <Flex justify="center"><Spin size="small" /></Flex>
          ) : (
            <Flex vertical gap={12}>
              <Flex justify="space-between" align="center">
                <Text style={{ color: '#71717a', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Operation Count
                </Text>
                <FundOutlined style={{ fontSize: '20px', color: '#3b82f6', opacity: 0.6 }} />
              </Flex>
              <Text style={{ color: '#3b82f6', fontSize: '32px', fontWeight: 700, lineHeight: 1 }}>
                {summaryData.operationCount}
              </Text>
              <Text style={{ color: '#52525b', fontSize: '11px', fontWeight: 500 }}>
                in {summaryData.totalMin}
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
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(0, 0, 0, 0.4) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '12px',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          }}
          styles={{ body: { padding: '20px' } }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(16, 185, 129, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
          }}
        >
          {loading ? (
            <Flex justify="center"><Spin size="small" /></Flex>
          ) : (
            <Flex vertical gap={12}>
              <Flex justify="space-between" align="center">
                <Text style={{ color: '#71717a', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Total Call Count
                </Text>
                <ThunderboltOutlined style={{ fontSize: '20px', color: '#10b981', opacity: 0.6 }} />
              </Flex>
              <Text style={{ color: '#10b981', fontSize: '32px', fontWeight: 700, lineHeight: 1 }}>
                {summaryData.totalCalls}
              </Text>
              <Text style={{ color: '#52525b', fontSize: '11px', fontWeight: 500 }}>
                in {summaryData.totalMin}
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
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(0, 0, 0, 0.4) 100%)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '12px',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          }}
          styles={{ body: { padding: '20px' } }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(239, 68, 68, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
          }}
        >
          {loading ? (
            <Flex justify="center"><Spin size="small" /></Flex>
          ) : (
            <Flex vertical gap={12}>
              <Flex justify="space-between" align="center">
                <Text style={{ color: '#71717a', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Max Latency Span
                </Text>
                <RiseOutlined style={{ fontSize: '20px', color: '#ef4444', opacity: 0.6 }} />
              </Flex>
              <Text style={{ color: '#ef4444', fontSize: '32px', fontWeight: 700, lineHeight: 1 }}>
                {formatDuration(summaryData.maxDuration)}
              </Text>
              <Text 
                style={{ 
                  color: '#52525b', 
                  fontSize: '11px', 
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
                title={summaryData.maxLatencySpan}
              >
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
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(0, 0, 0, 0.4) 100%)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '12px',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          }}
          styles={{ body: { padding: '20px' } }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(245, 158, 11, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
          }}
        >
          {loading ? (
            <Flex justify="center"><Spin size="small" /></Flex>
          ) : (
            <Flex vertical gap={12}>
              <Flex justify="space-between" align="center">
                <Text style={{ color: '#71717a', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Min Latency Span
                </Text>
                <FallOutlined style={{ fontSize: '20px', color: '#f59e0b', opacity: 0.6 }} />
              </Flex>
              <Text style={{ color: '#f59e0b', fontSize: '32px', fontWeight: 700, lineHeight: 1 }}>
                {formatDuration(summaryData.minDuration)}
              </Text>
              <Text 
                style={{ 
                  color: '#52525b', 
                  fontSize: '11px', 
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
                title={summaryData.minLatencySpan}
              >
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