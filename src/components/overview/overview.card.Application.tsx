import React from 'react';
import { Card, Badge, Typography } from 'antd';
import { 
  CoffeeOutlined, 
  WindowsOutlined, 
  DatabaseOutlined,
  AppstoreOutlined 
} from '@ant-design/icons';
import { Application } from '../../api/service/interface.service';

const { Title, Text } = Typography;

interface ApplicationCardProps {
  application: Application;
  onClick: (application: Application) => void;
  isSelected: boolean;
}

const ApplicationCard: React.FC<ApplicationCardProps> = ({ 
  application, 
  onClick, 
  isSelected 
}) => {
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'healthy':
      case 'running':
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

  const getApplicationIcon = (platform: string) => {
    const platformLower = platform.toLowerCase();
    if (platformLower.includes('java') || platformLower.includes('jdk') || platformLower.includes('openjdk')) {
      return <CoffeeOutlined style={{ fontSize: '24px', color: '#ff6b35' }} />;
    }
    if (platformLower.includes('.net') || platformLower.includes('dotnet')) {
      return <WindowsOutlined style={{ fontSize: '24px', color: '#512bd4' }} />;
    }
    if (platformLower.includes('redis') || platformLower.includes('cache')) {
      return <DatabaseOutlined style={{ fontSize: '24px', color: '#dc382d' }} />;
    }
    if (platformLower.includes('oracle') || platformLower.includes('db') || platformLower.includes('database')) {
      return <DatabaseOutlined style={{ fontSize: '24px', color: '#f80000' }} />;
    }
    return <AppstoreOutlined style={{ fontSize: '24px', color: '#1890ff' }} />;
  };

  const status = application.status?.value || 'unknown';

  return (
    <Card
      hoverable
      onClick={() => onClick(application)}
      style={{
        borderRadius: '12px',
        boxShadow: isSelected ? '0 4px 16px rgba(24, 144, 255, 0.4)' : '0 4px 12px rgba(0,0,0,0.1)',
        border: isSelected ? '2px solid #1890ff' : 'none',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
      }}
      bodyStyle={{ padding: '20px', textAlign: 'center' }}
    >
      <div style={{ marginBottom: '12px' }}>{getApplicationIcon(application.platform)}</div>
      <Title level={4} style={{ margin: '0 0 8px 0' }}>{application.name}</Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: '12px' }}>
        {application.platform} {application.version}
      </Text>
      <Badge 
        color={getStatusColor(status)} 
        text={status.charAt(0).toUpperCase() + status.slice(1)}
        style={{ fontSize: '12px' }}
      />
    </Card>
  );
};

export default ApplicationCard;

