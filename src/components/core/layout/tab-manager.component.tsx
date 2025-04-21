import React, { createElement, useEffect, useState, Suspense } from 'react';
import { Tabs } from 'antd';
import { useLocation, useNavigate, matchPath } from 'react-router-dom';
import { KeepAlive } from 'react-activation';
import { appRoutes } from '../../../routes';

const TabManager: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [tabs, setTabs] = useState<any[]>([]);
  const [activeKey, setActiveKey] = useState('');

  useEffect(() => {
    const key = `${location.pathname}${location.search}`;

    setTabs((prevTabs) => {
      const exists = prevTabs.find((t) => t.key === key);
      if (exists) {
        return prevTabs;
      }

      const matchedRoute = appRoutes.find((route) => matchPath({ path: route.path, end: false }, location.pathname));

      if (!matchedRoute) {
        return prevTabs;
      }

      const label = matchedRoute.title || 'Untitled';
      const element = matchedRoute.element;

      const newTab = {
        key,
        label,
        closable: key !== '/' && key !== '/home',
        element,
      };

      return [...prevTabs, newTab];
    });

    setActiveKey(key);
  }, [location]);

  const remove = (targetKey: string) => {
    setTabs((prev) => {
      const filtered = prev.filter((tab) => tab.key !== targetKey);
      if (targetKey === activeKey && filtered.length > 0) {
        navigate(filtered[filtered.length - 1].key);
      }
      return filtered;
    });
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
        if (action === 'remove') {
          remove(targetKey as string);
        }
      }}
      items={tabs.map((tab) => ({
        label: tab.label,
        key: tab.key,
        children: tab.element ? (
          <Suspense fallback={<div>Loading...</div>}>
            <KeepAlive id={tab.key}>
              {React.isValidElement(tab.element) ? tab.element : createElement(tab.element)}
            </KeepAlive>
          </Suspense>
        ) : (
          <div>Invalid route</div>
        ),
        closable: tab.closable,
      }))}
    />
  );
};

export default TabManager;
