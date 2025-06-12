import React from 'react';

import { PluginPage } from '@grafana/runtime';
import ServiceMapContainer from '../containers/ServiceMap/ServiceMapContainer';
import { PageLayoutType } from '@grafana/data';

function ServiceMap() {

  return (
    <PluginPage layout={PageLayoutType.Canvas}>
      <ServiceMapContainer></ServiceMapContainer>
    </PluginPage>
  );
}

export default ServiceMap;