import React from 'react';

import BasePage from '../core/base.page';
// import TraceContainerOld from '../../containers/trace/trace.container.old';
import TraceContainer from '../../containers/trace/trace.container';

function TracesPage() {

  return (
    <BasePage>
      <TraceContainer />
    </BasePage>
  );
}

export default TracesPage;