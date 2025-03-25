import React from 'react';
import { AppRootProps } from '@grafana/data';
import { themetoken } from '../../utils/index';
import MainLayout from 'components/core/layout/layout.component';
import { ConfigProvider } from 'antd';

function App(props: AppRootProps) {
  return (
    <ConfigProvider
      theme={themetoken}
    >
      <MainLayout>
        <textarea></textarea>
      </MainLayout>
    </ConfigProvider>
  );
}

export default App;
