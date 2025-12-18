import React from 'react';

import BasePage from '../core/base.page';
import ServiceMapContainer from '../../containers/service-map/service-map.container';

function ServiceMapPage() {

  return (
    <BasePage>
      <ServiceMapContainer /> 
    </BasePage>
  );
}

export default ServiceMapPage;