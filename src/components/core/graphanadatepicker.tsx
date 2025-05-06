import React, { useState } from 'react';
import {
  Popover,
  Input,
  Button,
  List,
  Space,
  Typography,
  Divider,
} from 'antd';
import dayjs from 'dayjs';

const { Text, Link } = Typography;

const quickRanges = [
  { label: 'Last 5 minutes', subtract: { value: 5, unit: 'minute' } },
  { label: 'Last 15 minutes', subtract: { value: 15, unit: 'minute' } },
  { label: 'Last 30 minutes', subtract: { value: 30, unit: 'minute' } },
  { label: 'Last 1 hour', subtract: { value: 1, unit: 'hour' } },
  { label: 'Last 3 hours', subtract: { value: 3, unit: 'hour' } },
  { label: 'Last 6 hours', subtract: { value: 6, unit: 'hour' } },
  { label: 'Last 12 hours', subtract: { value: 12, unit: 'hour' } },
  { label: 'Last 24 hours', subtract: { value: 24, unit: 'hour' } },
  { label: 'Last 2 days', subtract: { value: 2, unit: 'day' } },
];

const parseRelativeInput = (val: string): dayjs.Dayjs | null => {
  if (val === 'now') return dayjs();
  const match = val.match(/^now-(\d+)([smhd])$/);
  if (!match) return null;
  const [, value, unit] = match;
  const map: Record<string, dayjs.ManipulateType> = {
    s: 'second',
    m: 'minute',
    h: 'hour',
    d: 'day',
  };
  return dayjs().subtract(Number(value), map[unit]);
};

const GrafanaLikeRangePicker = ({
  onChange,
}: {
  onChange: (start: number, end: number) => void;
}) => {
  const [visible, setVisible] = useState(false);
  const [from, setFrom] = useState('now-1h');
  const [to, setTo] = useState('now');
  const [search, setSearch] = useState('');
  const [selectedQuickLabel, setSelectedQuickLabel] = useState<string | null>('Last 1 hour');

  const handleApply = () => {
    const fromParsed = parseRelativeInput(from);
    const toParsed = parseRelativeInput(to);
    if (fromParsed && toParsed) {
      onChange(fromParsed.valueOf(), toParsed.valueOf());
      setVisible(false);
    }
  };

  const filtered = quickRanges.filter((q) =>
    q.label.toLowerCase().includes(search.toLowerCase())
  );

  const displayLabel = selectedQuickLabel
    ? selectedQuickLabel
    : `${parseRelativeInput(from)?.format('YYYY-MM-DD HH:mm:ss')} → ${parseRelativeInput(to)?.format('YYYY-MM-DD HH:mm:ss')}`;

  const content = (
    <div
      style={{
        display: 'flex',
        width: 700,
        background: '#1e1e1e',
        padding: 16,
        borderRadius: 8,
        color: '#fff',
      }}
    >
      <div style={{ flex: 1, marginRight: 16 }}>
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <Text style={{ color: '#ccc' }}>Absolute time range</Text>
          <Text style={{ color: '#aaa' }}>From</Text>
          <Input
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              setSelectedQuickLabel(null);
            }}
            style={{ background: '#2c2c2c', color: '#fff' }}
          />
          <Text style={{ color: '#aaa' }}>To</Text>
          <Input
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              setSelectedQuickLabel(null);
            }}
            style={{ background: '#2c2c2c', color: '#fff' }}
          />
          <Button type="primary" block onClick={handleApply}>
            Apply time range
          </Button>
          <Divider style={{ background: '#333' }} />
          <Text style={{ fontSize: 12, color: '#999' }}>
            It looks like you haven't used this time picker before...
          </Text>
          <Link
            href="https://grafana.com/docs/grafana/latest/dashboards/time-range-controls/"
            target="_blank"
          >
            Read the documentation
          </Link>
          <div style={{ fontSize: 12, color: '#999', marginTop: 8 }}>
            Browser Time <strong style={{ color: '#fff' }}>Turkey</strong>
            <br />
            UTC+03:00 <Button size="small" style={{ marginLeft: 8 }}>Change time settings</Button>
          </div>
        </Space>
      </div>

      <div style={{ width: 250 }}>
        <Input
          placeholder="Search quick ranges"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ background: '#2c2c2c', color: '#fff', marginBottom: 8 }}
        />
        <List
          size="small"
          bordered
          dataSource={filtered}
          renderItem={(item) => (
            <List.Item
              style={{ color: '#ddd', cursor: 'pointer' }}
              onClick={() => {
                const relative = `now-${item.subtract.value}${item.subtract.unit[0]}`;
                setFrom(relative);
                setTo('now');
                setSelectedQuickLabel(item.label);
              }}
            >
              {item.label}
            </List.Item>
          )}
          style={{ background: '#1e1e1e', borderColor: '#333' }}
        />
      </div>
    </div>
  );

  return (
    <Popover
      content={content}
      title={null}
      open={visible}
      onOpenChange={setVisible}
      trigger="click"
      placement="bottomLeft"
    >
      <Button>{displayLabel}</Button>
    </Popover>
  );
};

export default GrafanaLikeRangePicker;
