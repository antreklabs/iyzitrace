import React, { useState } from 'react';
import BaseContainerComponent, { PageState, getPageState } from '../base.container';
import ServiceFilter from './service.filter';
import ServiceExpandedRowComponent from '../../components/service/service.container.expanded-row.component';
import { Col, Row } from 'antd';
import ServiceCard from '../ServicesContainer/components/ServiceCard';
import { tempoReadApi } from '../../providers/api/tempo/tempo.api.read';
import { useLocation } from 'react-router-dom';
import { ServiceItem } from '../../interfaces/pages/service/service.response.interface';

const ServiceContainer: React.FC = () => {
  const location = useLocation();
  const pageName = location.pathname.split('/').filter(Boolean).join('_') || 'home';
  const pageState = getPageState(pageName);
  const [services, setServices] = useState<string[]>([]);

  const fetchModelData = async (pageState?: PageState | null) => {
    const values = await tempoReadApi.getLabelValues('service.name');
    const raw: any[] = Array.isArray(values) ? values : [];
    const serviceNames: string[] = raw.map((s: any) =>
      typeof s === 'string' ? s : (s?.text ?? s?.value ?? String(s))
    );
    setServices(serviceNames);
    console.log('serviceNames', serviceNames);

    const response: ServiceItem[] = serviceNames.map((name) => ({
      id: name,
      service: name,
    }));



    return response;
  };

  const expandedRowRender = (record: any) => {
    return <ServiceExpandedRowComponent record={record} />;
  };

  const columns = [
    {
      title: 'Service',
      dataIndex: 'service',
      key: 'service',
      width: 150,
      render: (service: any) => (
        <span style={{ color: '#d9d9d9' }}>
          {service}
        </span>
      ),
    }
  ];

  return (
    <BaseContainerComponent
      title="Services"
      initialFilterCollapsed={true}
      onFetchData={fetchModelData}
      onExpandedRowRender={expandedRowRender}
      columns={columns}
      filterComponent={<ServiceFilter onChange={fetchModelData} collapsed={true} columns={columns} />}
      datasourceType="tempo">
        <Row gutter={[16, 16]}>
        {services.map((service) => (
          <Col key={service} xs={24} sm={12} md={8} lg={6} xl={4}>
             <ServiceCard 
               name={service} 
               start={pageState?.range?.[0]} 
               end={pageState?.range?.[1]} 
             />
          </Col>
        ))}
      </Row>
    </BaseContainerComponent>
  );
};

export default ServiceContainer;