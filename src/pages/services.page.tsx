import React from 'react';
import { PageLayoutType } from '@grafana/data';
import { PluginPage } from '@grafana/runtime';
import ServicesContainer from '../containers/ServicesContainer/ServicesContainer';


function ServicesPage() {

  return (
    <PluginPage layout={PageLayoutType.Canvas}>
      <ServicesContainer></ServicesContainer>
    </PluginPage>
  );
}

export default ServicesPage;

