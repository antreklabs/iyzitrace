import React, { useState } from 'react';
import { Layout} from 'antd';
//import { Outlet } from 'react-router-dom';
import './layout.component.css';
import Sidebar from './sidebar.component';

const { Content, Header } = Layout;

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sidebar></Sidebar>
      <Layout>
        <Content className="main-content">{children}</Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
