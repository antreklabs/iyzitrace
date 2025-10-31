import React from 'react';
import { Card } from 'antd';

import '../../../assets/styles/base/basecontainer.component.css';
import BaseContainerHeader from './basecontainerheader.component';

interface BaseConatinerProps {
  title: string;
  pageName: string;
  children?: React.ReactNode;
}

const BaseContainer: React.FC<BaseConatinerProps> = ({ title, pageName, children }) => {
  return (
    <Card title={<BaseContainerHeader title={title} pageName={pageName} />} 
          style={{ height: 'calc(100vh)' }} 
          className="base-container" 
          styles={{ body: { overflow: 'auto' } }}>
      {children as any}
    </Card>
  );
};

export default BaseContainer;
