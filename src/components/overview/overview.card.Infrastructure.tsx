import React from 'react';
import { Card, Progress, Badge, Typography } from 'antd';
import { Infrastructure } from '../../api/service/interface.service';

const { Title, Text } = Typography;

interface InfrastructureCardProps {
  infrastructure: Infrastructure;
  onClick: (infrastructure: Infrastructure) => void;
  isSelected: boolean;
}

const InfrastructureCard: React.FC<InfrastructureCardProps> = ({ 
  infrastructure, 
  onClick, 
  isSelected 
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

  const getProgressColor = (value: number) => {
    if (value < 50) return '#52c41a';
    if (value < 80) return '#faad14';
    return '#f5222d';
  };

  const cpuPercentage = infrastructure.cpu?.percentage || 0;
  const memoryPercentage = infrastructure.memory?.percentage || 0;
  const status = infrastructure.status?.value || 'unknown';
  
  const gradients = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  ];
  
  const gradientIndex = Math.abs(infrastructure.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % gradients.length;
  const gradient = gradients[gradientIndex];

  return (
    <Card
      hoverable
      onClick={() => onClick(infrastructure)}
      style={{
        borderRadius: '12px',
        background: gradient,
        color: 'white',
        border: isSelected ? '2px solid #1890ff' : 'none',
        boxShadow: isSelected ? '0 4px 16px rgba(24, 144, 255, 0.4)' : '0 4px 12px rgba(0,0,0,0.1)',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
      }}
      bodyStyle={{ padding: '20px' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div>
          <Title level={4} style={{ color: 'white', margin: 0 }}>{infrastructure.name}</Title>
          <Text style={{ color: 'rgba(255,255,255,0.8)' }}>{infrastructure.type || infrastructure.osVersion}</Text>
        </div>
        <Badge 
          color={getStatusColor(status)} 
          style={{ width: '12px', height: '12px' }}
        />
      </div>
      {infrastructure.cpu && (
        <div style={{ marginBottom: '12px' }}>
          <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px' }}>CPU Usage</Text>
          <Progress
            percent={cpuPercentage}
            strokeColor={getProgressColor(cpuPercentage)}
            trailColor="rgba(255,255,255,0.3)"
            showInfo={false}
            style={{ marginTop: '4px' }}
          />
          <Text style={{ color: 'white', fontSize: '12px' }}>{cpuPercentage.toFixed(1)}%</Text>
        </div>
      )}
      {infrastructure.memory && (
        <div>
          <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px' }}>Memory</Text>
          <Progress
            percent={memoryPercentage}
            strokeColor={getProgressColor(memoryPercentage)}
            trailColor="rgba(255,255,255,0.3)"
            showInfo={false}
            style={{ marginTop: '4px' }}
          />
          <Text style={{ color: 'white', fontSize: '12px' }}>
            {infrastructure.memory.usage.toFixed(1)}GB / {infrastructure.memory.capacity.toFixed(1)}GB
          </Text>
        </div>
      )}
    </Card>
  );
};

export default InfrastructureCard;

