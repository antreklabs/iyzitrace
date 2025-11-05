import React from 'react';
import { useParams } from 'react-router-dom';
import ServiceDetailContainer from '../../containers/service/service.detail.container';
// import ServiceDetailContainer from '../../containers/ServiceDetailContainer/ServiceDetailContainer';

const ServiceDetailPage: React.FC = () => {
  const { serviceName } = useParams<{ serviceName: string }>();

  if (!serviceName) {
    return <div>Service name not provided</div>;
  }

  return <ServiceDetailContainer serviceName={decodeURIComponent(serviceName)} />;
};

export default ServiceDetailPage;
