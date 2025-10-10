import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { ReactFlowProvider } from 'reactflow';
import 'reactflow/dist/style.css';

interface ServiceLayerProps {
  selectedNodeId?: string;
}

const ServiceInner = forwardRef<any, ServiceLayerProps>(({ selectedNodeId }, ref) => {
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
      service layer
    </div>
  );
});

const ServiceLayer = forwardRef<any, ServiceLayerProps>((props, ref) => (
  <ReactFlowProvider>
    <ServiceInner ref={ref} {...props} />
  </ReactFlowProvider>
));

export default ServiceLayer;


