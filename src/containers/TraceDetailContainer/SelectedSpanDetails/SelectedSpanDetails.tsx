import React from 'react';
import '../../../assets/styles/containers/trace-detail/selected-span-details.styles';
import '../../../assets/styles/containers/trace-detail/trace-detail.styles';
import { Collapse, Typography, Tag, Divider, Tooltip, Tabs, Button, Badge } from 'antd';
import { CopyOutlined, ClockCircleOutlined } from '@ant-design/icons';
import GroupedAttributeList from './GroupedAttributeList';

const { Text } = Typography;

interface SpanEvent {
  name: string;
  timeUnixNano: number;
  attributes: Record<string, any>;
}

interface SpanNode {
  id: string;
  serviceName: string;
  name: string;
  startTime: number;
  endTime: number;
  durationMs: number;
  statusCode?: string;
  tags?: Record<string, any>;
  resourceAttributes?: Record<string, any>;
  events?: SpanEvent[];
}

interface SelectedSpanDetailsProps {
  span?: SpanNode;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  expandedEventKey?: string | null;
  onExpandedEventChange?: (key: string | null) => void;
  eventColorMap?: Record<string, string>;
}

const formatDate = (nano: number): string => {
  return new Date(nano / 1e6).toLocaleString();
};

const formatRelativeMs = (nano: number, baseNano: number): string => {
  const ms = (nano - baseNano) / 1e6;
  if (ms > 1000) return `${(ms / 1000).toFixed(2)} s`;
  return `${ms.toFixed(2)} ms`;
};

const SelectedSpanDetails: React.FC<SelectedSpanDetailsProps> = ({
  span,
  activeTab = 'span_attributes',
  onTabChange,
  expandedEventKey,
  onExpandedEventChange,
  eventColorMap,
}) => {
  if (!span) {
    return (
      <div className="selected-span-details-empty">
        Select a span to see details
      </div>
    );
  }

  const events = span.events || [];
  const spanAttrsCount = Object.keys(span.tags || {}).length;
  const resourceAttrsCount = Object.keys(span.resourceAttributes || {}).length;

  return (
    <div className="selected-span-details">
      <div className="span-details-header">
        <Text strong>Span Details</Text>
        <Button size="small" icon={<CopyOutlined />} />
      </div>

      <Divider className="span-details-divider" />

      <div className="meta-grid">
        <div className="meta-label">SPAN NAME</div>
        <Tooltip title={span.name} placement="topLeft">
          <Tag className="span-tag-truncate">{span.name}</Tag>
        </Tooltip>

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

      <Divider className="span-details-divider" />

      <Tabs
        activeKey={activeTab}
        onChange={(key) => onTabChange?.(key)}
        size="small"
        items={[
          {
            key: 'span_attributes',
            label: `Span Attrs(${spanAttrsCount})`,
            children: span.tags && spanAttrsCount > 0
              ? <GroupedAttributeList tags={span.tags} />
              : <div className="no-attributes-message">No span attributes captured.</div>
          },
          {
            key: 'resource_attributes',
            label: `Resource(${resourceAttrsCount})`,
            children: span.resourceAttributes && resourceAttrsCount > 0
              ? <GroupedAttributeList tags={span.resourceAttributes} />
              : <div className="no-attributes-message">No resource attributes captured.</div>
          },
          {
            key: 'events',
            label: `Events(${events.length})`,
            children: events.length > 0
              ? <EventsList
                events={events}
                spanStartTime={span.startTime}
                expandedKey={expandedEventKey}
                onExpandedChange={onExpandedEventChange}
                eventColorMap={eventColorMap}
              />
              : <div className="no-attributes-message">No events captured.</div>
          }
        ]}
      />
    </div>
  );
};

// Events list component
const EventsList: React.FC<{
  events: SpanEvent[];
  spanStartTime: number;
  expandedKey?: string | null;
  onExpandedChange?: (key: string | null) => void;
  eventColorMap?: Record<string, string>;
}> = ({ events, spanStartTime, expandedKey, onExpandedChange, eventColorMap }) => {
  const sortedEvents = [...events].sort((a, b) => a.timeUnixNano - b.timeUnixNano);

  const collapseItems = sortedEvents.map((event, index) => {
    const color = eventColorMap?.[event.name] || '#faad14';
    return {
      key: String(index),
      label: (
        <div className="span-event-label">
          <span className="span-event-color-dot" style={{ backgroundColor: color }} />
          <span className="span-event-time">
            {formatRelativeMs(event.timeUnixNano, spanStartTime)}
          </span>
          <span className="span-event-name">
            ({event.name})
          </span>
        </div>
      ),
      children: (
        <div>
          {Object.keys(event.attributes).length > 0 ? (
            <div className="span-event-attrs">
              {Object.entries(event.attributes).map(([key, value]) => (
                <div key={key} className="tag-row">
                  <Tag className="tag-key span-event-tag-key">{key}</Tag>
                  <span className="tag-value span-event-tag-value">
                    "{String(value)}"
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-attributes-message">No attributes for this event.</div>
          )}
        </div>
      ),
    };
  });

  const activeKeys = expandedKey ? [expandedKey] : [];

  return (
    <Collapse
      bordered={false}
      ghost
      activeKey={activeKeys}
      onChange={(keys) => {
        const keyArr = Array.isArray(keys) ? keys : [keys];
        onExpandedChange?.(keyArr.length > 0 ? String(keyArr[keyArr.length - 1]) : null);
      }}
      items={collapseItems}
    />
  );
};

export default SelectedSpanDetails;