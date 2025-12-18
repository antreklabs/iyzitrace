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

const cardBg = (hex: string) =>
  `linear-gradient(180deg, ${hex} 0%, rgba(6,10,19,0.9) 100%)`;

const InfrastructureMapInner = forwardRef<any, InfrastructureMapProps>(({ data }, ref) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string>('');
  const [searchValue, setSearchValue] = useState('');
  const [selectedKey, setSelectedKey] = useState('');
  const [isServiceMapOpen, setIsServiceMapOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const reactFlowInstance = useReactFlow();

  // Build nodes and edges from data with auto-layout
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    
    const regions = data?.regions || [];
    // console.log('🔍 InfrastructureMap - Data:', data);
    // console.log('🔍 InfrastructureMap - Regions count:', regions.length);
    // console.log('🔍 InfrastructureMap - Regions:', regions);

    // Layout constants
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
      
      // Calculate region group size based on infrastructure count
      const rows = Math.ceil(infraCount / INFRA_PER_ROW);
      const cols = Math.min(infraCount, INFRA_PER_ROW);
      
      const groupWidth = cols * INFRA_WIDTH + (cols - 1) * INFRA_GAP_X + GROUP_PADDING * 2;
      const groupHeight = rows * INFRA_HEIGHT + (rows - 1) * INFRA_GAP_Y + GROUP_PADDING * 2;

      // Add region group node
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

      // Add infrastructure nodes within region with grid layout
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

      // Move to next region position
      currentRegionY += groupHeight + REGION_GAP_Y;
    });

    // Create edges between infrastructures based on service relationships
    const infraMap = new Map<string, string>(); // serviceId -> infraId
    regions.forEach(region => {
      region.infrastructures?.forEach(infraItem => {
        const infra = infraItem as any;
        infra.services?.forEach((service: any) => {
          infraMap.set(service.id, infra.id);
        });
      });
    });

    const infraConnections = new Map<string, Set<string>>(); // infraId -> Set<targetInfraId>
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

    // Create edges for infrastructure connections
    infraConnections.forEach((targets, sourceInfraId) => {
      targets.forEach(targetInfraId => {
        edges.push({
          id: `infra-edge-${sourceInfraId}-${targetInfraId}`,
          source: sourceInfraId,
          target: targetInfraId,
          type: 'smoothstep',
          animated: true,
          style: {
            stroke: '#60a5fa',
            strokeWidth: 2,
            strokeDasharray: '5 5'
          }
        });
      });
    });

    // console.log('🔍 InfrastructureMap - Total nodes created:', nodes.length);
    // console.log('🔍 InfrastructureMap - Total edges created:', edges.length);
    // console.log('🔍 InfrastructureMap - Nodes:', nodes);
    
    return { nodes, edges };
  }, [data]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes when data changes
  React.useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  // Load saved positions from view on mount
  React.useEffect(() => {
    const loadPositions = async () => {
      let viewId: string | undefined;
      try {
        const lastRaw = localStorage.getItem('lastSelectedPageView_service-map');
        if (lastRaw) {
          const last = JSON.parse(lastRaw);
          viewId = last?.viewId;
        }
      } catch {}

      if (!viewId || !data?.regions) return;

      // Try to load from plugin settings or localStorage
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
        } catch {}
      }

      if (savedItems.length === 0) return;

      // Apply saved positions to data
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

      // console.log('📥 Positions loaded from view');
    };

    loadPositions();
  }, [data]);

  // Helper to get connected nodes and edges for hover
  const getConnectedElements = useCallback((nodeId: string) => {
    const connectedNodeIds = new Set<string>();
    const connectedEdgeIds = new Set<string>();
    
    edges.forEach(edge => {
      if (edge.source === nodeId || edge.target === nodeId) {
        connectedEdgeIds.add(edge.id);
        connectedNodeIds.add(edge.source);
        connectedNodeIds.add(edge.target);
      }
    });
    
    return { connectedNodeIds, connectedEdgeIds };
  }, [edges]);

  // Compute highlighted nodes and edges
  const highlightedNodes = useMemo(() => {
    if (!hoveredNodeId) return new Set<string>();
    const { connectedNodeIds } = getConnectedElements(hoveredNodeId);
    return connectedNodeIds;
  }, [hoveredNodeId, getConnectedElements]);

  const highlightedEdges = useMemo(() => {
    if (!hoveredNodeId) return new Set<string>();
    const { connectedEdgeIds } = getConnectedElements(hoveredNodeId);
    return connectedEdgeIds;
  }, [hoveredNodeId, getConnectedElements]);

  // Find selected infrastructure
  const selectedInfrastructure = useMemo(() => {
    if (!selectedNodeId) return null;
    
    for (const region of (data?.regions || [])) {
      const infra = (region.infrastructures || []).find(i => i.id === selectedNodeId);
      if (infra) return infra;
    }
    return null;
  }, [selectedNodeId, data]);

  // Zoom to node
  const zoomToNode = useCallback((nodeId: string, isRegion: boolean = false) => {
    if (!reactFlowInstance) return;
    
    if (!nodeId) {
      // Fit entire view
      reactFlowInstance.fitView({ padding: 0.2, duration: 500 });
      return;
    }

    // For regions, use group:: prefix
    const targetNodeId = isRegion ? `group::${nodeId}` : nodeId;
    const node = nodes.find(n => n.id === targetNodeId);
    
    if (!node) return;

    if (isRegion) {
      // For regions, fit the entire group into view
      const groupData = node.data as any;
      const groupSize = groupData?.groupSize || { width: 560, height: 300 };
      
      // Calculate bounds for fitView
      const padding = 100;
      const x = node.position.x - padding;
      const y = node.position.y - padding;
      const width = groupSize.width + padding * 2;
      const height = groupSize.height + padding * 2;
      
      reactFlowInstance.fitBounds(
        { x, y, width, height },
        { padding: 0.1, duration: 500 }
      );
    } else {
      // For infrastructure, zoom to center
      const parentNode = nodes.find(n => n.id === node.parentNode);
      const absoluteX = (parentNode?.position.x || 0) + node.position.x;
      const absoluteY = (parentNode?.position.y || 0) + node.position.y;
      
      reactFlowInstance.setCenter(
        absoluteX + 90,
        absoluteY + 120,
        { zoom: 1.5, duration: 500 }
      );
    }
  }, [nodes, reactFlowInstance]);

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    zoomToNode
  }), [zoomToNode]);

  // Handle tree selection
  const handleTreeSelect = useCallback((key: string) => {
    setSelectedKey(key);
    
    let nodeId = '';
    let isRegion = false;
    
    if (key.startsWith('region-')) {
      nodeId = key.replace('region-', '');
      isRegion = true;
      // Clear infrastructure selection when selecting region
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

  // Save positions to view
  const savePositionsToView = useCallback(async () => {
    if (!data?.regions) return;

    // Build minimized layout data
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

    // Get current view ID
    let viewId: string | undefined;
    try {
      const lastRaw = localStorage.getItem('lastSelectedPageView_service-map');
      if (lastRaw) {
        const last = JSON.parse(lastRaw);
        viewId = last?.viewId;
      }
    } catch {}

    if (!viewId) return;

    // Save to plugin settings or localStorage
    try {
      const settings = await getPluginSettings();
      const pageViews = settings.pageViews || [];
      const updated = pageViews.map((v: any) => 
        v.id === viewId && v.page === 'service-map' ? { ...v, data: minimized } : v
      );
      await savePluginSettings({ ...settings, pageViews: updated });
      console.log('💾 Positions saved to plugin settings');
    } catch (e) {
      try {
        const key = 'iyzitrace-views-service-map';
        const localViews = JSON.parse(localStorage.getItem(key) || '[]');
        const updatedLocal = (localViews || []).map((v: any) =>
          v.id === viewId ? { ...v, data: minimized } : v
        );
        localStorage.setItem(key, JSON.stringify(updatedLocal));
        console.log('💾 Positions saved to localStorage');
      } catch {}
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
    <div style={{ paddingBottom: 100, height: '90vh', overflow: 'hidden' }}>
      <style>{`
        .react-flow__node-group { width: auto !important; }
      `}</style>
      
      <Card 
        style={{ background: '#0f172a', borderColor: '#1f2937', height: '80vh' }} 
        styles={{ body: { padding: 0, height: '100%' } }}
      >
        <div style={{ position: 'relative', height: '100%' }}>
          {/* Legend - Sol Üst */}
          <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 10, width: '180px' }}>
            <div
              style={{
                padding: 10,
                borderRadius: 10,
                border: '1px solid rgba(148,163,184,0.18)',
                background: cardBg('#1b2a44'),
                color: '#cbd5e1',
                fontSize: 12
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: 6 }}>
                Infrastructure Map
              </div>
              <div style={{ opacity: 0.7, fontSize: 11 }}>
                Regions → Infrastructures
              </div>
            </div>
          </div>

          {/* Status Legend - Sol Üst 2 */}
          <div style={{ position: 'absolute', top: 12, right: 55, zIndex: 10 }}>
            <div
              style={{
                padding: 5,
                borderRadius: 10,
                border: '1px solid rgba(148,163,184,0.18)',
                background: cardBg('#1b2a44'),
                color: '#cbd5e1',
                fontSize: 12
              }}
            >
              <div style={{ marginTop: 0, display: 'flex', flexDirection: 'row', gap: 8 }}>
                <span style={{ color: '#22c55e' }}>● healthy</span>
                <span style={{ color: '#f59e0b' }}>● warning / degraded</span>
                <span style={{ color: '#ef4444' }}>● error</span>
              </div>
            </div>
          </div>

          {/* Search Tree - Sağ Üst */}
          <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 10 }}>
            <Dropdown 
              dropdownRender={() => searchTreeContent}
              trigger={['click']}
              placement="bottomRight"
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
                aria-label="Search"
                title="Search"
              >
                <AppstoreOutlined />
              </div>
            </Dropdown>
          </div>

          {/* Detail Panel - Sol Orta */}
          {selectedInfrastructure && (
            <div style={{ position: 'absolute', left: 12, top: 100, zIndex: 1000 }}>
              <InfrastructureDetailPanel 
                infrastructure={selectedInfrastructure}
                onClose={handleCloseDetailPanel}
                onServicesClick={handleOpenServiceMap}
              />
            </div>
          )}

          {/* ReactFlow Canvas */}
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
              nodes={nodes.map(n => ({
                ...n,
                style: {
                  ...n.style,
                  opacity: hoveredNodeId ? (n.id === hoveredNodeId || highlightedNodes.has(n.id) ? 1 : 0.3) : 1,
                  transition: 'opacity 0.2s ease'
                }
              }))}
              edges={edges.map(e => ({
                ...e,
                style: {
                  ...e.style,
                  opacity: hoveredNodeId ? (highlightedEdges.has(e.id) ? 1 : 0.2) : 1,
                  strokeWidth: highlightedEdges.has(e.id) ? 3 : 2,
                  transition: 'all 0.2s ease'
                }
              }))}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              nodeTypes={nodeTypes}
              nodesDraggable={true}
              nodesConnectable={false}
              fitView
              fitViewOptions={{ padding: 0.2 }}
              style={{ background: '#0f172a' }}
              minZoom={0.1}
              maxZoom={2.5}
              onNodeDragStop={async (_, node) => {
                // Save node position to view data
                console.log('💾 Saving node position:', node.id, node.position);
                
                // Update data structure with new position
                if (node.type === 'group') {
                  // Group node (region) - save groupPosition
                  const regionId = node.id.replace('group::', '');
                  const region = data?.regions?.find((r: any) => r.id === regionId);
                  if (region) {
                    (region as any).groupPosition = { x: Math.round(node.position.x), y: Math.round(node.position.y) };
                  }
                } else {
                  // Infrastructure node - save position
                  const infraId = node.id;
                  for (const region of (data?.regions || [])) {
                    const infra = region.infrastructures?.find((i: any) => i.id === infraId);
                    if (infra) {
                      (infra as any).position = { x: Math.round(node.position.x), y: Math.round(node.position.y) };
                      break;
                    }
                  }
                }
                
                // Save to view (plugin settings or localStorage)
                await savePositionsToView();
              }}
              onNodeClick={(_, node) => {
                // Handle group clicks - zoom to group
                if (node.type === 'group') {
                  const groupChildren = nodes.filter(n => n.parentNode === node.id);
                  if (groupChildren.length > 0) {
                    reactFlowInstance.fitView({
                      nodes: [node, ...groupChildren],
                      padding: 0.3,
                      duration: 800
                    });
                  } else {
                    reactFlowInstance.fitView({
                      nodes: [node],
                      padding: 0.3,
                      duration: 800
                    });
                  }
                } else {
                  // Regular node click - zoom to node
                  const nodeId = node.data?.infrastructure?.id || node.id;
                  if (nodeId) {
                    setSelectedNodeId(nodeId);
                    setTimeout(() => {
                      reactFlowInstance.fitView({
                        nodes: [node],
                        padding: 0.2,
                        duration: 800
                      });
                    }, 50);
                  }
                }
              }}
              onNodeMouseEnter={(_, node) => {
                // Don't highlight group nodes
                if (node.type !== 'group') {
                  setHoveredNodeId(node.id);
                }
              }}
              onNodeMouseLeave={(_, node) => {
                if (node.type !== 'group') {
                  setHoveredNodeId(null);
                }
              }}
              onPaneClick={() => {
                setSelectedNodeId('');
                setHoveredNodeId(null);
                // Fit view on empty space click
                reactFlowInstance.fitView({
                  padding: 0.2,
                  duration: 800
                });
              }}
              proOptions={{ hideAttribution: true }}
            >
              <Background color="#1f2937" gap={20} />
              <Controls 
                style={{
                  background: '#1f2937',
                  border: '1px solid #374151'
                }}
              >
                <ControlButton
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                >
                  {isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
                </ControlButton>
              </Controls>
              <MiniMap 
                style={{
                  background: '#1f2937',
                  border: '1px solid #374151'
                }}
                nodeColor="#60a5fa"
              />
              <style>{`
                /* Hide React Flow attribution */
                .react-flow__attribution {
                  display: none !important;
                }
              `}</style>
            </ReactFlow>
          </div>
        </div>
      </Card>

      {/* Service Map Bottom Drawer */}
      <ServiceMapBottomDrawer
        infrastructure={selectedInfrastructure}
        isOpen={isServiceMapOpen}
        onClose={handleCloseServiceMap}
      />
    </div>
  );
});

InfrastructureMapInner.displayName = 'InfrastructureMapInner';

// Wrapper with ReactFlowProvider
export const InfrastructureMap = forwardRef<any, InfrastructureMapProps>((props, ref) => {
  return (
    <ReactFlowProvider>
      <InfrastructureMapInner {...props} ref={ref} />
    </ReactFlowProvider>
  );
});

InfrastructureMap.displayName = 'InfrastructureMap';

