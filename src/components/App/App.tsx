import React, { useEffect } from 'react';
import { AppRootProps } from '@grafana/data';
import { themetoken } from '../../utils/index';
import MainLayout from 'components/core/layout/layout.component';
import { ConfigProvider } from 'antd';
import AppRoutes from '../../routes/AppRoutes';
import '../../assets/global.css';

function App(props: AppRootProps) {
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Quicksand:wght@400;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }, []);
  return (
    <ConfigProvider theme={themetoken}>
      <MainLayout>
        <AppRoutes />
      </MainLayout>

  </ConfigProvider>
  );
}

export default App;
