import React from 'react';
import { Tooltip } from 'antd';
import { css } from '@emotion/css';

export interface TimelineData {
  time: string;
  status: 'critical' | 'warning' | 'degraded' | 'healthy' | 'no-data';
  count: number;
}

interface AlertsTimelineProps {
  timelineData: TimelineData[];
}

const getStyles = () => ({
  timelineContainer: css`
    background: #1a1a1a;
    border: 1px solid #404040;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 24px;
  `,
  timelineTitle: css`
    font-size: 16px;
    font-weight: 500;
    color: #fff;
    margin-bottom: 12px;
  `,
  timeline: css`
    display: flex;
    gap: 2px;
    margin-bottom: 8px;
  `,
  timeBox: css`
    height: 32px;
    min-width: 20px;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s ease;
    
    &:hover {
      transform: scale(1.1);
      z-index: 1;
    }
    
    &.critical {
      background: #dc2626;
    }
    
    &.warning {
      background: #d97706;
    }
    
    &.degraded {
      background: #ca8a04;
    }
    
    &.healthy {
      background: #16a34a;
    }
    
    &.no-data {
      background: #404040;
    }
  `,
  timeLabels: css`
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    color: #8c8c8c;
    margin-top: 4px;
  `,
});

const getTimelineBoxClass = (status: string) => {
  switch (status) {
    case 'critical':
      return 'critical';
    case 'warning':
      return 'warning';
    case 'degraded':
      return 'degraded';
    case 'healthy':
      return 'healthy';
    default:
      return 'no-data';
  }
};

const AlertsTimeline: React.FC<AlertsTimelineProps> = ({ timelineData }) => {
  const styles = getStyles();

  return (
    <div className={styles.timelineContainer}>
      <div className={styles.timelineTitle}>
        Aggregated failed checks
      </div>
      <div className={styles.timeline}>
        {timelineData.map((item, index) => (
          <Tooltip
            key={index}
            title={`${item.time}: ${item.count} alerts (${item.status})`}
          >
            <div
              className={`${styles.timeBox} ${getTimelineBoxClass(item.status)}`}
              style={{ flex: 1 }}
            />
          </Tooltip>
        ))}
      </div>
      <div className={styles.timeLabels}>
        {timelineData.length > 0 && (
          <>
            <span>{timelineData[0].time}</span>
            <span>{timelineData[Math.floor(timelineData.length / 2)].time}</span>
            <span>{timelineData[timelineData.length - 1].time}</span>
          </>
        )}
      </div>
    </div>
  );
};

export default AlertsTimeline;

