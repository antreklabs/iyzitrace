import React from 'react';

import { PluginPage } from '@grafana/runtime';
import TraceContainer from '../../containers/TraceContainer/TraceContainer';
import { PageLayoutType } from '@grafana/data';

function Traces() {

  return (
    <PluginPage layout={PageLayoutType.Canvas}>
      <TraceContainer></TraceContainer>
    </PluginPage>
  );
}

export default Traces;