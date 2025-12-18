import React from 'react';
import { Layout } from 'antd';
import './layout.component.css';
import Sidebar from './sidebar.component';

const { Content } = Layout;

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sidebar></Sidebar>
      <Layout>
        {
}
        <Content className="main-content">{children as any}</Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;