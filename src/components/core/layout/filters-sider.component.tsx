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
    <Sider width={width} style={{ background: '#1f1f1f', padding: 16 }} collapsedWidth={0} collapsed={collapsed}>
      <Button
        type="primary"
        icon={collapsed ? <i className="fa fa-angle-right" /> : <i className="fa fa-angle-left" />}
        onClick={onToggle}
        style={{ marginBottom: 16, color: '#fff', position: 'absolute', top: 16, right: collapsed ? -15 : 16 }}
      />
      <Title level={5} style={{ color: '#fff' }}>
        {title}
      </Title>
      {children}
    </Sider>
  );
};

export default FiltersSider;


