import React from 'react';
import { DatePicker } from 'antd';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

const GrafanaLikeRangePicker = ({
  onChange,
  title,
}: {
  onChange: (start: number, end: number) => void;
  title: string;
}) => {
  const now = dayjs();

  const presets = [
    {
      label: 'Last 1 hour',
      value: (): [dayjs.Dayjs, dayjs.Dayjs] => [now.subtract(1, 'hour'), now],
    },
    {
      label: 'Last 2 hours',
      value: (): [dayjs.Dayjs, dayjs.Dayjs] => [now.subtract(2, 'hour'), now],
    },
    {
      label: 'Last 3 hours',
      value: (): [dayjs.Dayjs, dayjs.Dayjs] => [now.subtract(3, 'hour'), now],
    },
    {
      label: 'Last 6 hours',
      value: (): [dayjs.Dayjs, dayjs.Dayjs] => [now.subtract(6, 'hour'), now],
    },
    {
      label: 'Last 12 hours',
      value: (): [dayjs.Dayjs, dayjs.Dayjs] => [now.subtract(12, 'hour'), now],
    },
    {
      label: 'Today',
      value: (): [dayjs.Dayjs, dayjs.Dayjs] => [now.startOf('day'), now],
    },
  ];

  return (
    <RangePicker
      title={title}
      showTime={{ format: 'HH:mm' }}
      format="YYYY-MM-DD HH:mm:ss"
      allowClear={false}
      presets={presets}
      defaultValue={[now.subtract(1, 'hour'), now]}
      style={{ minWidth: 320 }}
      onChange={(dates) => {
        if (!dates || dates.length !== 2) {
          return;
        }
        onChange(dates[0].valueOf(), dates[1].valueOf());
      }}
    />
  );
};

export default GrafanaLikeRangePicker;
