import React from 'react';
import { Card, Progress, Badge, Typography, Button } from 'antd';
import { AppstoreOutlined } from '@ant-design/icons';
import { Infrastructure } from '../../api/service/interface.service';

const { Title, Text } = Typography;

interface InfrastructureCardProps {
  infrastructure: Infrastructure;
  onClick: (infrastructure: Infrastructure) => void;
  onApplicationsClick: (infrastructure: Infrastructure, e: React.MouseEvent) => void;
  onDrop?: (infrastructure: Infrastructure, e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragEnter?: (infrastructure: Infrastructure, e: React.DragEvent) => void;
  onDragLeave?: (infrastructure: Infrastructure, e: React.DragEvent) => void;
  isDropTarget?: boolean;
  isDropping?: boolean;
  isSelected: boolean;
}

const InfrastructureCard: React.FC<InfrastructureCardProps> = ({
  infrastructure,
  onClick,
  onApplicationsClick,
  onDrop,
  onDragOver,
  onDragEnter,
  onDragLeave,
  isDropTarget,
  isDropping,
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

  const getGradientByOS = (type?: string, osVersion?: string) => {
    const osType = (type || osVersion || '').toLowerCase();

    if (osType.includes('windows') || osType.includes('win')) {
      return 'linear-gradient(135deg, #1e293b 0%, #334155 100%)';
    }

    if (osType.includes('linux') || osType.includes('ubuntu') || osType.includes('debian') || osType.includes('centos')) {
      return 'linear-gradient(135deg, #422006 0%, #713f12 100%)';
    }

    if (osType.includes('mac') || osType.includes('darwin') || osType.includes('osx')) {
      return 'linear-gradient(135deg, #3b0764 0%, #581c87 100%)';
    }

    if (osType.includes('docker') || osType.includes('container')) {
      return 'linear-gradient(135deg, #164e63 0%, #0e7490 100%)';
    }

    return 'linear-gradient(135deg, #134e4a 0%, #115e59 100%)';
  };

  const gradient = getGradientByOS(infrastructure.type, infrastructure.osVersion);

  const showDropEffect = isDropTarget || isDropping;

  return (
    <div className="overview-infra-wrapper">
      {showDropEffect && (
        <div className="overview-infra-drop-overlay" />
      )}
      <Card
        hoverable
        onClick={() => onClick(infrastructure)}
        onDrop={(e) => onDrop && onDrop(infrastructure, e)}
        onDragOver={(e) => onDragOver && onDragOver(e)}
        onDragEnter={(e) => onDragEnter && onDragEnter(infrastructure, e)}
        onDragLeave={(e) => onDragLeave && onDragLeave(infrastructure, e)}
        className="overview-infra-card-base"
        style={{
          background: gradient,
          border: isSelected ? '2px solid #1890ff' : 'none',
          boxShadow: isSelected
            ? '0 4px 16px rgba(24, 144, 255, 0.4)'
            : showDropEffect
              ? '0 8px 24px rgba(82, 196, 26, 0.6), 0 0 0 4px rgba(82, 196, 26, 0.2)'
              : '0 4px 12px rgba(0,0,0,0.1)',
          transform: showDropEffect ? 'scale(1.05)' : 'scale(1)',
        }}
        bodyStyle={{ padding: '20px' }}
      >
        <div className="overview-infra-header">
          <div>
            <Title level={4} className="overview-infra-title">{infrastructure.name}</Title>
            <Text className="overview-infra-subtitle">{infrastructure.type || infrastructure.osVersion}</Text>
          </div>
          <Badge
            color={getStatusColor(status)}
            className="overview-infra-status"
          />
        </div>
        {infrastructure.cpu && (
          <div className="overview-infra-metric-section">
            <Text className="overview-infra-metric-label">CPU Usage</Text>
            <Progress
              percent={cpuPercentage}
              strokeColor={getProgressColor(cpuPercentage)}
              trailColor="rgba(255,255,255,0.3)"
              showInfo={false}
              className="overview-infra-progress"
            />
            <Text className="overview-infra-metric-value">{cpuPercentage?.toFixed(1)}%</Text>
          </div>
        )}
        {infrastructure.memory && (
          <div className="overview-infra-metric-section-lg">
            <Text className="overview-infra-metric-label">Memory</Text>
            <Progress
              percent={memoryPercentage}
              strokeColor={getProgressColor(memoryPercentage)}
              trailColor="rgba(255,255,255,0.3)"
              showInfo={false}
              className="overview-infra-progress"
            />
            <Text className="overview-infra-metric-value">
              {infrastructure?.memory?.usage?.toFixed(1)}GB / {infrastructure?.memory?.capacity?.toFixed(1)}GB
            </Text>
          </div>
        )}
        <Button
          type="primary"
          icon={<AppstoreOutlined />}
          onClick={(e) => onApplicationsClick(infrastructure, e)}
          className="overview-infra-apps-btn"
        >
          Applications
        </Button>
      </Card>
    </div>
  );
};

export default InfrastructureCard;