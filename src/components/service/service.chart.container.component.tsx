import React, { useState } from 'react';
import { Card, Col, Row, Select } from 'antd';
import { Service } from '../../api/service/interface.service';
import ServiceRequestChart from './service.request.chart.component';
import ServiceErrorChart from './service.error.chart.component';
import ServiceDurationChart from './service.duration.chart.component';
import '../../assets/styles/components/service/service.css';

interface ServiceChartContainerProps {
  services: Service[] | undefined;
}

const ServiceChartContainer: React.FC<ServiceChartContainerProps> = ({ services }) => {
  const [durationMetric, setDurationMetric] = useState<string>('p50');

  return (
    <div className="service-chart-container-wrapper">
      <Row gutter={[16, 16]} className="service-chart-row">
        {
        }
        <Col xs={24} lg={8}>
          <Card
            title={
              <div className="service-chart-card-title">
                <span>Requests</span>
              </div>
            }
            className="service-chart-height-300"
            styles={{ body: { height: '250px', padding: '16px' } }}
          >
            <ServiceRequestChart services={services || []} />
          </Card>
        </Col>

        {
        }
        <Col xs={24} lg={8}>
          <Card
            title={
              <div className="service-chart-card-title">
                <span>Errors</span>
              </div>
            }
            className="service-chart-height-300"
            styles={{ body: { height: '250px', padding: '16px' } }}
          >
            <ServiceErrorChart services={services || []} />
          </Card>
        </Col>

        {
        }
        <Col xs={24} lg={8}>
          <Card
            title={
              <div className="service-chart-card-title">
                <div className="service-chart-card-duration-header">
                  <span>Duration</span>
                  <Select
                    value={durationMetric}
                    onChange={setDurationMetric}
                    className="service-chart-select-80"
                    dropdownStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
                    options={[
                      { value: 'p99', label: 'p99' },
                      { value: 'p95', label: 'p95' },
                      { value: 'p90', label: 'p90' },
                      { value: 'p75', label: 'p75' },
                      { value: 'p50', label: 'p50' },
                    ]}
                  />
                </div>
                <div className="service-chart-card-empty-actions">

                </div>
              </div>
            }
            className="service-chart-height-300"
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