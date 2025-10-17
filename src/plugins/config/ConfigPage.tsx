import React from 'react';
import { AppPluginMeta, PluginConfigPageProps } from '@grafana/data';
import ConfigForm from './ConfigForm';

type Options = { jsonData: any; secureJsonData?: any; secureJsonFields?: Record<string, boolean> };

export const ConfigPage: React.FC<PluginConfigPageProps<AppPluginMeta<Options>>> = () => {
  return <ConfigForm />;
};

export default ConfigPage;


