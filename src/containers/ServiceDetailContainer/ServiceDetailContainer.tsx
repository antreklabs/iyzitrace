import React, { useState } from 'react';
import { Row, Tabs } from 'antd';
import BaseContainer from '../../components/core/basecontainer/basecontainer';

import GrafanaLikeRangePicker from '../../components/core/graphanadatepicker';
import CallMetrics from './CallMetrics/CallMetrics';
import BasicSummary from './BasicSummary';
import Operations from './Operations/Operations';
interface ServiceDetailContainerProps {
  serviceName: string;
}
const ServiceDetailContainer: React.FC<ServiceDetailContainerProps> = ({ serviceName }) => {
  const [range, setRange] = useState<[number, number]>([Date.now() - 60 * 15 * 1000, Date.now()]);
  return (
    <BaseContainer
      title={'Detail of ' + serviceName.toUpperCase()}
      headerActions={
        <GrafanaLikeRangePicker 
          onChange={(start, end) => setRange([start, end])} 
          onApply={(start, end) => {
            setRange([start, end]);
            // TODO: Fetch data with new range
          }}
          value={range}
          title="Date Range" 
        />
      }
    >
    <BasicSummary serviceName={serviceName} start={range[0]} end={range[1]} />
      <Row gutter={[16, 16]}>
        <Tabs
          items={[
            {
              key: 'callmetric',
              label: 'Call Metrics',
              children: <CallMetrics serviceName={serviceName} start={range[0]} end={range[1]} />
            },
            {
              key: 'operations',
              label: 'Operations',
              children: <Operations serviceName={serviceName} start={range[0]} end={range[1]} />
            }
          ]}
        />
      </Row>
    </BaseContainer>
  );
};

export default ServiceDetailContainer;
