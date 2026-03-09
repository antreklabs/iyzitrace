import React, { useEffect, useState } from 'react';
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
import '../../assets/styles/components/date-picker.styles';

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

  const initialFrom = value ? dayjs(value[0]) : dayjs().subtract(1, 'hour');
  const initialTo = value ? dayjs(value[1]) : dayjs();

  const [fromDate, setFromDate] = useState<dayjs.Dayjs | null>(initialFrom);
  const [toDate, setToDate] = useState<dayjs.Dayjs | null>(initialTo);
  const [fromTime, setFromTime] = useState<dayjs.Dayjs | null>(initialFrom);
  const [toTime, setToTime] = useState<dayjs.Dayjs | null>(initialTo);

  const applyQuickLabelFromValue = (start?: number, end?: number) => {
    if (typeof start === 'number' && typeof end === 'number') {
      const diffMin = Math.round((end - start) / 60000);
      const match =
        diffMin === 5 ? 'Last 5 minutes' :
          diffMin === 15 ? 'Last 15 minutes' :
            diffMin === 30 ? 'Last 30 minutes' :
              diffMin === 60 ? 'Last 1 hour' :
                diffMin === 180 ? 'Last 3 hours' :
                  diffMin === 360 ? 'Last 6 hours' :
                    diffMin === 720 ? 'Last 12 hours' :
                      diffMin === 1440 ? 'Last 24 hours' :
                        diffMin === 2880 ? 'Last 2 days' : null;
      setSelectedQuickLabel(match);
    }
  };

  useEffect(() => {
    if (value) {
      applyQuickLabelFromValue(value[0], value[1]);
    }
  }, [value?.[0], value?.[1]]);

  const handleApply = () => {
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
      const startMs = fromParsed.valueOf();
      const endMs = toParsed.valueOf();

      if (Math.abs(endMs - startMs) < 60 * 1000) {
        const newStart = dayjs().subtract(1, 'hour').valueOf();
        const newEnd = dayjs().valueOf();
        onApply(newStart, newEnd);
      } else {
        onApply(startMs, endMs);
      }
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
        <Space direction="vertical" size="small" className="gf-picker-space">
          <Text className="date-picker-section-title">Absolute time range</Text>

          <div>
            <Text className="date-picker-field-label">From</Text>
            <div className="date-picker-date-time-row">
              <DatePicker
                className="date-picker-date-picker gf-picker-input-dark"
                value={fromDate}
                onChange={(date) => {
                  setFromDate(date);
                  setSelectedQuickLabel(null);
                }}
                styles={{ popup: { root: { background: 'var(--bg-secondary)' } } }}
              />
              <TimePicker
                className="date-picker-time-picker gf-picker-input-dark"
                value={fromTime}
                onChange={(time) => {
                  setFromTime(time);
                  setSelectedQuickLabel(null);
                }}
                styles={{ popup: { root: { background: 'var(--bg-secondary)' } } }}
              />
            </div>
          </div>

          <div>
            <Text className="date-picker-field-label">To</Text>
            <div className="date-picker-date-time-row">
              <DatePicker
                className="date-picker-date-picker gf-picker-input-dark"
                value={toDate}
                onChange={(date) => {
                  setToDate(date);
                  setSelectedQuickLabel(null);
                }}
                styles={{ popup: { root: { background: 'var(--bg-secondary)' } } }}
              />
              <TimePicker
                className="date-picker-time-picker gf-picker-input-dark"
                value={toTime}
                onChange={(time) => {
                  setToTime(time);
                  setSelectedQuickLabel(null);
                }}
                styles={{ popup: { root: { background: 'var(--bg-secondary)' } } }}
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
          {
          }
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