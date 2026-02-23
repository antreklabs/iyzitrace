import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import ServiceDetailContainer from '../../containers/service/service.detail.container';

const ServiceDetailPage: React.FC = () => {
  const { serviceName } = useParams<{ serviceName: string }>();
  const navigate = useNavigate();

  if (!serviceName) {
    return <div>Service name not provided</div>;
  }

  return (
    <div>
      <div style={{ padding: '16px 24px 0 24px' }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(-1)}
          className="detail-back-button"
        >
          Back to Services
        </Button>
      </div>
      <ServiceDetailContainer serviceName={decodeURIComponent(serviceName)} />
    </div>
  );
};

export default ServiceDetailPage;