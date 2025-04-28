import React from 'react';
import { Tree } from 'antd';

const { DirectoryTree } = Tree;

interface SpanNode {
  id: string;
  name: string;
  serviceName: string;
  children?: SpanNode[];
}

interface ServiceTreeProps {
  data: SpanNode[];
  onSelect?: (selectedKeys: React.Key[], info: any) => void;
}

const ServiceTree: React.FC<ServiceTreeProps> = ({ data, onSelect }) => {
  const convertToTreeData = (nodes: SpanNode[]): any[] =>
    nodes.map((node) => ({
      title: `${node.serviceName} → ${node.name}`,
      key: node.id,
      children: node.children && node.children.length > 0 ? convertToTreeData(node.children) : undefined,
    }));

  return (
    <DirectoryTree
      multiple
      defaultExpandAll
      onSelect={onSelect}
      treeData={convertToTreeData(data)}
    />
  );
};

export default ServiceTree;
