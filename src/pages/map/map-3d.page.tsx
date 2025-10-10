import React, { useMemo, useState, useCallback, useRef } from 'react';
import { Card, Dropdown, Input, Tree, Button } from 'antd';
import { AppstoreOutlined, SearchOutlined, CloseOutlined } from '@ant-design/icons';
import InfraLayer from './components/infra-layer';
import ApplicationLayer from './components/application-layer';
import ServiceLayer from './components/service-layer';
import OperationLayer from './components/operation-layer';

type LayerKey = 'infra' | 'application' | 'service' | 'operation';

interface TreeNode {
  title: string;
  key: string;
  type: LayerKey;
  children?: TreeNode[];
}

const Map3DPage: React.FC = () => {
  const [layer, setLayer] = useState<LayerKey>('infra');
  const [searchValue, setSearchValue] = useState('');
  const [selectedKey, setSelectedKey] = useState<string>('');
  const [selectedNodeId, setSelectedNodeId] = useState<string>('');
  const infraLayerRef = useRef<any>(null);
  const applicationLayerRef = useRef<any>(null);
  const serviceLayerRef = useRef<any>(null);
  const operationLayerRef = useRef<any>(null);

  // localStorage'dan veri al ve tree yapısına çevir
  const treeData = useMemo(() => {
    try {
      const stored = localStorage.getItem('infra-map-data');
      if (!stored) return [];
      
      const data = JSON.parse(stored);
      const regions = data.regions || [];
      
      const nodes: TreeNode[] = [];
      
      regions.forEach((region: any) => {
        const regionNode: TreeNode = {
          title: region.name,
          key: `region-${region.name}`,
          type: 'infra',
          children: []
        };
        
        (region.infrastructures || []).forEach((infra: any) => {
          const infraNode: TreeNode = {
            title: infra.name,
            key: `infra-${infra.id}`,
            type: 'infra',
            children: []
          };
          
          (infra.applications || []).forEach((app: any) => {
            const appNode: TreeNode = {
              title: app.name,
              key: `app-${app.id || app.name}`,
              type: 'application',
              children: []
            };
            
            (app.services || []).forEach((service: any) => {
              const serviceNode: TreeNode = {
                title: service.name,
                key: `service-${service.id || service.name}`,
                type: 'service',
                children: []
              };
              
              (service.operations || []).forEach((op: any) => {
                const opNode: TreeNode = {
                  title: op.name,
                  key: `op-${op.id || op.name}`,
                  type: 'operation',
                  children: []
                };
                serviceNode.children!.push(opNode);
              });
              
              appNode.children!.push(serviceNode);
            });
            
            infraNode.children!.push(appNode);
          });
          
          regionNode.children!.push(infraNode);
        });
        
        nodes.push(regionNode);
      });
      
      return nodes;
    } catch (error) {
      console.error('Error parsing localStorage data:', error);
      return [];
    }
  }, []);

  // Arama fonksiyonu
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
      const key = selectedKeys[0] as string;
      setSelectedKey(key);
      
      // Node ID'yi belirle (zoom için)
      let nodeId = '';
      if (key.startsWith('region-')) {
        nodeId = key.replace('region-', '');
        setLayer('infra');
      } else if (key.startsWith('infra-')) {
        nodeId = key.replace('infra-', '');
        setLayer('infra');
      } else if (key.startsWith('app-')) {
        nodeId = key.replace('app-', '');
        setLayer('application');
      } else if (key.startsWith('service-')) {
        nodeId = key.replace('service-', '');
        setLayer('service');
      } else if (key.startsWith('op-')) {
        nodeId = key.replace('op-', '');
        setLayer('operation');
      }
      
      setSelectedNodeId(nodeId);
      
      // Zoom ve fit işlemi için timeout (layer değişiminden sonra)
      setTimeout(() => {
        const currentRef = layer === 'infra' ? infraLayerRef.current :
                          layer === 'application' ? applicationLayerRef.current :
                          layer === 'service' ? serviceLayerRef.current :
                          operationLayerRef.current;
        
        if (currentRef && currentRef.zoomToNode) {
          currentRef.zoomToNode(nodeId);
        }
      }, 100);
    }
  }, [layer]);

  const clearSelection = useCallback(() => {
    setSelectedKey('');
    setSelectedNodeId('');
    setSearchValue('');
    setLayer('infra');
    
    // Zoom out yap - tüm infrastruture'ları göster
    setTimeout(() => {
      const currentRef = infraLayerRef.current;
      if (currentRef && currentRef.zoomToNode) {
        // Boş string ile tüm view'a fit yap
        currentRef.zoomToNode('');
      }
    }, 100);
  }, []);

  const handleInfraNodeClick = useCallback((nodeId: string, nodeType: string) => {
    console.log('handleInfraNodeClick called with:', nodeId, nodeType);
    
    if (nodeType === 'clear') {
      // Clear selection - zoom out yap
      clearSelection();
    } else {
      // Normal node selection
      setSelectedKey(nodeId);
      setSelectedNodeId(nodeId);
      setLayer('infra');
      
      // Zoom to node
      setTimeout(() => {
        const currentRef = infraLayerRef.current;
        if (currentRef && currentRef.zoomToNode) {
          console.log('Zooming to node:', nodeId);
          currentRef.zoomToNode(nodeId);
        }
      }, 100);
    }
  }, [clearSelection]);

  const dropdownContent = useMemo(() => (
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
          onChange={(e) => setSearchValue(e.target.value)}
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
            onClick={clearSelection}
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
  ), [searchValue, filteredTreeData, selectedKey, handleSelect, clearSelection]);

  return (
    <div style={{ padding: 0, height: '100vh', overflow: 'hidden' }}>
      <Card style={{ background: '#0f172a', borderColor: '#1f2937', height: '100vh' }} styles={{ body: { padding: 0, height: '100%' } }}>
        <div style={{ position: 'relative', height: '92%' }}>
          <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 10 }}>
            <Dropdown 
              popupRender={() => dropdownContent}
              trigger={['click']}
              placement="bottomRight"
              overlayStyle={{ marginTop: '100px' }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  color: '#e5e7eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid #1f2937',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.35)',
                  background: '#1f2937'
                }}
                aria-label="Layer Selector"
                title="Layer Selector"
              >
                <AppstoreOutlined />
              </div>
            </Dropdown>
          </div>

          <div style={{ position: 'absolute', inset: 0 }}>
            {layer === 'infra' && <InfraLayer ref={infraLayerRef} selectedNodeId={selectedNodeId} onNodeClick={handleInfraNodeClick} />}
            {layer === 'application' && <ApplicationLayer ref={applicationLayerRef} selectedNodeId={selectedNodeId} />}
            {layer === 'service' && <ServiceLayer ref={serviceLayerRef} selectedNodeId={selectedNodeId} />}
            {layer === 'operation' && <OperationLayer ref={operationLayerRef} selectedNodeId={selectedNodeId} />}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Map3DPage;


