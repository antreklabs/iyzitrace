import React from 'react';
import { Card } from 'antd';

import '../../../assets/styles/base/basecontainer.component.css';
import BaseContainerHeader from './basecontainerheader.component';

interface BaseConatinerProps {
  title: string;
  datasourceType?: string;
  children?: React.ReactNode;
  headerActions?: React.ReactNode;
}

const BaseContainer: React.FC<BaseConatinerProps> = ({ title, datasourceType, children, headerActions }) => {
  if (datasourceType === undefined) {
    return (
      <Card style={{ height: 'calc(100vh - 75px)' }} 
            className="base-container" 
            styles={{ body: { height: 'calc(100vh - 75px)',  overflow: 'auto' } }}>
        {children as any}
      </Card>
    );
  }
  return (
    <Card title={<BaseContainerHeader title={title} datasourceType={datasourceType} />} 
          style={{ height: 'calc(100vh - 75px)' }} 
          className="base-container" 
          styles={{ body: { height: 'calc(100vh - 75px)',  overflow: 'auto' } }}>
      {children as any}
    </Card>
  );
};

export default BaseContainer;
