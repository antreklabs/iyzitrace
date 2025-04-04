// src/components/Sidebar.tsx

import React from 'react';
import { Layout, Menu, Space,Image } from 'antd';
import {
  BarChartOutlined,
  FileSearchOutlined,
  ProfileOutlined,
  AlertOutlined,
  ClusterOutlined,
  RadarChartOutlined,
  DeploymentUnitOutlined,
  SettingOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import logo from '../../../assets/logo.png';

const { Sider } = Layout;




const Sidebar: React.FC = ( ) => {
    //const [collapsed, setCollapsed] = React.useState(false);
  return (
    <Sider 
    breakpoint="lg" 
    collapsedWidth="80" 
     style={{ minHeight: '100vh' }} 
     collapsed={false}>
     <Space>
     <Image src={logo} width={50}></Image>
     </Space>
      <Menu
        theme="dark"
        mode="inline"
        defaultSelectedKeys={['services']}
        items={[
          {
            key: 'services',
            icon: <BarChartOutlined />,
            label: 'Services',
          },
          {
            key: 'traces',
            icon: <FileSearchOutlined />,
            label: 'Traces',
          },
          {
            key: 'logs',
            icon: <ProfileOutlined />,
            label: 'Logs',
          },
          {
            key: 'dashboards',
            icon: <ClusterOutlined />,
            label: 'Dashboards',
          },
          {
            key: 'alerts',
            icon: <AlertOutlined />,
            label: 'Alerts',
          },
          {
            key: 'exceptions',
            icon: <RadarChartOutlined />,
            label: 'Exceptions',
          },
          {
            key: 'service-map',
            icon: <DeploymentUnitOutlined />,
            label: 'Service Map',
          },
          {
            key: 'team',
            icon: <TeamOutlined />,
            label: 'Team',
          },
          {
            key: 'settings',
            icon: <SettingOutlined />,
            label: 'Settings',
          },
        ]}
      />
    </Sider>
  );
};

export default Sidebar;
