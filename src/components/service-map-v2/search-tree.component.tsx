import React, { useMemo, useCallback } from 'react';
import { Input, Tree, Button } from 'antd';
import { SearchOutlined, CloseOutlined } from '@ant-design/icons';
import { Region, Infrastructure } from '../../api/service/interface.service';

interface TreeNode {
  title: string;
  key: string;
  children?: TreeNode[];
}

interface SearchTreeProps {
  regions: Region[];
  searchValue: string;
  selectedKey: string;
  onSearchChange: (value: string) => void;
  onSelect: (key: string) => void;
  onClear: () => void;
}

export const SearchTree: React.FC<SearchTreeProps> = ({
  regions,
  searchValue,
  selectedKey,
  onSearchChange,
  onSelect,
  onClear
}) => {
  const treeData = useMemo(() => {
    const nodes: TreeNode[] = [];
    
    regions.forEach((region: Region) => {
      const regionNode: TreeNode = {
        title: region.name,
        key: `region-${region.id}`,
        children: []
      };
      
      (region.infrastructures || []).forEach((infra: Infrastructure) => {
        const infraNode: TreeNode = {
          title: infra.name,
          key: `infra-${infra.id}`
        };
        
        regionNode.children!.push(infraNode);
      });
      
      nodes.push(regionNode);
    });
    
    return nodes;
  }, [regions]);

  const filterTreeData = useCallback((data: TreeNode[], search: string): TreeNode[] => {
    if (!search) return data;
    
    const filter = (nodes: TreeNode[]): TreeNode[] => {
      return nodes.reduce((acc: TreeNode[], node) => {
        const matchesSearch = node.title.toLowerCase().includes(search.toLowerCase());
        const filteredChildren = node.children ? filter(node.children) : [];
        
        if (matchesSearch || filteredChildren.length > 0) {
          acc.push({
            ...node,
            children: filteredChildren.length > 0 ? filteredChildren : node.children
          });
        }
        
        return acc;
      }, []);
    };
    
    return filter(data);
  }, []);

  const filteredTreeData = useMemo(() => {
    return filterTreeData(treeData, searchValue);
  }, [treeData, searchValue, filterTreeData]);

  const handleSelect = useCallback((selectedKeys: React.Key[]) => {
    if (selectedKeys.length > 0) {
      onSelect(selectedKeys[0] as string);
    }
  }, [onSelect]);

  return (
    <div style={{ 
      background: '#1f2937', 
      padding: '12px', 
      borderRadius: '8px', 
      border: '1px solid #374151',
      boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
      width: '300px',
      maxHeight: '400px',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Search Bar */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <Input
          placeholder="Search..."
          prefix={<SearchOutlined style={{ color: '#9ca3af' }} />}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{
            background: '#374151',
            border: '1px solid #4b5563',
            color: '#e5e7eb',
            flex: 1
          }}
        />
        {(selectedKey || searchValue) && (
          <Button
            icon={<CloseOutlined />}
            onClick={onClear}
            style={{
              background: '#dc2626',
              border: '1px solid #b91c1c',
              color: '#ffffff',
              minWidth: '32px',
              height: '32px'
            }}
            title="Clear selection"
          />
        )}
      </div>
      
      {/* Tree View */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto',
        background: '#1f2937'
      }}>
        <Tree
          treeData={filteredTreeData}
          onSelect={handleSelect}
          selectedKeys={selectedKey ? [selectedKey] : []}
          style={{
            background: 'transparent',
            color: '#e5e7eb'
          }}
          titleRender={(nodeData) => (
            <span style={{ color: '#e5e7eb' }}>
              {nodeData.title}
            </span>
          )}
        />
      </div>
    </div>
  );
};

