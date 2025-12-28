import React from 'react';
import { Tag, Typography, Space } from 'antd';
import { FiClock, FiCalendar } from 'react-icons/fi';
import '../../../assets/styles/containers/trace-detail/trace-meta-header.css';

const { Text } = Typography;

interface TraceMetaHeaderProps {
  traceId: string;
  serviceName?: string;
  httpMethod?: string;
  startTimeUnixNano?: number;
  durationMs: number;
  totalSpans: number;
  errorSpans?: number;
}

const formatDate = (nano?: number): string => {
  if (!nano) { return '-'; }
  const date = new Date(nano / 1e6);
  return date.toLocaleString();
};

const TraceMetaHeader: React.FC<TraceMetaHeaderProps> = ({
  traceId,
  serviceName = 'unknown-service',
  httpMethod = '',
  startTimeUnixNano,
  durationMs,
  totalSpans,
  errorSpans = 0,
}) => {
  return (
    <div className="trace-meta-header">
      <div className="left-section">
        <Text className="trace-label">Trace ID</Text>
        <span className="trace-id-box">{traceId}</span>
      </div>

      <div className="center-section">
        <Space size="middle">
          <Text className="service-name">{serviceName}</Text>
          {httpMethod && <Tag color="geekblue">{httpMethod}</Tag>}
          <span className="duration">
            <FiClock className="duration-icon" />
            {durationMs > 1000
              ? `${(durationMs / 1000).toFixed(2)} s`
              : `${durationMs.toFixed(2)} ms`}
          </span>
          <span className="timestamp">
            <FiCalendar className="timestamp-icon" />
            {formatDate(startTimeUnixNano)}
          </span>
        </Space>
      </div>

      <div className="right-section">
        <Text className="meta-count">{totalSpans} Spans</Text>
        {errorSpans > 0 && (
          <Text className="meta-error">{errorSpans} Errors</Text>
        )}
      </div>
    </div>
  );
};

export default TraceMetaHeader;