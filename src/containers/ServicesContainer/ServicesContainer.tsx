import React, { useEffect, useState } from 'react';
import { Row, Col, Spin, Empty } from 'antd';
import BaseContainer from '../../components/core/basecontainer/basecontainer';
import { TempoApi } from '../../providers';
import ServiceCard from './components/ServiceCard';
import GrafanaLikeRangePicker from '../../components/core/graphanadatepicker';
import MiddleStats from './components/middlestats/MiddleStats';

const ServicesContainer: React.FC = () => {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [range] = useState<any>(null);

  const now = Date.now();
  const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;

  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      try {
        const data = await TempoApi.getServiceNames();
        console.log('API Response:', data); // Debug için
        
        // API'den gelen yapı: { tagValues: [{ type: 'string', value: 'service-name' }] }
        const tagValues = data?.tagValues || [];
        setServices(tagValues);
      } catch (err) {
        console.error('Failed to fetch services:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  if (loading) {
    return (
      <BaseContainer title="Services">
        <Spin size="large" style={{ display: 'flex', justifyContent: 'center', padding: 40 }} />
      </BaseContainer>
    );
  }

  if (services.length === 0) {
    return (
      <BaseContainer title="Services">
        <Empty description="No services found" />
      </BaseContainer>
    );
  }

  return (
    <BaseContainer
      title="Services"
      headerActions={<GrafanaLikeRangePicker onChange={(value) => console.log(value)} title="Date Range" />}
    >
      <Row gutter={[16, 16]}>
        {services.map((service) => (
          <Col key={service.value} xs={24} sm={12} md={8} lg={6} xl={4}>
            <ServiceCard name={service.value} start={oneWeekAgo} end={now} />
          </Col>
        ))}
      </Row>
      <MiddleStats
        serviceNames={services.map((service) => service.value)}
        start={oneWeekAgo}
        end={now}
        range={range}
      />
    </BaseContainer>
  );
};

export default ServicesContainer;
