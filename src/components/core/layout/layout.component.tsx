import React from 'react';
import { Layout } from 'antd';
import './layout.component.css';
import Sidebar from './sidebar.component';
// import TabManager from './tab-manager.component';

const { Content } = Layout;

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sidebar></Sidebar>
      <Layout>
        {/* <Layout.Header style={{ height: 40, padding: 3, display: 'flex', alignItems: 'center', background: 'transparent' }}>
          <TabManager />
        </Layout.Header> */}
        <Content className="main-content">{children as any}</Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
