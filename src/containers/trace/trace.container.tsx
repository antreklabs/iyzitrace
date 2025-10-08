import React, { useRef } from 'react';
import BaseContainerComponent from '../base.container';
import TraceExpandedRowComponent from '../../components/trace/trace.container.expanded-row.component';
import TraceFilter from './trace.filter';
import TraceMetricsCard from '../../components/trace/trace.container.card.component';
// import { dateTime } from '@grafana/data';

const TraceContainer: React.FC = () => {
  const fetchModelData = async (): Promise<any[]> => {
    
    return [];
  };

  const expandedRowRender = (record: any) => {
    return <TraceExpandedRowComponent record={record} />;
  };

  const columns: any[] = [
    
  ];

  const scrollerRef = useRef<HTMLDivElement | null>(null);

  const scrollBy = (delta: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: delta, behavior: 'smooth' });
  };

  return (
    <BaseContainerComponent
      title="Traces"
      initialFilterCollapsed={false}
      onFetchData={fetchModelData}
      onExpandedRowRender={expandedRowRender}
      columns={columns}
      filterComponent={<TraceFilter onChange={fetchModelData} collapsed={false} columns={columns} />}
      datasourceType="tempo">
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => scrollBy(-400)}
            style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', zIndex: 1, background: '#1f1f1f', border: '1px solid #303030', color: '#d9d9d9', borderRadius: 6, padding: '4px 8px' }}
          >
            ◀
          </button>
          <div
            ref={scrollerRef}
            style={{ overflowX: 'auto', overflowY: 'hidden', whiteSpace: 'nowrap', padding: '0 36px' }}
          >
            <div style={{ display: 'inline-flex', gap: 16 }}>
                  <div key="ad">
                    <TraceMetricsCard name="ad" />
                  </div>
            </div>
          </div>
          <button
            onClick={() => scrollBy(400)}
            style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', zIndex: 1, background: '#1f1f1f', border: '1px solid #303030', color: '#d9d9d9', borderRadius: 6, padding: '4px 8px' }}
          >
            ▶
          </button>
        </div>
    </BaseContainerComponent>
  );
};

export default TraceContainer;