import React, { useState } from 'react';
import { Card, Col, Row, Select } from 'antd';
import { Service } from '../../api/service/interface.service';
import ServiceRequestChart from './service.request.chart.component';
import ServiceErrorChart from './service.error.chart.component';
import ServiceDurationChart from './service.duration.chart.component';

interface ServiceChartContainerProps {
  services: Service[] | undefined;
}

const ServiceChartContainer: React.FC<ServiceChartContainerProps> = ({ services }) => {
  const [durationMetric, setDurationMetric] = useState<string>('p50');

  return (
    <div style={{ position: 'relative', marginBottom: '24px' }}>
      <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
        {/* Requests Chart */}
        <Col xs={24} lg={8}>
          <Card
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Requests</span>
              </div>
            }
            style={{ height: '300px' }}
            styles={{ body: { height: '250px', padding: '16px' } }}
          >
            <ServiceRequestChart services={services || []} />
          </Card>
        </Col>

        {/* Errors Chart */}
        <Col xs={24} lg={8}>
          <Card
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Errors</span>
              </div>
            }
            style={{ height: '300px' }}
            styles={{ body: { height: '250px', padding: '16px' } }}
          >
            <ServiceErrorChart services={services || []} />
          </Card>
        </Col>

        {/* Duration Chart */}
        <Col xs={24} lg={8}>
          <Card
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>Duration</span>
                  <Select
                    value={durationMetric}
                    onChange={setDurationMetric}
                    style={{ width: '80px' }}
                    dropdownStyle={{ backgroundColor: '#1f1f1f', border: '1px solid #303030' }}
                    options={[
                      { value: 'p99', label: 'p99' },
                      { value: 'p95', label: 'p95' },
                      { value: 'p90', label: 'p90' },
                      { value: 'p75', label: 'p75' },
                      { value: 'p50', label: 'p50' },
                    ]}
                  />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  
                </div>
              </div>
            }
            style={{ height: '300px' }}
            styles={{ body: { height: '250px', padding: '16px' } }}
          >
            <ServiceDurationChart services={services || []} metric={durationMetric} />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ServiceChartContainer;

