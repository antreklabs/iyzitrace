import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { ReactFlowProvider } from 'reactflow';
import 'reactflow/dist/style.css';

interface OperationLayerProps {
  selectedNodeId?: string;
  setDetailPanelContent?: (content: React.ReactNode) => void;
  data?: any;
  groupKeyName?: string;
  hostKeyName?: string;
}

const OperationInner = forwardRef<any, OperationLayerProps>(({ selectedNodeId, setDetailPanelContent, data, groupKeyName, hostKeyName  }, ref) => {
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
      operation layer
    </div>
  );
});

const OperationLayer = forwardRef<any, OperationLayerProps>((props, ref) => (
  <ReactFlowProvider>
    <OperationInner ref={ref} {...props} />
  </ReactFlowProvider>
));

export default OperationLayer;


