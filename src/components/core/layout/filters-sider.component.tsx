import React from 'react';
import { Layout, Button, Typography } from 'antd';
import '../../../assets/styles/containers/trace-detail/trace-detail.css';

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
      className="filters-sider-bg"
      collapsedWidth={0}
      collapsed={collapsed}
    >
      <Button
        type="primary"
        icon={collapsed ? <i className="fa fa-angle-right" /> : <i className="fa fa-angle-left" />}
        onClick={onToggle}
        className={`filters-sider-toggle-btn ${collapsed ? 'filters-sider-toggle-btn-collapsed' : 'filters-sider-toggle-btn-expanded'}`}
      />
      <Title level={5} className="filters-sider-title">
        {title}
      </Title>
      <div className="filters-sider-content">
        {children}
      </div>
    </Sider>
  );
};

export default FiltersSider;