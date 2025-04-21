import React from 'react';
import { Layout } from 'antd';
//import { Outlet } from 'react-router-dom';
import './layout.component.css';
import Sidebar from './sidebar.component';
import TabManager from './tab-manager.component';

const { Content } = Layout;

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sidebar></Sidebar>
      <Layout>
        <Layout.Header
          style={{
            background: 'transparent',
            height: '48px',
            padding: '0 16px',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            display: 'flex',
            alignItems: 'center',
            zIndex: 10,
          }}
        >
          <TabManager />
        </Layout.Header>

        <Content className="main-content">{children}</Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
