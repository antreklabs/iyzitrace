// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from 'react';

import BasePage from '../core/base.page';
import TraceContainer from '../../containers/trace/trace.container';

function TracesPage() {

  return (
    <BasePage>
      <TraceContainer />
    </BasePage>
  );
}

export default TracesPage;