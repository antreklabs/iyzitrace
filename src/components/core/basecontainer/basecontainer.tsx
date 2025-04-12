import React from 'react';
import { Card } from 'antd';

import './Basecontainer.css';
import BaseContainerHeader from './basecontainerheader';

interface BaseConatinerProps {
  title: string;
  headerActions?: React.ReactNode;
  children?: React.ReactNode;
}

const BaseContainer: React.FC<BaseConatinerProps> = ({ title, headerActions, children }) => {
  return (
    <Card title={<BaseContainerHeader title={title} headerActions={headerActions} />} style={{
        height: 'calc(100vh - 75px)'
    }} className="base-container">
      {children}
    </Card>
  );
};

export default BaseContainer;
