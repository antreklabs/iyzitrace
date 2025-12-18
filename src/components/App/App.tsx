import React, { useEffect } from 'react';
import { AppRootProps } from '@grafana/data';
import { themetoken } from '../../utils/index';
import MainLayout from 'components/core/layout/layout.component';
import { ConfigProvider, App as AntdApp } from 'antd';
import AppRoutes from '../../routes/app-routes';
import '../../assets/styles/global.css';
import { Provider } from 'react-redux';
import store, { persistor } from '../../store/store';
import { AliveScope } from 'react-activation';
import { PersistGate } from 'redux-persist/integration/react';

function App(props: AppRootProps) {
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Quicksand:wght@400;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

  }, []);
  return (
    <React.StrictMode>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <ConfigProvider theme={themetoken}>
            <AntdApp>
              <AliveScope>
                <MainLayout>
                  <AppRoutes />
                </MainLayout>
              </AliveScope>
            </AntdApp>
          </ConfigProvider>
        </PersistGate>
      </Provider>
    </React.StrictMode>
  );
}

export default App;