
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
import '../../../assets/styles/components/core/layout/sidebar.styles';
import { useTheme } from '../../../contexts/ThemeContext';

export const PLUGIN_BASE_URL = `/a/${pluginJson.id}`;
const { Sider } = Layout;

// Sun icon for light mode
const SunIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

// Moon icon for dark mode
const MoonIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = React.useState(true);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();

  const user = { role: 'user' };
  const teamId = '1';

  useEffect(() => {
    const fetchMenuItems = async () => {
      const allMenuItems = [
        { key: 'landing', icon: <HomeOutlined className="sidebar-menu-icon" />, label: 'Home' },
        { key: 'overview', icon: <BuildOutlined className="sidebar-menu-icon" />, label: 'Overview' },
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
        theme={isDark ? 'dark' : 'light'}
        mode="inline"
        selectedKeys={[currentKey || 'landing']}
        onClick={handleMenuClick}
        className="sidebar-menu"
        items={menuItems}
      />

      {/* Theme toggle pinned to bottom */}
      <div className="sidebar-theme-toggle" onClick={toggleTheme}>
        <div className="sidebar-theme-toggle-icon">
          {isDark ? <SunIcon /> : <MoonIcon />}
        </div>
        {!collapsed && (
          <span className="sidebar-theme-toggle-label">
            {isDark ? 'Light Mode' : 'Dark Mode'}
          </span>
        )}
      </div>
    </Sider>
  );
};

export default Sidebar;