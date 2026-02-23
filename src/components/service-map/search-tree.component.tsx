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
    <div className="search-tree-container">
      {
      }
      <div className="search-tree-header">
        <Input
          placeholder="Search..."
          prefix={<SearchOutlined className="sm-search-icon" />}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="sm-search-input"
        />
        {(selectedKey || searchValue) && (
          <Button
            icon={<CloseOutlined />}
            onClick={onClear}
            className="sm-search-clear-btn"
            title="Clear selection"
          />
        )}
      </div>

      {
      }
      <div className="sm-search-tree-container">
        <Tree
          treeData={filteredTreeData}
          onSelect={handleSelect}
          selectedKeys={selectedKey ? [selectedKey] : []}
          className="sm-search-tree"
          titleRender={(nodeData) => (
            <span className="sm-search-result-text">
              {nodeData.title}
            </span>
          )}
        />
      </div>
    </div>
  );
};