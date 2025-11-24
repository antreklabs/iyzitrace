// src/components/Sidebar.tsx

import React from 'react';
import { Layout, Menu, Button } from 'antd';
import {
  BarChartOutlined,
  FileSearchOutlined,
  ProfileOutlined,
  ClusterOutlined,
  RadarChartOutlined,
  SettingOutlined,
  TeamOutlined,
  DeploymentUnitOutlined,
  HomeOutlined,
  BuildOutlined,
  MenuOutlined,
  RobotOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import pluginJson from '../../../plugin.json';

export const PLUGIN_BASE_URL = `/a/${pluginJson.id}`;
const { Sider } = Layout;

const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = React.useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const handleMenuClick = (e: any) => {
    navigate(`${PLUGIN_BASE_URL}/${e.key}`);
  };

  const currentKey = location.pathname.split('/').pop();

  return (
    <Sider
      width={220}
      collapsedWidth={80}
      collapsed={collapsed}
      onCollapse={setCollapsed}
      style={{
        minHeight: '100vh',
        backgroundColor: '#141414',
        padding: '16px 0',
        boxShadow: '2px 0 8px rgba(0,0,0,0.15)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '20px',
          marginBottom: 24,
          justifyContent: 'flex-end',
        }}
      >
        <Button
          type="default"
          icon={<MenuOutlined style={{ fontSize: 12, color: '#ffffff' }} />}
          onClick={() => setCollapsed(!collapsed)}
          style={{
            color: '#ffffff',
            backgroundColor: '#C75A2B',
            width: 32,
            height: 32,
            borderRadius: 12,
            boxShadow: '0 4px 12px rgba(0,0,0,0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        />
      </div>

      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[currentKey || 'landing']}
        onClick={handleMenuClick}
        style={{
          borderRight: 0,
          background: 'transparent',
        }}
        items={[
          { key: 'landing', icon: <HomeOutlined style={{ fontSize: 16 }} />, label: 'Home' },
          { key: 'overview', icon: <BuildOutlined style={{ fontSize: 16 }} />, label: 'Overview' },
          { key: 'service-map', icon: <DeploymentUnitOutlined style={{ fontSize: 16 }} />, label: 'Service Map' },
          { key: 'services', icon: <BarChartOutlined style={{ fontSize: 16 }} />, label: 'Services' },  
          { key: 'traces', icon: <FileSearchOutlined style={{ fontSize: 16 }} />, label: 'Traces' },
          { key: 'logs', icon: <ProfileOutlined style={{ fontSize: 16 }} />, label: 'Logs' },
          { key: 'views', icon: <ClusterOutlined style={{ fontSize: 16 }} />, label: 'Views' },
          { key: 'ai', icon: <RobotOutlined style={{ fontSize: 16 }} />, label: 'AI Assistant' },
          { key: 'exceptions', icon: <RadarChartOutlined style={{ fontSize: 16 }} />, label: 'Exceptions' },
          { key: 'teams', icon: <TeamOutlined style={{ fontSize: 16 }} />, label: 'Teams' },
          { key: 'settings', icon: <SettingOutlined style={{ fontSize: 16 }} />, label: 'Settings' },
        ]}
      />
    </Sider>
  );
};

export default Sidebar;
