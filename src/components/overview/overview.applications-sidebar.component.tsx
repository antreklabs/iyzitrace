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
        <div className="overview-apps-drawer-title">
          <AppstoreOutlined className="overview-apps-drawer-title-icon" />
          <span>Applications Layer</span>
        </div>
      }
      placement="right"
      onClose={onClose}
      open={visible}
      width={400}
      styles={{
        header: {
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border-color)',
        },
        body: {
          padding: 0,
          background: 'var(--bg-secondary)',
        },
      }}
      closeIcon={<span className="overview-apps-close-icon">✕</span>}
    >
      <List
        dataSource={applications}
        renderItem={(application) => {
          const statusValue = application.status?.value || 'unknown';
          const isSelected = selectedApplicationId === application.id;
          return (
            <List.Item
              className="overview-sidebar-item"
              style={{
                background: isSelected ? '#1890ff' : 'var(--bg-tertiary)',
                borderLeft: isSelected ? '3px solid #40a9ff' : '3px solid transparent',
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.background = 'var(--bg-hover)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.background = 'var(--bg-tertiary)';
                }
              }}
            >
              <List.Item.Meta
                avatar={
                  <div className="overview-apps-platform-icon">
                    {getPlatformIcon(application.platform)}
                  </div>
                }
                title={
                  <div className="overview-apps-item-title">
                    <Text strong className={isSelected ? 'overview-card-text-selected' : 'overview-card-text-unselected'}>
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
                        <span className={isSelected ? 'overview-card-metric-val-selected' : 'overview-card-metric-val-unselected'}>
                          {getStatusText(statusValue)}
                        </span>
                      }
                    />
                  </div>
                }
                description={
                  <div
                    className={`overview-apps-item-desc ${isSelected ? 'overview-card-subtext-selected' : 'overview-card-subtext-unselected'}`}
                  >
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