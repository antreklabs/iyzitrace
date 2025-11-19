import React from 'react';
import { Card, List, Badge, Typography, Avatar } from 'antd';
import { 
  SettingOutlined,
  SafetyCertificateOutlined,
  ShoppingCartOutlined,
  CreditCardOutlined,
  BellOutlined
} from '@ant-design/icons';
import { Service } from '../../api/service/interface.service';

const { Title, Text } = Typography;

interface ServiceCardProps {
  services: Service[];
  title: string;
  icon: React.ReactNode;
  gradient: string;
  onClick: (service: Service) => void;
  selectedServiceId?: string;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ 
  services, 
  title, 
  icon, 
  gradient,
  onClick,
  selectedServiceId
}) => {
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'healthy':
        return '#52c41a';
      case 'warning':
        return '#faad14';
      case 'error':
        return '#f5222d';
      case 'degraded':
        return '#faad14';
      default:
        return '#d9d9d9';
    }
  };

  const getServiceIcon = (serviceName: string) => {
    const nameLower = serviceName.toLowerCase();
    if (nameLower.includes('user') || nameLower.includes('management')) {
      return <SafetyCertificateOutlined style={{ fontSize: '20px', color: '#1890ff' }} />;
    }
    if (nameLower.includes('order') || nameLower.includes('processing')) {
      return <ShoppingCartOutlined style={{ fontSize: '20px', color: '#722ed1' }} />;
    }
    if (nameLower.includes('payment') || nameLower.includes('gateway')) {
      return <CreditCardOutlined style={{ fontSize: '20px', color: '#52c41a' }} />;
    }
    if (nameLower.includes('notification')) {
      return <BellOutlined style={{ fontSize: '20px', color: '#fa8c16' }} />;
    }
    return <SettingOutlined style={{ fontSize: '20px', color: '#1890ff' }} />;
  };

  if (services.length === 0) {
    return null;
  }

  return (
    <Card
      style={{
        borderRadius: '12px',
        background: gradient,
        border: 'none',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}
      bodyStyle={{ padding: '20px' }}
    >
      <Title level={4} style={{ color: 'white', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        {icon}
        {title}
      </Title>
      <List
        dataSource={services}
        renderItem={(service) => {
          const status = service.status?.value || 'unknown';
          const isSelected = service.id === selectedServiceId;
          
          return (
            <List.Item 
              style={{ 
                border: 'none', 
                padding: '8px 0',
                cursor: 'pointer',
                backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                borderRadius: '4px',
                transition: 'all 0.2s ease',
              }}
              onClick={() => onClick(service)}
            >
              <List.Item.Meta
                avatar={<Avatar icon={getServiceIcon(service.name)} style={{ background: 'rgba(255,255,255,0.2)' }} />}
                title={<Text style={{ color: 'white' }}>{service.name}</Text>}
                description={<Text style={{ color: 'rgba(255,255,255,0.8)' }}>
                  {service.type || ''}
                </Text>}
              />
              <Badge color={getStatusColor(status)} />
            </List.Item>
          );
        }}
      />
    </Card>
  );
};

export default ServiceCard;

