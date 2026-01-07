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
    <div style={{ position: 'relative', width: '100%' }}>
      {showDropEffect && (
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '12px',
          border: '4px solid #52c41a',
          background: 'rgba(82, 196, 26, 0.15)',
          zIndex: 10,
          pointerEvents: 'none',
          animation: 'pulse 1.5s ease-in-out infinite',
        }} />
      )}
      <Card
        hoverable
        onClick={() => onClick(infrastructure)}
        onDrop={(e) => onDrop && onDrop(infrastructure, e)}
        onDragOver={(e) => onDragOver && onDragOver(e)}
        onDragEnter={(e) => onDragEnter && onDragEnter(infrastructure, e)}
        onDragLeave={(e) => onDragLeave && onDragLeave(infrastructure, e)}
        style={{
          borderRadius: '12px',
          background: gradient,
          color: 'white',
          border: isSelected ? '2px solid #1890ff' : 'none',
          boxShadow: isSelected
            ? '0 4px 16px rgba(24, 144, 255, 0.4)'
            : showDropEffect
              ? '0 8px 24px rgba(82, 196, 26, 0.6), 0 0 0 4px rgba(82, 196, 26, 0.2)'
              : '0 4px 12px rgba(0,0,0,0.1)',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          width: '100%',
          transform: showDropEffect ? 'scale(1.05)' : 'scale(1)',
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
              style={{ margin: '4px', width: '50%' }}
            />
            <Text style={{ color: 'white', fontSize: '12px' }}>{cpuPercentage?.toFixed(1)}%</Text>
          </div>
        )}
        {infrastructure.memory && (
          <div style={{ marginBottom: '16px' }}>
            <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px' }}>Memory</Text>
            <Progress
              percent={memoryPercentage}
              strokeColor={getProgressColor(memoryPercentage)}
              trailColor="rgba(255,255,255,0.3)"
              showInfo={false}
              style={{ margin: '4px', width: '50%' }}
            />
            <Text style={{ color: 'white', fontSize: '12px' }}>
              {infrastructure?.memory?.usage?.toFixed(1)}GB / {infrastructure?.memory?.capacity?.toFixed(1)}GB
            </Text>
          </div>
        )}
        <Button
          type="primary"
          icon={<AppstoreOutlined />}
          onClick={(e) => onApplicationsClick(infrastructure, e)}
          style={{
            width: '100%',
            background: 'rgba(255,255,255,0.2)',
            border: '1px solid rgba(255,255,255,0.3)',
            color: 'white',
            fontWeight: 600,
          }}
        >
          Applications
        </Button>
      </Card>
      <style>{`
      @keyframes pulse {
        0%, 100% {
          opacity: 1;
          transform: scale(1);
        }
        50% {
          opacity: 0.7;
          transform: scale(0.98);
        }
      }
    `}</style>
    </div>
  );
};

export default InfrastructureCard;