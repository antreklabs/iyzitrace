import React, { useEffect, useState } from 'react';
import { Card, Col, Flex, Row, Spin, Typography } from 'antd';
import { Operation, Service } from '@/api/service/interface.service';
import { FilterParamsModel } from '@/api/service/query.service';
import { FundOutlined, ThunderboltOutlined, RiseOutlined, FallOutlined } from '@ant-design/icons';
import '../../assets/styles/components/service/service.styles';

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
      <div className="service-summary-loading">
        <Spin size="large" />
        <span className="service-summary-loading-text">Loading metrics...</span>
      </div>
    );
  }

  return (
    <Row gutter={[16, 16]} className="row-mb-24">
      <Col span={6}>
        <Card
          hoverable
          size="small"
          className="service-detail-stat-card-blue"
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
                <Text className="service-summary-label">
                  Operation Count
                </Text>
                <FundOutlined className="service-summary-icon-blue" />
              </Flex>
              <Text className="service-summary-value-blue">
                {summaryData.operationCount}
              </Text>
              <Text className="service-summary-subtext">
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
          className="service-detail-stat-card-green"
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
                <Text className="service-summary-label">
                  Total Call Count
                </Text>
                <ThunderboltOutlined className="service-summary-icon-green" />
              </Flex>
              <Text className="service-summary-value-green">
                {summaryData.totalCalls}
              </Text>
              <Text className="service-summary-subtext">
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
          className="service-detail-stat-card-red"
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
                <Text className="service-summary-label">
                  Max Latency Span
                </Text>
                <RiseOutlined className="service-summary-icon-red" />
              </Flex>
              <Text className="service-summary-value-red">
                {formatDuration(summaryData.maxDuration)}
              </Text>
              <Text
                className="service-summary-subtext-ellipsis"
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
          className="service-detail-stat-card-amber"
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
                <Text className="service-summary-label">
                  Min Latency Span
                </Text>
                <FallOutlined className="service-summary-icon-orange" />
              </Flex>
              <Text className="service-summary-value-orange">
                {formatDuration(summaryData.minDuration)}
              </Text>
              <Text
                className="service-summary-subtext-ellipsis"
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