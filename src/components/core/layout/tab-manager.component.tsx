import React, { useEffect, useState } from 'react';
import { Tabs } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import { appRoutes } from '../../../routes';

const TabManager: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [tabs, setTabs] = useState<any[]>([
    {
      key: '/a/easytrace-test-app/',
      label: 'Dashboard',
      closable: false,
    },
  ]);
  const [activeKey, setActiveKey] = useState('/a/easytrace-test-app/');

  // Path normalize fonksiyonu
  const normalizePath = (pathname: string) => {
    const basePath = '/a/easytrace-test-app';
    return pathname.startsWith(basePath) ? pathname.replace(basePath, '') || '/' : pathname;
  };

  useEffect(() => {
    const currentPath = normalizePath(location.pathname);
    const currentFullPath = location.pathname + location.search;

    // Route bilgilerini bul
    const matchedRoute = appRoutes.find((route) => {
      const normalizedRoute = route.path.startsWith('/') ? route.path : `/${route.path}`;
      return normalizedRoute === currentPath;
    });

    if (matchedRoute) {
      const existingTab = tabs.find((tab) => tab.key === currentFullPath);
      if (!existingTab) {
        setTabs((prev) => [
          ...prev,
          {
            key: currentFullPath,
            label: matchedRoute.title,
            closable: currentFullPath !== '/a/easytrace-test-app/',
          },
        ]);
      }
      setActiveKey(currentFullPath);
    }
  }, [location]);

  const remove = (targetKey: string) => {
    const filtered = tabs.filter((tab) => tab.key !== targetKey);
    setTabs(filtered);

    if (targetKey === activeKey && filtered.length) {
      navigate(filtered[filtered.length - 1].key);
    }
  };

  return (
    <Tabs
      type="editable-card"
      hideAdd
      activeKey={activeKey}
      onChange={(key) => {
        setActiveKey(key);
        navigate(key);
      }}
      onEdit={(targetKey, action) => {
        if (action === 'remove' && targetKey !== '/a/easytrace-test-app/') {
          remove(targetKey as string);
        }
      }}
      items={tabs.map((tab) => ({
        label: tab.label,
        key: tab.key,
        closable: tab.closable,
      }))}
    />
  );
};

export default TabManager;
