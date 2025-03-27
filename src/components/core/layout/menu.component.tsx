import React from 'react';
import { Menu } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { appRoutes } from '../../../routes';
import { AppRoute } from '@/interfaces';
import pluginJson from '../../../plugin.json';

export const PLUGIN_BASE_URL = `/a/${pluginJson.id}`;

const { SubMenu } = Menu as any;

const flattenRoutes = (routes: AppRoute[]): AppRoute[] => {
  return routes.flatMap((r) => (r.children ? [r, ...flattenRoutes(r.children)] : [r]));
};

const LayoutMenu = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const selectedKey = location.pathname;

  const renderMenu = (routes: AppRoute[]) =>
    routes
      .filter((r) => r.showInMenu)
      .map((route) => {
        if (route.children?.some((c) => c.showInMenu)) {
          return (
            <SubMenu key={route.name} title={route.title}>
              {renderMenu(route.children)}
            </SubMenu>
          );
        }
        return (
          <Menu.Item key={`/${route.path}`} onClick={() => navigate(`${PLUGIN_BASE_URL}/${route.path}`)}>
            {route.title}
          </Menu.Item>
        );
      });

  return (
    <Menu mode="horizontal" selectedKeys={[selectedKey]} className="menuContent" theme="light">
      {renderMenu(appRoutes)}
    </Menu>
  );
};

export default LayoutMenu;
