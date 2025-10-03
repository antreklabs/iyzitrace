import React, { useEffect, useState } from 'react';
import { Row, Col, Spin, Empty } from 'antd';
import BaseContainer from '../../components/core/basecontainer/basecontainer';
import { TempoApi } from '../../providers';
import ServiceCard from './components/ServiceCard';
import GrafanaLikeRangePicker from '../../components/core/graphanadatepicker';
import MiddleStats from './components/middlestats/MiddleStats';
import { useAppSelector } from '../../store/hooks';

const ServicesContainer: React.FC = () => {
  const [range, setRange] = useState<[number, number]>([Date.now() - 60 * 15 * 1000, Date.now()]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { selectedUid } = useAppSelector((state) => state.datasource);

  const now = Date.now();
  const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;

  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      try {
        const data = await TempoApi.getServiceNames();
        const tagValues = data?.tagValues || [];
        setServices(tagValues);
      } catch (err) {
        console.error('Failed to fetch services:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, [selectedUid]);

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
