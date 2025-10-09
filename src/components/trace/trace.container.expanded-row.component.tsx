import React, { useEffect, useState } from 'react';
import { Table } from 'antd';

interface TraceExpandedRowProps {
  record: any;
  start?: number | undefined;
  end?: number | undefined;
}

const TraceExpandedRowComponent: React.FC<TraceExpandedRowProps> = ({ record, start, end }) => {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);

        

      } finally {
        setLoading(false);
      }
    };
    run();
  }, [record?.service, start, end]);

  return (
    <Table size="small" pagination={false} loading={loading} rowKey={(r) => r.name} />
  );
};

export default TraceExpandedRowComponent;
