import React from 'react';

import { PluginPage } from '@grafana/runtime';

import { PageLayoutType } from '@grafana/data';
import TraceDetailContainer from '../../containers/TraceDetailContainer/TraceDetailContainer';
import { useParams } from 'react-router-dom';

function TraceDetail() {
  const { traceId } = useParams<{ traceId: string }>();

  if (!traceId) {
    return <div>Trace Id name not provided</div>;
  }

  return (
    <PluginPage layout={PageLayoutType.Canvas}>
      <TraceDetailContainer traceId={traceId}></TraceDetailContainer>
    </PluginPage>
  );
}

export default TraceDetail;
