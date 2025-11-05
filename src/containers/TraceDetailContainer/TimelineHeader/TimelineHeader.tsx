import React, { useRef, useEffect } from 'react';
import './TimelineHeader.css';

interface TimelineHeaderProps {
  startTime: number;
  endTime: number;
  setGridWidth: (width: number) => void; // dışarıya grid genişliğini vermek için
}

const TimelineHeader: React.FC<TimelineHeaderProps> = ({ startTime, endTime, setGridWidth }) => {
  const timelineHeaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (timelineHeaderRef.current) {
        // console.log('timelineHeaderRef.current.offsetWidth', timelineHeaderRef.current.offsetWidth)
      setGridWidth(timelineHeaderRef.current.offsetWidth);
    }
  }, []);

  const totalDuration = endTime - startTime;
  const intervals = 10; 
  const step = totalDuration / intervals;

  const marks = Array.from({ length: intervals + 1 }).map((_, idx) => {
    const timestamp = startTime + step * idx;
    const relativeMs = ((timestamp - startTime) / 1e6).toFixed(0);
    return { timestamp, label: `${relativeMs} ms` };
  });

  return (
    <div className="timeline-header" ref={timelineHeaderRef}>
      {marks.map((mark, idx) => (
        <div key={idx} className="timeline-header-cell">
          <div className="timeline-header-label">{mark.label}</div>
          <div className="timeline-header-gridline" />
        </div>
      ))}
    </div>
  );
};

export default TimelineHeader;
