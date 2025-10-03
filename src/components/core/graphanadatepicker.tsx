import React, { useState } from 'react';
import {
  Popover,
  Input,
  Button,
  List,
  Space,
  Typography,
  Divider,
  DatePicker,
  TimePicker,
} from 'antd';
import dayjs from 'dayjs';
import '../../assets/styles/components/date-picker.css';

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
  onApply,
  title,
  value,
}: {
  onChange: (start: number, end: number) => void;
  onApply: (start: number, end: number) => void;
  title?: string;
  value?: [number, number];
}) => {
  const [visible, setVisible] = useState(false);
  const [from, setFrom] = useState('now-1h');
  const [to, setTo] = useState('now');
  const [search, setSearch] = useState('');
  const [selectedQuickLabel, setSelectedQuickLabel] = useState<string | null>('Last 1 hour');
  const [fromDate, setFromDate] = useState<dayjs.Dayjs | null>(dayjs().subtract(1, 'hour'));
  const [toDate, setToDate] = useState<dayjs.Dayjs | null>(dayjs());
  const [fromTime, setFromTime] = useState<dayjs.Dayjs | null>(dayjs().subtract(1, 'hour'));
  const [toTime, setToTime] = useState<dayjs.Dayjs | null>(dayjs());

  const handleApply = () => {
    // Use absolute date/time if available, otherwise fall back to relative input
    let fromParsed: dayjs.Dayjs | null = null;
    let toParsed: dayjs.Dayjs | null = null;

    if (fromDate && fromTime) {
      fromParsed = fromDate.hour(fromTime.hour()).minute(fromTime.minute()).second(fromTime.second());
    } else {
      fromParsed = parseRelativeInput(from);
    }

    if (toDate && toTime) {
      toParsed = toDate.hour(toTime.hour()).minute(toTime.minute()).second(toTime.second());
    } else {
      toParsed = parseRelativeInput(to);
    }

    if (fromParsed && toParsed) {
      onApply(fromParsed.valueOf(), toParsed.valueOf());
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
    <div className="date-picker-container">
      <div className="date-picker-absolute-section">
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <Text className="date-picker-section-title">Absolute time range</Text>
          
          <div>
            <Text className="date-picker-field-label">From</Text>
            <div className="date-picker-date-time-row">
              <DatePicker
                className="date-picker-date-picker"
                value={fromDate}
                onChange={(date) => {
                  setFromDate(date);
                  setSelectedQuickLabel(null);
                }}
                style={{ background: '#2c2c2c', color: '#fff' }}
                popupStyle={{ background: '#1e1e1e' }}
              />
              <TimePicker
                className="date-picker-time-picker"
                value={fromTime}
                onChange={(time) => {
                  setFromTime(time);
                  setSelectedQuickLabel(null);
                }}
                style={{ background: '#2c2c2c', color: '#fff' }}
                popupStyle={{ background: '#1e1e1e' }}
              />
            </div>
          </div>

          <div>
            <Text className="date-picker-field-label">To</Text>
            <div className="date-picker-date-time-row">
              <DatePicker
                className="date-picker-date-picker"
                value={toDate}
                onChange={(date) => {
                  setToDate(date);
                  setSelectedQuickLabel(null);
                }}
                style={{ background: '#2c2c2c', color: '#fff' }}
                popupStyle={{ background: '#1e1e1e' }}
              />
              <TimePicker
                className="date-picker-time-picker"
                value={toTime}
                onChange={(time) => {
                  setToTime(time);
                  setSelectedQuickLabel(null);
                }}
                style={{ background: '#2c2c2c', color: '#fff' }}
                popupStyle={{ background: '#1e1e1e' }}
              />
            </div>
          </div>
          <Button type="primary" className="date-picker-apply-button" onClick={handleApply}>
            Apply time range
          </Button>
          <Divider className="date-picker-divider" />
          <Text className="date-picker-help-text">
            It looks like you haven't used this time picker before...
          </Text>
          <Link
            href="https://grafana.com/docs/grafana/latest/dashboards/time-range-controls/"
            target="_blank"
          >
            Read the documentation
          </Link>
          {/* <div style={{ fontSize: 12, color: '#999', marginTop: 8 }}>
            Browser Time <strong style={{ color: '#fff' }}>Turkey</strong>
            <br />
            UTC+03:00 <Button size="small" style={{ marginLeft: 8 }}>Change time settings</Button>
          </div> */}
        </Space>
      </div>

      <div className="date-picker-quick-section">
        <Input
          placeholder="Search quick ranges"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="date-picker-search-input"
        />
        <List
          size="small"
          bordered
          dataSource={filtered}
          renderItem={(item) => (
            <List.Item
              className={`date-picker-quick-item ${selectedQuickLabel === item.label ? 'selected' : ''}`}
              onClick={() => {
                const relative = `now-${item.subtract.value}${item.subtract.unit[0]}`;
                setFrom(relative);
                setTo('now');
                setSelectedQuickLabel(item.label);
                
                // Update date/time pickers as well
                const fromParsed = parseRelativeInput(relative);
                const toParsed = parseRelativeInput('now');
                
                if (fromParsed && toParsed) {
                  setFromDate(fromParsed);
                  setFromTime(fromParsed);
                  setToDate(toParsed);
                  setToTime(toParsed);
                  onChange(fromParsed.valueOf(), toParsed.valueOf());
                }
              }}
            >
              {item.label}
            </List.Item>
          )}
          className="date-picker-quick-list"
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
