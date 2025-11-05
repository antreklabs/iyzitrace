import React, { useEffect, useState } from 'react';
import { Row, Tabs } from 'antd';
import BaseContainer from '../../components/core/basecontainer/basecontainer.component';

import CallMetrics from './CallMetrics/CallMetrics';

import Operations from './Operations/Operations';
interface ServiceDetailContainerProps {
  serviceName: string;
}
const ServiceDetailContainer: React.FC<ServiceDetailContainerProps> = ({ serviceName }) => {
  const [start, setStart] = useState<number>(Date.now() - 15 * 60 * 1000); // Default: last 15 minutes
  const [end, setEnd] = useState<number>(Date.now());

  // URL'den from ve to parametrelerini oku
  useEffect(() => {
    
      const now = Date.now();
      const fifteenMinutesAgo = now - (15 * 60 * 60 * 1000);
      setStart(fifteenMinutesAgo);
      setEnd(now);
  }, []);

  return (
    <BaseContainer title={'Detail of ' + serviceName.toUpperCase()}>
    
      <Row gutter={[16, 16]}>
        <Tabs
          items={[
            {
              key: 'callmetric',
              label: 'Call Metrics',
              children: <CallMetrics serviceName={serviceName} start={start} end={end} />
            },
            {
              key: 'operations',
              label: 'Operations',
              children: <Operations serviceName={serviceName} start={start} end={end} />
            }
          ]}
        />
      </Row>
    </BaseContainer>
  );
};

export default ServiceDetailContainer;
