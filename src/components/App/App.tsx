import React, { useEffect } from 'react';
import { AppRootProps } from '@grafana/data';
import { themetoken } from '../../utils/index';
import MainLayout from 'components/core/layout/layout.component';
import { ConfigProvider } from 'antd';
import AppRoutes from '../../routes/AppRoutes';
import '../../assets/styles/global.css';
import '../../styles/hide-tabs.css';
import { Provider } from 'react-redux';
import store, { persistor } from '../../store/store';
import { AliveScope } from 'react-activation';
import TempoInitializer from './TempoInıt';
import { PersistGate } from 'redux-persist/integration/react';

function App(props: AppRootProps) {
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Quicksand:wght@400;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    // Hide Grafana tabs
    const hideTabs = () => {
      const tabSelectors = [
        '.grafana-app-tabs',
        '.grafana-app-tabs-container',
        '[data-testid="tabs"]',
        '.tabs-container',
        '.page-tabs',
        '.page-tabs-container',
        '.navbar-page-btn',
        '.navbar-page-btn--active',
        '.page-tabs__tabs',
        '.page-tabs__tabs-list'
      ];

      tabSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
          (element as HTMLElement).style.display = 'none';
        });
      });
    };

    // Hide tabs immediately and on DOM changes
    hideTabs();
    
    // Use MutationObserver to hide tabs when they're added dynamically
    const observer = new MutationObserver(hideTabs);
    observer.observe(document.body, { 
      childList: true, 
      subtree: true 
    });

    return () => observer.disconnect();
  }, []);
  return (
    <React.StrictMode>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <ConfigProvider theme={themetoken}>
            <AliveScope>
              <TempoInitializer></TempoInitializer>
              <MainLayout>
                <AppRoutes />
              </MainLayout>
            </AliveScope>
          </ConfigProvider>
        </PersistGate>
      </Provider>
    </React.StrictMode>
  );
}

export default App;
