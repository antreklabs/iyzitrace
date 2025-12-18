import React from 'react';
import { Card, Badge } from 'antd';
import { CloudOutlined } from '@ant-design/icons';
import { Region } from '../../api/service/interface.service';

interface RegionCardProps {
  region: Region;
  onClick: (region: Region) => void;
  isSelected: boolean;
}

const RegionCard: React.FC<RegionCardProps> = ({ region, onClick, isSelected }) => {
  const getStatusText = (status?: string) => {
    return status?.charAt(0).toUpperCase() + status?.slice(1).toLowerCase() || 'Unknown';
  };

  const statusValue = region.status?.value || 'unknown';

  return (
    <Card
      hoverable
      onClick={() => onClick(region)}
      style={{
        cursor: 'pointer',
        border: isSelected ? '2px solid #1890ff' : '1px solid #f0f0f0',
        borderRadius: '8px',
        boxShadow: isSelected ? '0 4px 12px rgba(24, 144, 255, 0.2)' : '0 2px 8px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.3s ease',
        background: isSelected ? '#1890ff' : 'white',
        height: '100%',
        width: '100%',
      }}
      bodyStyle={{ padding: '20px' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <CloudOutlined style={{ fontSize: '32px', color: isSelected ? 'white' : '#1890ff' }} />
        <div style={{ flex: 1 }}>
          <div style={{ 
            fontWeight: 700, 
            fontSize: '18px', 
            marginBottom: '6px',
            color: isSelected ? 'white' : '#000',
            letterSpacing: '0.3px',
          }}>
            {region.name}
          </div>
          <Badge 
            status={statusValue === 'healthy' ? 'success' : statusValue === 'warning' ? 'warning' : statusValue === 'degraded' ? 'processing' : 'error'} 
            text={<span style={{ color: isSelected ? 'white' : '#000', fontWeight: 500, fontSize: '14px' }}>{getStatusText(statusValue)}</span>}
          />
        </div>
      </div>
    </Card>
  );
};

export default RegionCard;