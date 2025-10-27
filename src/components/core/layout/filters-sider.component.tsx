import React from 'react';
import { Layout, Button, Typography } from 'antd';

const { Sider } = Layout;
const { Title } = Typography;

interface FiltersSiderProps {
  title?: string;
  width?: number;
  collapsed: boolean;
  onToggle: () => void;
  children?: React.ReactNode;
}

const FiltersSider: React.FC<FiltersSiderProps> = ({
  title = 'Filters',
  width = 300,
  collapsed,
  onToggle,
  children,
}) => {
  return (
    <Sider 
      width={width} 
      style={{ 
        background: '#1f1f1f', 
        padding: 25,
        top: 0,
        marginBottom: '16px',
        position: 'sticky',
        zIndex: 10,
      }} 
      collapsedWidth={0} 
      collapsed={collapsed}
    >
      <Button
        type="primary"
        icon={collapsed ? <i className="fa fa-angle-right" /> : <i className="fa fa-angle-left" />}
        onClick={onToggle}
        style={{ marginBottom: 16, color: '#fff', position: 'absolute', top: 16, right: collapsed ? -15 : 16 }}
      />
      <Title level={5} style={{ color: '#fff' }}>
        {title}
      </Title>
      <div style={{ height: 'calc(100vh - 220px)', overflowY: 'auto' }}>
        {children}
      </div>
    </Sider>
  );
};

export default FiltersSider;


