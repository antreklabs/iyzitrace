import React from 'react';
import './TraceDetail.css';

interface TimelineHeaderProps {
  startTime: number;
  endTime: number;
  paddingLeft?: number;
}

const TimelineHeader: React.FC<TimelineHeaderProps> = ({ startTime, endTime, paddingLeft = 0 }) => {
  const totalDuration = endTime - startTime;
  const intervals = 10;
  const step = totalDuration / intervals;

  const marks = Array.from({ length: intervals + 1 }).map((_, idx) => {
    const timestamp = startTime + step * idx;
    const relativeMs = ((timestamp - startTime) / 1e6).toFixed(0);
    return { timestamp, label: `${relativeMs} ms` };
  });

  return (
    <div className="timeline-header" style={{ paddingLeft }}>
      {marks.map((mark, idx) => (
        <div key={idx} className="timeline-header-mark">
          {mark.label}
        </div>
      ))}
    </div>
  );
};

export default TimelineHeader;
