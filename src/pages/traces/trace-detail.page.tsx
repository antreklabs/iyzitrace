import React from 'react';

import { PluginPage } from '@grafana/runtime';

import { PageLayoutType } from '@grafana/data';
import TraceDetailContainer from '../../containers/TraceDetailContainer';
import { useParams, useSearchParams } from 'react-router-dom';

function TraceDetailPage() {
  const { traceId } = useParams<{ traceId: string }>();
  const [searchParams] = useSearchParams();
  const spanId = searchParams.get('spanId');

  if (!traceId) {
    return <div>Trace Id name not provided</div>;
  }

  return (
    <PluginPage layout={PageLayoutType.Canvas}>
      <TraceDetailContainer traceId={traceId} initialSpanId={spanId || undefined}></TraceDetailContainer>
    </PluginPage>
  );
}

export default TraceDetailPage;