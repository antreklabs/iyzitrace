import React, { useState } from 'react';
import { Tree } from 'antd';

interface SpanNode {
  id: string;
  name: string;
  serviceName: string;
  children?: SpanNode[];
}

interface ServiceTreePanelProps {
  data: SpanNode[];
  selectedSpanId?: string;
  onSpanSelect?: (spanId: string) => void;
}

const buildTreeData = (nodes: SpanNode[]): any[] =>
  nodes.map((node) => ({
    title: `${node.serviceName} → ${node.name}`,
    key: node.id,
    children: node.children ? buildTreeData(node.children) : undefined,
  }));

const ServiceTreePanel: React.FC<ServiceTreePanelProps> = ({ data, selectedSpanId, onSpanSelect }) => {
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);

  const treeData = buildTreeData(data);

  return (
    <Tree
      treeData={treeData}
      expandedKeys={expandedKeys}
      onExpand={(keys) => setExpandedKeys(keys as string[])}
      selectedKeys={selectedSpanId ? [selectedSpanId] : []}
      onSelect={(keys) => onSpanSelect?.(keys[0] as string)}
      height={500}
      virtual={false}
      showLine
    />
  );
};

export default ServiceTreePanel;
