import React from 'react';
import { Layout, Menu, Image } from 'antd';
import { Outlet } from 'react-router-dom';
import logo from '../../../assets/logo.png';
import LayoutMenu from './menu.component';
import './layout.component.css';
const { Header, Content } = Layout;

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center' }}>
        <div className="logo">
          <Image src={logo} width={50}></Image>
          <span style={{ marginTop: 20 }}>IYZI TRACE</span>
        </div>

        <LayoutMenu />
      </Header>
      <Content className="main-content">
        {children}
        <Outlet />
      </Content>
    </Layout>
  );
};

export default MainLayout;
