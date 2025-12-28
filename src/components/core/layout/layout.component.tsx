import React from 'react';
import { Layout } from 'antd';
import '../../../assets/styles/components/core/layout/index.css';
import Sidebar from './sidebar.component';

const { Content } = Layout;

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <Layout className="main-layout">
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