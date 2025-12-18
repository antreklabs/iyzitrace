import React from 'react';
import { Card } from 'antd';

import '../../../assets/styles/base/basecontainer.component.css';
import BaseContainerHeader from './basecontainerheader.component';

interface BaseConatinerProps {
  title: string;
  children?: React.ReactNode;
  showHeaderActions?: boolean;
}

const BaseContainer: React.FC<BaseConatinerProps> = ({ title, children, showHeaderActions = true }) => {
  const resolvedPageName = (() => {
    try {
      const path = (window.location.pathname || '').replace(/\/+$/, '');
      const last = path.split('/').filter(Boolean).pop() || '';
      return last;
    } catch {
      return undefined;
    }
  })();
  return (
    <Card title={<BaseContainerHeader title={title} pageName={resolvedPageName ?? undefined} showHeaderActions={showHeaderActions} />} 
          className="base-container" 
          styles={{ body: { overflow: 'auto' } }}>
      {children as any}
    </Card>
  );
};

export default BaseContainer;