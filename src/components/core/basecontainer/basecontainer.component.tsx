import React from 'react';
import { Card } from 'antd';

import '../../../assets/styles/base/basecontainer.component.css';
import BaseContainerHeader from './basecontainerheader.component';

interface BaseConatinerProps {
  title: string;
  headerActions?: React.ReactNode;
  children?: React.ReactNode;
  datasourceType?: 'tempo' | 'loki';
}

const BaseContainer: React.FC<BaseConatinerProps> = ({ title, headerActions, children, datasourceType }) => {
  return (
    <Card 
      title={<BaseContainerHeader title={title} headerActions={headerActions} datasourceType={datasourceType} />} 
      style={{
        height: 'calc(100vh - 75px)'
      }} 
      className="base-container" 
      styles={{
        body: {
          height: 'calc(100vh - 75px)', 
          overflow: 'auto'
        }
      }}
    >
      {children as any}
    </Card>
  );
};

export default BaseContainer;
