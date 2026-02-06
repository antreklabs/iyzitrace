
import React, { useEffect, useState } from 'react';
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
  ApiOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { getStoredTeamPages } from '../../../api/service/team.service';
import pluginJson from '../../../plugin.json';
import '../../../assets/styles/components/core/layout/sidebar.css';

export const PLUGIN_BASE_URL = `/a/${pluginJson.id}`;
const { Sider } = Layout;

const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = React.useState(true);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const navigate = useNavigate();
  const location = useLocation();

  const user = { role: 'user' };
  const teamId = '1';

  useEffect(() => {
    const fetchMenuItems = async () => {
      const allMenuItems = [
        { key: 'landing', icon: <HomeOutlined className="sidebar-menu-icon" />, label: 'Home' },
        { key: 'overview', icon: <BuildOutlined className="sidebar-menu-icon" />, label: 'Overview' },
        { key: 'views', icon: <ClusterOutlined className="sidebar-menu-icon" />, label: 'Views' },
        { key: 'service-map', icon: <DeploymentUnitOutlined className="sidebar-menu-icon" />, label: 'Service Map' },
        { key: 'services', icon: <BarChartOutlined className="sidebar-menu-icon" />, label: 'Services' },
        { key: 'traces', icon: <FileSearchOutlined className="sidebar-menu-icon" />, label: 'Traces' },
        { key: 'logs', icon: <ProfileOutlined className="sidebar-menu-icon" />, label: 'Logs' },
        { key: 'exceptions', icon: <RadarChartOutlined className="sidebar-menu-icon" />, label: 'Exceptions' },
        { key: 'ai', icon: <RobotOutlined className="sidebar-menu-icon" />, label: 'AI Assistant' },
        { key: 'teams', icon: <TeamOutlined className="sidebar-menu-icon" />, label: 'Teams' },
        { key: 'settings', icon: <SettingOutlined className="sidebar-menu-icon" />, label: 'Settings' },
        { type: 'divider' },
        {
          key: 'agent-manager',
          icon: <ApiOutlined className="sidebar-menu-icon" />,
          label: 'Agent Manager',
        },
        {
          key: 'inventory-manager',
          icon: <ClusterOutlined className="sidebar-menu-icon" />,
          label: 'Inventory Manager',
        },
      ];

      if (user.role === 'admin') {
        setMenuItems(allMenuItems);
        return;
      }

      const pages = await getStoredTeamPages();
      if (!pages || pages.length === 0) {
        setMenuItems(allMenuItems);
        return;
      }
      const allowed = pages.filter((p: { teamId: string }) => p.teamId === teamId);
      if (allowed.length === 0) {
        setMenuItems(allMenuItems);
        return;
      }
      const allowedKeys = allowed.map((p: { id: string }) => p.id);
      setMenuItems(allMenuItems.filter(item => allowedKeys.includes(item.key)));
    };
    fetchMenuItems();
  }, [teamId, user.role]);

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
      className="sidebar-container"
    >
      <div className="sidebar-header">
        <Button
          type="default"
          icon={<MenuOutlined className="sidebar-toggle-icon" />}
          onClick={() => setCollapsed(!collapsed)}
          className="sidebar-toggle-btn"
        />
      </div>

      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[currentKey || 'landing']}
        onClick={handleMenuClick}
        className="sidebar-menu"
        items={menuItems}
      />
    </Sider>
  );
};

export default Sidebar;