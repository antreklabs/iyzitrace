import React from 'react';
import { Tag, Space } from 'antd';

interface TraceMetaHeaderProps {
   meta:{ name?: string;
    statusCode?: string;
    method?: string;
    startTime?: string;
    durationMs?: number;
    path?: string;
   };
}

const TraceMetaHeader: React.FC<TraceMetaHeaderProps> = ({
  meta}) => {
    const { name, statusCode, method, startTime, durationMs, path } = meta || {};
  return (
    <div style={{ marginBottom: 16 }}>
      <h2>{name} <span style={{ color: '#999' }}>{durationMs.toFixed(2)}ms</span></h2>
      <Space size="middle">
        <Tag color="blue">{method}</Tag>
        <Tag>{statusCode}</Tag>
        <Tag color="purple">{path}</Tag>
        <span>{startTime}</span>
      </Space>
    </div>
  );
};

export default TraceMetaHeader;
