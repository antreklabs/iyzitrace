import React from 'react';
import './SelectedSpanDetails.css';
import { Tag, Typography, Button, Tabs, Divider } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import GroupedAttributeList from './GroupedAttributeList';

const { Text } = Typography;

interface SpanNode {
  id: string;
  serviceName: string;
  name: string;
  startTime: number;
  endTime: number;
  durationMs: number;
  statusCode?: string;
  tags?: Record<string, any>;
}

interface SelectedSpanDetailsProps {
  span?: SpanNode;
}

const formatDate = (nano: number): string => {
  return new Date(nano / 1e6).toLocaleString();
};

const SelectedSpanDetails: React.FC<SelectedSpanDetailsProps> = ({ span }) => {
  if (!span) {
    return (
      <div className="selected-span-details-empty">
        Select a span to see details
      </div>
    );
  }

  return (
    <div className="selected-span-details">
      <div className="header">
        <Text strong>Span Details</Text>
        <Button size="small" icon={<CopyOutlined />} />
      </div>

      <Divider style={{ margin: '8px 0' }} />

      <div className="meta-grid">
        <div className="meta-label">SPAN NAME</div>
        <Tag>{span.name}</Tag>

        <div className="meta-label">SPAN ID</div>
        <Tag>{span.id}</Tag>

        <div className="meta-label">START TIME</div>
        <Tag>{formatDate(span.startTime)}</Tag>

        <div className="meta-label">DURATION</div>
        <Tag>{span.durationMs > 1000 ? `${(span.durationMs / 1000).toFixed(2)} s` : `${span.durationMs.toFixed(2)} ms`}</Tag>

        <div className="meta-label">SERVICE</div>
        <Tag color="geekblue">{span.serviceName}</Tag>

        <div className="meta-label">SPAN KIND</div>
        <Tag>{span.tags?.['span.kind'] || 'Unset'}</Tag>

        <div className="meta-label">STATUS CODE STRING</div>
        <Tag>{span.tags?.['http.status_code'] || 'Unset'}</Tag>
      </div>

      <Divider style={{ margin: '8px 0' }} />

      <Tabs defaultActiveKey="attributes" size="small">
        <Tabs.TabPane tab="Attributes" key="attributes">
          {span.tags ? <GroupedAttributeList tags={span.tags} /> : <div style={{ color: '#aaa' }}>No attributes captured.</div>}
        </Tabs.TabPane>
        <Tabs.TabPane tab="Events" key="events">
          <div style={{ color: '#aaa' }}>No events captured.</div>
        </Tabs.TabPane>
      </Tabs>
    </div>
  );
};

export default SelectedSpanDetails;
