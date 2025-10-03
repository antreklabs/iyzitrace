import React from 'react';
import { PluginPage } from '@grafana/runtime';
import { PageLayoutType } from '@grafana/data';

interface BasePageProps {
  children?: React.ReactNode;
  layout?: PageLayoutType;
}

const BasePage: React.FC<BasePageProps> = ({ children, layout = PageLayoutType.Canvas }) => {
  return (
    <PluginPage layout={layout}>
      {children}
    </PluginPage>
  );
};

export default BasePage;


