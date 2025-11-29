import React from 'react';
import { Drawer, List, Badge, Typography } from 'antd';
import { AppstoreOutlined } from '@ant-design/icons';
import { Application } from '../../api/service/interface.service';

const { Text } = Typography;

interface ApplicationsSidebarProps {
  visible: boolean;
  onClose: () => void;
  applications: Application[];
  selectedApplicationId: string | null;
}

const ApplicationsSidebar: React.FC<ApplicationsSidebarProps> = ({
  visible,
  onClose,
  applications,
  selectedApplicationId,
}) => {
  const getStatusText = (status?: string) => {
    return status?.charAt(0).toUpperCase() + status?.slice(1).toLowerCase() || 'Unknown';
  };

  const getPlatformIcon = (platform: string) => {
    const platformLower = platform?.toLowerCase() || '';
    if (platformLower.includes('java') || platformLower.includes('jdk')) {
      return '☕';
    } else if (platformLower.includes('.net') || platformLower.includes('dotnet')) {
      return '🪟';
    } else if (platformLower.includes('python')) {
      return '🐍';
    } else if (platformLower.includes('node')) {
      return '🟢';
    } else if (platformLower.includes('go')) {
      return '🔷';
    } else if (platformLower.includes('ruby')) {
      return '💎';
    } else if (platformLower.includes('php')) {
      return '🐘';
    }
    return '📦';
  };

  return (
    <Drawer
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'white' }}>
          <AppstoreOutlined style={{ color: '#1890ff' }} />
          <span>Applications Layer</span>
        </div>
      }
      placement="right"
      onClose={onClose}
      open={visible}
      width={400}
      styles={{
        header: { 
          background: '#1f1f1f',
          borderBottom: '1px solid #333',
        },
        body: { 
          padding: 0,
          background: '#1f1f1f',
        },
      }}
      closeIcon={<span style={{ color: 'white', fontSize: '16px' }}>✕</span>}
    >
      <List
        dataSource={applications}
        renderItem={(application) => {
          const statusValue = application.status?.value || 'unknown';
          return (
            <List.Item
              style={{
                cursor: 'pointer',
                padding: '16px 24px',
                background: selectedApplicationId === application.id ? '#1890ff' : '#2a2a2a',
                borderLeft: selectedApplicationId === application.id ? '3px solid #40a9ff' : '3px solid transparent',
                transition: 'all 0.3s ease',
                borderBottom: '1px solid #333',
              }}
              onMouseEnter={(e) => {
                if (selectedApplicationId !== application.id) {
                  e.currentTarget.style.background = '#333';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedApplicationId !== application.id) {
                  e.currentTarget.style.background = '#2a2a2a';
                }
              }}
            >
              <List.Item.Meta
                avatar={
                  <div style={{ fontSize: '32px' }}>
                    {getPlatformIcon(application.platform)}
                  </div>
                }
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Text strong style={{ color: selectedApplicationId === application.id ? 'white' : '#e8e8e8' }}>
                      {application.name}
                    </Text>
                    <Badge
                      status={
                        statusValue === 'healthy'
                          ? 'success'
                          : statusValue === 'warning'
                          ? 'warning'
                          : statusValue === 'degraded'
                          ? 'processing'
                          : 'error'
                      }
                      text={
                        <span style={{ color: selectedApplicationId === application.id ? 'white' : '#b8b8b8' }}>
                          {getStatusText(statusValue)}
                        </span>
                      }
                    />
                  </div>
                }
                description={
                  <div style={{ 
                    fontSize: '12px', 
                    color: selectedApplicationId === application.id ? 'rgba(255,255,255,0.8)' : '#8c8c8c'
                  }}>
                    <div>{application.platform}</div>
                    <div>Version: {application.version}</div>
                  </div>
                }
              />
            </List.Item>
          );
        }}
      />
    </Drawer>
  );
};

export default ApplicationsSidebar;

