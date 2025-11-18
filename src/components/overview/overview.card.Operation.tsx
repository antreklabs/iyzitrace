import React from 'react';
import { Card, List, Badge, Typography, Avatar } from 'antd';
import { 
  UnorderedListOutlined,
  UserOutlined,
  CheckCircleOutlined,
  EditOutlined,
  PlusOutlined,
  TruckOutlined
} from '@ant-design/icons';
import { Operation } from '../../api/service/interface.service';

const { Title, Text } = Typography;

interface OperationCardProps {
  operations: Operation[];
  title: string;
  onClick: (operation: Operation) => void;
  selectedOperationId?: string;
}

const OperationCard: React.FC<OperationCardProps> = ({ 
  operations, 
  title, 
  onClick,
  selectedOperationId
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

  const getOperationIcon = (operationName: string) => {
    const nameLower = operationName.toLowerCase();
    if (nameLower.includes('create') && nameLower.includes('user')) {
      return <UserOutlined style={{ fontSize: '18px', color: '#1890ff' }} />;
    }
    if (nameLower.includes('validate')) {
      return <CheckCircleOutlined style={{ fontSize: '18px', color: '#52c41a' }} />;
    }
    if (nameLower.includes('update') || nameLower.includes('profile')) {
      return <EditOutlined style={{ fontSize: '18px', color: '#722ed1' }} />;
    }
    if (nameLower.includes('create') && nameLower.includes('order')) {
      return <PlusOutlined style={{ fontSize: '18px', color: '#fa8c16' }} />;
    }
    if (nameLower.includes('ship')) {
      return <TruckOutlined style={{ fontSize: '18px', color: '#1890ff' }} />;
    }
    if (nameLower.includes('process') || nameLower.includes('payment')) {
      return <CheckCircleOutlined style={{ fontSize: '18px', color: '#f5222d' }} />;
    }
    return <UnorderedListOutlined style={{ fontSize: '18px', color: '#1890ff' }} />;
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${ms.toFixed(0)}ms avg`;
    return `${(ms / 1000).toFixed(1)}s avg`;
  };

  if (operations.length === 0) {
    return null;
  }

  return (
    <Card
      style={{
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        border: 'none'
      }}
      bodyStyle={{ padding: '20px' }}
    >
      <Title level={4} style={{ marginBottom: '16px' }}>
        {title}
      </Title>
      <List
        dataSource={operations}
        renderItem={(operation) => {
          const status = operation.status?.value || 'unknown';
          const avgLatency = operation.metrics?.avgLatencyMs || operation.metrics?.avgDurationMs;
          const isSelected = operation.id === selectedOperationId;
          
          return (
            <List.Item 
              style={{ 
                border: 'none', 
                padding: '8px 0',
                cursor: 'pointer',
                backgroundColor: isSelected ? 'rgba(24, 144, 255, 0.1)' : 'transparent',
                borderRadius: '4px',
                transition: 'all 0.2s ease',
              }}
              onClick={() => onClick(operation)}
            >
              <List.Item.Meta
                avatar={<Avatar icon={getOperationIcon(operation.name)} style={{ background: '#f0f0f0' }} />}
                title={<Text>{operation.name}</Text>}
                description={<Text type="secondary">{formatDuration(avgLatency)}</Text>}
              />
              <Badge color={getStatusColor(status)} />
            </List.Item>
          );
        }}
      />
    </Card>
  );
};

export default OperationCard;

