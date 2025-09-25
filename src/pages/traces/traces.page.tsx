import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';

import { PluginPage } from '@grafana/runtime';
import TraceContainer from '../../containers/TraceContainer/TraceContainer';
import { PageLayoutType } from '@grafana/data';

function Traces() {
  const { traceId } = useParams<{ traceId?: string }>();

  useEffect(() => {
    if (traceId) {
      // Trace ID'yi TraceContainer'a geç
      console.log('Trace ID from URL path:', traceId);
    }
  }, [traceId]);

  return (
    <PluginPage layout={PageLayoutType.Canvas}>
      <TraceContainer traceId={traceId}></TraceContainer>
    </PluginPage>
  );
}

export default Traces;