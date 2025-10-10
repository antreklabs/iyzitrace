import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { ReactFlowProvider } from 'reactflow';
import 'reactflow/dist/style.css';

interface ApplicationLayerProps {
  selectedNodeId?: string;
}

const ApplicationInner = forwardRef<any, ApplicationLayerProps>(({ selectedNodeId }, ref) => {
  const reactFlowInstance = useRef<any>(null);

  const zoomToNode = (nodeId: string) => {
    if (reactFlowInstance.current) {
      reactFlowInstance.current.fitView({
        padding: 0.1,
        duration: 800
      });
    }
  };

  useImperativeHandle(ref, () => ({
    zoomToNode
  }), []);

  return (
    <div style={{ width: '100%', height: '100%', background: 'transparent' }}>
      application layer
    </div>
  );
});

const ApplicationLayer = forwardRef<any, ApplicationLayerProps>((props, ref) => (
  <ReactFlowProvider>
    <ApplicationInner ref={ref} {...props} />
  </ReactFlowProvider>
));

export default ApplicationLayer;


