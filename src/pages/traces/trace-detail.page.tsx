import React from 'react';

import { PluginPage } from '@grafana/runtime';

import { PageLayoutType } from '@grafana/data';
import TraceDetailContainer from '../../containers/TraceDetailContainer';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';

function TraceDetailPage() {
  const { traceId } = useParams<{ traceId: string }>();
  const [searchParams] = useSearchParams();
  const spanId = searchParams.get('spanId');
  const navigate = useNavigate();

  if (!traceId) {
    return <div>Trace Id name not provided</div>;
  }

  return (
    <PluginPage layout={PageLayoutType.Canvas}>
      <div style={{ padding: '16px 24px 0 24px' }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(-1)}
          className="detail-back-button"
        >
          Back to Traces
        </Button>
      </div>
      <TraceDetailContainer traceId={traceId} initialSpanId={spanId || undefined}></TraceDetailContainer>
    </PluginPage>
  );
}

export default TraceDetailPage;