import React, { useEffect } from 'react';
import { Tabs } from 'antd';
import { matchPath, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { appRoutes } from '../../../routes';
import { RootState } from '../../../store/rootReducer';
import { addTab, removeTab, setActiveKey } from '../../../store/slices/tab.slice';

const TabManager: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const tabs = useSelector((state: RootState) => state.tabSlice.tabs);
  const activeKey = useSelector((state: RootState) => state.tabSlice.activeKey);

  const normalizePath = (pathname: string) => {
    const basePath = '/a/iyzitrace-app';
    return pathname.startsWith(basePath) ? pathname.replace(basePath, '') || '/' : pathname;
  };

  useEffect(() => {
    const currentFullPath = location.pathname + location.search;
    const currentPath = normalizePath(location.pathname);

    let matchedRoute = null;
    let matchedParams = null;

    for (const route of appRoutes) {
      const match = matchPath({ path: route.path, end: false }, currentPath);
      if (match) {
        matchedRoute = route;
        matchedParams = match.params;
        break;
      }
    }

    if (matchedRoute) {
      const exists = tabs.find((tab) => tab.key === currentFullPath);
      if (!exists) {
        let label = matchedRoute.title;
        if (matchedParams && Object.keys(matchedParams).length > 0) {
          const paramString = Object.values(matchedParams).join(' / ');
          label = `${matchedRoute.title} (${paramString})`;
        }

        dispatch(addTab({
          key: currentFullPath,
          label,
          closable: currentFullPath !== '/a/iyzitrace-app/',
        }));
      }
      dispatch(setActiveKey(currentFullPath));
    }
  }, [location]);

  const handleRemove = (targetKey: string) => {
    dispatch(removeTab(targetKey));
    if (targetKey === activeKey) {
      const remaining = tabs.filter(t => t.key !== targetKey);
      if (remaining.length > 0) {
        navigate(remaining[remaining.length - 1].key);
      }
    }
  };

  return (
    <Tabs
      type="editable-card"
      hideAdd
      activeKey={activeKey}
      onChange={(key) => {
        dispatch(setActiveKey(key));
        navigate(key);
      }}
      onEdit={(targetKey, action) => {
        if (action === 'remove' && targetKey !== '/a/iyzitrace-app/') {
          handleRemove(targetKey as string);
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
