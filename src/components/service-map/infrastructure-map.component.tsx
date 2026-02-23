import React, { useMemo, useCallback, useState, forwardRef, useImperativeHandle } from 'react';
import {
  ReactFlowProvider,
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  useReactFlow,
  ControlButton
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Card, Dropdown } from 'antd';
import { AppstoreOutlined, FullscreenOutlined, FullscreenExitOutlined } from '@ant-design/icons';
import { ServiceMapData } from '../../api/service/interface.service';
import { InfrastructureNode } from './infrastructure-node.component';
import { RegionGroup } from './region-group.component';
import { InfrastructureDetailPanel } from './infrastructure-detail-panel.component';
import { SearchTree } from './search-tree.component';
import { ServiceMapBottomDrawer } from './service-map-bottom-drawer.component';
import { getPluginSettings, savePluginSettings } from '../../api/service/settings.service';

const nodeTypes = {
  infrastructure: InfrastructureNode,
  group: RegionGroup
};

interface InfrastructureMapProps {
  data: ServiceMapData;
}


const InfrastructureMapInner = forwardRef<any, InfrastructureMapProps>(({ data }, ref) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string>('');
  const [searchValue, setSearchValue] = useState('');
  const [selectedKey, setSelectedKey] = useState('');
  const [isServiceMapOpen, setIsServiceMapOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const reactFlowInstance = useReactFlow();

  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    const regions = data?.regions || [];

    const INFRA_WIDTH = 180;
    const INFRA_HEIGHT = 240;
    const INFRA_GAP_X = 80;
    const INFRA_GAP_Y = 80;
    const GROUP_PADDING = 100;
    const REGION_GAP_Y = 120;
    const INFRA_PER_ROW = 3;

    let currentRegionY = 50;

    regions.forEach((region) => {
      const infrastructures = region.infrastructures || [];
      const infraCount = infrastructures.length;

      const rows = Math.ceil(infraCount / INFRA_PER_ROW);
      const cols = Math.min(infraCount, INFRA_PER_ROW);

      const groupWidth = cols * INFRA_WIDTH + (cols - 1) * INFRA_GAP_X + GROUP_PADDING * 2;
      const groupHeight = rows * INFRA_HEIGHT + (rows - 1) * INFRA_GAP_Y + GROUP_PADDING * 2;

      const groupNode: Node = {
        id: `group::${region.id}`,
        type: 'group',
        data: {
          region,
          groupSize: { width: groupWidth, height: groupHeight }
        },
        position: { x: 50, y: currentRegionY },
        style: { zIndex: -1 }
      };
      nodes.push(groupNode);

      infrastructures.forEach((infra, index) => {
        const row = Math.floor(index / INFRA_PER_ROW);
        const col = index % INFRA_PER_ROW;

        const infraX = GROUP_PADDING + col * (INFRA_WIDTH + INFRA_GAP_X);
        const infraY = GROUP_PADDING + row * (INFRA_HEIGHT + INFRA_GAP_Y);

        const infraNode: Node = {
          id: infra.id,
          type: 'infrastructure',
          data: {
            infrastructure: infra,
            onNodeClick: (id: string) => setSelectedNodeId(id)
          },
          position: { x: infraX, y: infraY },
          parentNode: `group::${region.id}`,
          extent: 'parent' as const
        };
        nodes.push(infraNode);
      });

      currentRegionY += groupHeight + REGION_GAP_Y;
    });

    const infraMap = new Map<string, string>();
    regions.forEach(region => {
      region.infrastructures?.forEach(infraItem => {
        const infra = infraItem as any;
        infra.services?.forEach((service: any) => {
          infraMap.set(service.id, infra.id);
        });
      });
    });

    const infraConnections = new Map<string, Set<string>>();
    regions.forEach(region => {
      region.infrastructures?.forEach(infraItem => {
        const infra = infraItem as any;
        infra.services?.forEach((service: any) => {
          service.targetServiceIds?.forEach((targetServiceId: string) => {
            const targetInfraId = infraMap.get(targetServiceId);
            if (targetInfraId && targetInfraId !== infra.id) {
              if (!infraConnections.has(infra.id)) {
                infraConnections.set(infra.id, new Set());
              }
              infraConnections.get(infra.id)!.add(targetInfraId);
            }
          });
        });
      });
    });

    infraConnections.forEach((targets, sourceInfraId) => {
      targets.forEach(targetInfraId => {
        edges.push({
          id: `infra-edge-${sourceInfraId}-${targetInfraId}`,
          source: sourceInfraId,
          target: targetInfraId,
          type: 'smoothstep',
          animated: false,
          style: {
            stroke: '#60a5fa',
            strokeWidth: 2,
            strokeDasharray: '8 4'
          }
        });
      });
    });

    return { nodes, edges };
  }, [data]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  React.useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  React.useEffect(() => {
    const loadPositions = async () => {
      let viewId: string | undefined;
      try {
        const lastRaw = localStorage.getItem('lastSelectedPageView_service-map');
        if (lastRaw) {
          const last = JSON.parse(lastRaw);
          viewId = last?.viewId;
        }
      } catch { }

      if (!viewId || !data?.regions) return;

      let savedItems: any[] = [];
      try {
        const settings = await getPluginSettings();
        const pageViews = (settings.pageViews || []) as any[];
        const view = pageViews.find((v: any) => v.id === viewId && v.page === 'service-map');
        if (view && (view as any).data?.items) {
          savedItems = (view as any).data.items;
        }
      } catch {
        try {
          const key = 'iyzitrace-views-service-map';
          const localViews = JSON.parse(localStorage.getItem(key) || '[]');
          const view = localViews.find((v: any) => v.id === viewId);
          if (view && (view as any).data?.items) {
            savedItems = (view as any).data.items;
          }
        } catch { }
      }

      if (savedItems.length === 0) return;

      savedItems.forEach((item: any) => {
        if (item.type === 'region' && item.groupPosition) {
          const region = data.regions?.find((r: any) => r.id === item.id);
          if (region) {
            (region as any).groupPosition = item.groupPosition;
          }
        } else if (item.type === 'infrastructure' && item.position) {
          for (const region of (data.regions || [])) {
            const infra = region.infrastructures?.find((i: any) => i.id === item.id);
            if (infra) {
              (infra as any).position = item.position;
              break;
            }
          }
        }
      });

    };

    loadPositions();
  }, [data]);

  const selectedInfrastructure = useMemo(() => {
    if (!selectedNodeId) return null;

    for (const region of (data?.regions || [])) {
      const infra = (region.infrastructures || []).find(i => i.id === selectedNodeId);
      if (infra) return infra;
    }
    return null;
  }, [selectedNodeId, data]);

  const zoomToNode = useCallback((nodeId: string, isRegion: boolean = false) => {
    if (!reactFlowInstance) return;

    if (!nodeId) {
      reactFlowInstance.fitView({ padding: 0.2 });
      return;
    }

    const targetNodeId = isRegion ? `group::${nodeId}` : nodeId;
    const node = nodes.find(n => n.id === targetNodeId);

    if (!node) return;

    if (isRegion) {
      const groupData = node.data as any;
      const groupSize = groupData?.groupSize || { width: 560, height: 300 };

      const padding = 100;
      const x = node.position.x - padding;
      const y = node.position.y - padding;
      const width = groupSize.width + padding * 2;
      const height = groupSize.height + padding * 2;

      reactFlowInstance.fitBounds(
        { x, y, width, height },
        { padding: 0.1 }
      );
    } else {
      const parentNode = nodes.find(n => n.id === node.parentNode);
      const absoluteX = (parentNode?.position.x || 0) + node.position.x;
      const absoluteY = (parentNode?.position.y || 0) + node.position.y;

      reactFlowInstance.setCenter(
        absoluteX + 90,
        absoluteY + 120,
        { zoom: 1.5 }
      );
    }
  }, [nodes, reactFlowInstance]);

  useImperativeHandle(ref, () => ({
    zoomToNode
  }), [zoomToNode]);

  const handleTreeSelect = useCallback((key: string) => {
    setSelectedKey(key);

    let nodeId = '';
    let isRegion = false;

    if (key.startsWith('region-')) {
      nodeId = key.replace('region-', '');
      isRegion = true;
      setSelectedNodeId('');
    } else if (key.startsWith('infra-')) {
      nodeId = key.replace('infra-', '');
      isRegion = false;
      setSelectedNodeId(nodeId);
    }

    setTimeout(() => {
      zoomToNode(nodeId, isRegion);
    }, 100);
  }, [zoomToNode]);

  const handleClear = useCallback(() => {
    setSelectedKey('');
    setSelectedNodeId('');
    setSearchValue('');
    setTimeout(() => {
      zoomToNode('', false);
    }, 100);
  }, [zoomToNode]);

  const handleCloseDetailPanel = useCallback(() => {
    setSelectedNodeId('');
    setSelectedKey('');
  }, []);

  const handleOpenServiceMap = useCallback(() => {
    setIsServiceMapOpen(true);
  }, []);

  const handleCloseServiceMap = useCallback(() => {
    setIsServiceMapOpen(false);
  }, []);

  const savePositionsToView = useCallback(async () => {
    if (!data?.regions) return;

    const items: any[] = [];
    data.regions.forEach((region: any) => {
      items.push({
        id: region.id,
        type: 'region',
        groupPosition: region.groupPosition
      });
      region.infrastructures?.forEach((infra: any) => {
        items.push({
          id: infra.id,
          type: 'infrastructure',
          position: infra.position
        });
      });
    });

    const minimized = { items };

    let viewId: string | undefined;
    try {
      const lastRaw = localStorage.getItem('lastSelectedPageView_service-map');
      if (lastRaw) {
        const last = JSON.parse(lastRaw);
        viewId = last?.viewId;
      }
    } catch { }

    if (!viewId) return;

    try {
      const settings = await getPluginSettings();
      const pageViews = settings.pageViews || [];
      const updated = pageViews.map((v: any) =>
        v.id === viewId && v.page === 'service-map' ? { ...v, data: minimized } : v
      );
      await savePluginSettings({ ...settings, pageViews: updated });
    } catch (e) {
      try {
        const key = 'iyzitrace-views-service-map';
        const localViews = JSON.parse(localStorage.getItem(key) || '[]');
        const updatedLocal = (localViews || []).map((v: any) =>
          v.id === viewId ? { ...v, data: minimized } : v
        );
        localStorage.setItem(key, JSON.stringify(updatedLocal));
      } catch { }
    }
  }, [data]);

  const searchTreeContent = (
    <SearchTree
      regions={data?.regions || []}
      searchValue={searchValue}
      selectedKey={selectedKey}
      onSearchChange={setSearchValue}
      onSelect={handleTreeSelect}
      onClear={handleClear}
    />
  );

  return (
    <div className="infra-map-container">
      <style>{`
        .react-flow__node-group { width: auto !important; }
      `}</style>

      <Card
        className="infra-map-card"
        styles={{ body: { padding: 0, height: '100%' } }}
      >
        <div className="infra-map-canvas-wrapper">
          {
          }


          {
          }
          <div className="infra-map-legend-overlay">
            <div className="infra-map-legend-card">
              <div className="infra-map-legend-items">
                <span className="infra-map-legend-healthy">● healthy</span>
                <span className="infra-map-legend-warning">● warning / degraded</span>
                <span className="infra-map-legend-error">● error</span>
              </div>
            </div>
          </div>

          {
          }
          <div className="infra-map-search-overlay">
            <Dropdown
              dropdownRender={() => searchTreeContent}
              trigger={['click']}
              placement="bottomRight"
            >
              <div
                className="infra-map-search-btn"
                aria-label="Search"
                title="Search"
              >
                <AppstoreOutlined />
              </div>
            </Dropdown>
          </div>

          {
          }
          {selectedInfrastructure && (
            <div className="infra-map-detail-overlay">
              <InfrastructureDetailPanel
                infrastructure={selectedInfrastructure}
                onClose={handleCloseDetailPanel}
                onServicesClick={handleOpenServiceMap}
              />
            </div>
          )}

          {
          }
          <div
            style={{
              position: isFullscreen ? 'fixed' : 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: isFullscreen ? 9999 : 'auto'
            }}
          >
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              nodeTypes={nodeTypes}
              nodesDraggable={false}
              nodesConnectable={false}
              fitView
              fitViewOptions={{ padding: 0.2 }}
              className="infra-map-reactflow"
              minZoom={0.1}
              maxZoom={2.5}
              onNodeClick={(_, node) => {
                if (node.type !== 'group') {
                  const nodeId = node.data?.infrastructure?.id || node.id;
                  if (nodeId) {
                    setSelectedNodeId(nodeId);
                  }
                }
              }}
              onPaneClick={() => {
                setSelectedNodeId('');
              }}
              proOptions={{ hideAttribution: true }}
            >
              <Background color="#1f2937" gap={20} />
              <Controls className="infra-map-controls">
                <ControlButton
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                >
                  {isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
                </ControlButton>
              </Controls>
              <MiniMap
                className="infra-map-minimap"
                nodeColor="#60a5fa"
              />
              <style>{`
                .react-flow__attribution {
                  display: none !important;
                }
              `}</style>
            </ReactFlow>
          </div>
        </div>
      </Card >

      {
      }
      < ServiceMapBottomDrawer
        infrastructure={selectedInfrastructure}
        isOpen={isServiceMapOpen}
        onClose={handleCloseServiceMap}
      />
    </div >
  );
});

InfrastructureMapInner.displayName = 'InfrastructureMapInner';

export const InfrastructureMap = forwardRef<any, InfrastructureMapProps>((props, ref) => {
  return (
    <ReactFlowProvider>
      <InfrastructureMapInner {...props} ref={ref} />
    </ReactFlowProvider>
  );
});

InfrastructureMap.displayName = 'InfrastructureMap';