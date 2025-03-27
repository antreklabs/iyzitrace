import React from 'react';
import { AppRootProps } from '@grafana/data';
import { themetoken } from '../../utils/index';
import MainLayout from 'components/core/layout/layout.component';
import { ConfigProvider } from 'antd';
import { MemoryRouter } from 'react-router-dom';
import AppRoutes from '../../routes/AppRoutes';

function App(props: AppRootProps) {
  return (
    <ConfigProvider theme={themetoken}>
    <MemoryRouter>
      <MainLayout>
        <AppRoutes />
      </MainLayout>
    </MemoryRouter>
  </ConfigProvider>
  );
}

export default App;
