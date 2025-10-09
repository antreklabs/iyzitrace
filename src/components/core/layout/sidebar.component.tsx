// src/components/Sidebar.tsx

import React from 'react';
import { Layout, Menu, Button } from 'antd';
import {
  BarChartOutlined,
  FileSearchOutlined,
  ProfileOutlined,
  AlertOutlined,
  ClusterOutlined,
  RadarChartOutlined,
  SettingOutlined,
  TeamOutlined,
  DeploymentUnitOutlined
} from '@ant-design/icons';
import { FaChevronCircleLeft, FaChevronCircleRight } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
import pluginJson from '../../../plugin.json';

export const PLUGIN_BASE_URL = `/a/${pluginJson.id}`;
const { Sider } = Layout;

const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = React.useState(false);
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
          type="text"
          icon={
            collapsed ? (
              <FaChevronCircleRight style={{ fontSize: 20 }} />
            ) : (
              <FaChevronCircleLeft style={{ fontSize: 20 }} />
            )
          }
          onClick={() => setCollapsed(!collapsed)}
          style={{
            color: 'rgb(255 255 255)',
          }}
        />
      </div>

      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[currentKey || 'services-v2']}
        onClick={handleMenuClick}
        style={{
          borderRight: 0,
          background: 'transparent',
        }}
        items={[
          { key: 'services', icon: <BarChartOutlined style={{ fontSize: 16 }} />, label: 'Services' },
          { key: 'services-v2', icon: <BarChartOutlined style={{ fontSize: 16 }} />, label: 'Services v2' },  
          { key: 'traces', icon: <FileSearchOutlined style={{ fontSize: 16 }} />, label: 'Traces' },
          { key: 'traces-v2', icon: <FileSearchOutlined style={{ fontSize: 16 }} />, label: 'Traces v2' },
          { key: 'logs', icon: <ProfileOutlined style={{ fontSize: 16 }} />, label: 'Logs' },
          { key: 'logs-v2', icon: <ProfileOutlined style={{ fontSize: 16 }} />, label: 'Logs v2' },
          // { key: 'logs-pipelines', icon: <SettingOutlined style={{ fontSize: 16 }} />, label: 'Logs Pipelines' },
          { key: 'dashboards', icon: <ClusterOutlined style={{ fontSize: 16 }} />, label: 'Dashboards' },
          { key: 'alerts', icon: <AlertOutlined style={{ fontSize: 16 }} />, label: 'Alerts' },
          { key: 'exceptions', icon: <RadarChartOutlined style={{ fontSize: 16 }} />, label: 'Exceptions' },
          { 
            key: 'service-map', 
            icon: <DeploymentUnitOutlined style={{ fontSize: 16 }} />, 
            label: 'Service Map'
          },
          { key: 'team', icon: <TeamOutlined style={{ fontSize: 16 }} />, label: 'Team' },
          { key: 'settings', icon: <SettingOutlined style={{ fontSize: 16 }} />, label: 'Settings' },
        ]}
      />
    </Sider>
  );
};

export default Sidebar;
