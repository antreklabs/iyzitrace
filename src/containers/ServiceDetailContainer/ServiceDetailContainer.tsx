import React from 'react';
import { Row, Tabs } from 'antd';
import BaseContainer from '../../components/core/basecontainer/basecontainer.component';

import CallMetrics from './CallMetrics/CallMetrics';
import BasicSummary from './BasicSummary';
import Operations from './Operations/Operations';
interface ServiceDetailContainerProps {
  serviceName: string;
}
const ServiceDetailContainer: React.FC<ServiceDetailContainerProps> = ({ serviceName }) => {
  return (
    <BaseContainer title={'Detail of ' + serviceName.toUpperCase()} pageName="service-detail">
    <BasicSummary serviceName={serviceName} start={0} end={0} />
      <Row gutter={[16, 16]}>
        <Tabs
          items={[
            {
              key: 'callmetric',
              label: 'Call Metrics',
              children: <CallMetrics serviceName={serviceName} start={0} end={0} />
            },
            {
              key: 'operations',
              label: 'Operations',
              children: <Operations serviceName={serviceName} start={0} end={0} />
            }
          ]}
        />
      </Row>
    </BaseContainer>
  );
};

export default ServiceDetailContainer;
