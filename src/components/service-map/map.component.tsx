import React, { useMemo, useState, useCallback, useRef } from 'react';
import { Card, Dropdown, Input, Tree, Button } from 'antd';
import { AppstoreOutlined, SearchOutlined, CloseOutlined, ContainerOutlined, ApiOutlined, DatabaseOutlined, CloudServerOutlined } from '@ant-design/icons';
import MapLayer from '../../components/service-map/layer.component';
import { LayerKey, TreeNode } from '../../interfaces/service-map/service-map.interface';
import { Handle, Position } from 'reactflow';
import { Region, Application, Infrastructure, Service, ServiceMapData } from '../../api/service/interface.service';

// ---------- Renk ve durum yardımcıları ----------
const cardBg = (hex: string) =>
  `linear-gradient(180deg, ${hex} 0%, rgba(6,10,19,0.9) 100%)`;

// ---------- Ortak Detail Panel ----------
export const DetailPanel: React.FC<{ 
  content?: React.ReactNode;
}> = ({ content }) => {
  if (!content) return null;

  return (
    <div
      style={{
        position: 'absolute',
        width: '350px',
        background: 'rgba(30, 41, 59, 0.95)',
        border: '1px solid #334155',
        borderRadius: '12px',
        padding: '20px',
        color: '#ffffff',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        backdropFilter: 'blur(10px)',
        zIndex: 1000
      }}
    >
      {content}
    </div>
  );
};


// ---------- Renk ve durum yardımcıları ----------
export const statusColor = (s?: string) =>
  s === 'ok' || s === 'healthy'
    ? '#22c55e'
    : s === 'warning' || s === 'degraded'
    ? '#f59e0b'
    : s === 'error'
    ? '#ef4444'
    : '#6b7280';
export const statusPercentage = (s?: string, errorPercentage?: number, warningPercentage?: number, degradedPercentage?: number) =>
  s === 'degraded' ? degradedPercentage
    : s === 'warning'
    ? warningPercentage
    : s === 'error'
    ? errorPercentage
    : 0;


// ---------- İzometrik blok node ----------
export const InfraIsoBlockNode: React.FC<any> = ({ data }) => {
  const accent = data?.accent || '#22c55e';
  const label = data?.label || 'node';
  const sub = data?.sub || 'aa';
  const baseW = data?.w ?? 120;
  const baseH = data?.h ?? 160; // blok yüksekliği (yan yüzler)
  const W = Math.max(8, Math.round(baseW * 0.5));
  const H = Math.max(8, Math.round(baseH * 0.5));
  const k = W / baseW; // ölçek

  const wrap: React.CSSProperties = {
    position: 'relative',
    top: 80,
    left: 40,
    width: Math.round(W + 40 * k),
    height: Math.round(H + 80 * k),
    filter: 'drop-shadow(0 14px 28px rgba(0,0,0,0.6))'
  };

  // Sağ ve sol yan yüzler: paralelkenar (skew)
  const sideCommon: React.CSSProperties = {
    position: 'absolute',
    top: Math.round(50 * k),
    width: W,
    height: H,
    background: 'linear-gradient(180deg, #e5e7eb 0%, #cbd5e1 100%)',
    border: '1px solid rgba(148,163,184,0.7)'
  };
  const right: React.CSSProperties = {
    ...sideCommon,
    left: Math.round(40 * k) + 20,
    top: Math.round(50 * k)+ 20,
    transform: 'skewY(-28deg)',
    background: 'linear-gradient(180deg, #dbeafe 0%, #c7d2fe 100%)'
  };
  const left: React.CSSProperties = {
    ...sideCommon,
    left: -40 + 20,
    top: Math.round(50 * k)+ 20,
    transform: 'skewY(28deg)',
    background: 'linear-gradient(180deg, #e2e8f0 0%, #cbd5e1 100%)'
  };
  const rightBack: React.CSSProperties = {
    ...sideCommon,
    left: Math.round(-80 * k) + 20,
    top: Math.round(50 * k) - 15,
    transform: 'skewY(-28deg)',
    background: 'linear-gradient(180deg, #dbeafe 0%, #c7d2fe 100%)'
  };
  const leftBack: React.CSSProperties = {
    ...sideCommon,
    left: 20 + 20,
    top: Math.round(50 * k) - 15,
    transform: 'skewY(28deg)',
    background: 'linear-gradient(180deg, #e2e8f0 0%, #cbd5e1 100%)'
  };

  const badge: React.CSSProperties = {
    position: 'absolute',
    top: -50,
    left: -6,
    background: accent,
    color: '#0b1220',
    fontWeight: 700,
    fontSize: 11,
    padding: '4px 8px',
    borderRadius: 6
  };

  const title: React.CSSProperties = {
    position: 'absolute',
    bottom: -50,
    left: '50%',
    transform: 'translateX(-50%)',
    color: '#e2e8f0',
    fontWeight: 600,
    fontSize: 14,
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    padding: '2px 4px',
    borderRadius: '4px'
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.textDecoration = 'underline';
    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.textDecoration = 'none';
    e.currentTarget.style.backgroundColor = 'transparent';
  };

  return (
    // <div>test</div>
    <div style={wrap}>
      {sub && <div style={badge}>{sub}</div>}
      <div style={rightBack} />
      <div style={left} />
      <div style={leftBack} />
      <div style={right} />
      {/* <div style={top} /> */}
      <div 
        style={title}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {label}
      </div>
      <Handle type="source" position={Position.Right} id="r" style={{ opacity: 0 }} />
      <Handle type="target" position={Position.Left} id="l" style={{ opacity: 0 }} />
    </div>
  );
};

// Application block - cooler blue/purple theme
export const ApplicationIsoBlockNode: React.FC<any> = ({ data }) => {
  const accent = data?.accent || '#3b82f6';
  const label = data?.label || 'application';
  const sub = data?.sub || '';
  const imageUrl = data?.imageUrl;
  const baseW = data?.w ?? 120;
  const baseH = data?.h ?? 160;
  const W = Math.max(8, Math.round(baseW * 0.5));
  const H = Math.max(8, Math.round(baseH * 0.5));
  const k = W / baseW;

  const wrap: React.CSSProperties = {
    position: 'relative',
    top: 80,
    left: 40,
    width: Math.round(W + 40 * k),
    height: Math.round(H + 80 * k),
    filter: 'drop-shadow(0 14px 28px rgba(0,0,0,0.6))'
  };

  const badge: React.CSSProperties = { position: 'absolute', top: -50, left: -6, background: accent, color: '#0b1220', fontWeight: 700, fontSize: 11, padding: '4px 8px', borderRadius: 6 };
  const title: React.CSSProperties = { position: 'absolute', bottom: -50, left: '50%', transform: 'translateX(-50%)', color: '#e2e8f0', fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap', cursor: 'pointer', transition: 'all 0.2s ease', padding: '2px 4px', borderRadius: '4px' };

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => { e.currentTarget.style.textDecoration = 'underline'; e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'; };
  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => { e.currentTarget.style.textDecoration = 'none'; e.currentTarget.style.backgroundColor = 'transparent'; };

  return (
    <div style={wrap}>
      {sub && <div style={badge}>{sub}</div>}
      {imageUrl && (
        <img
          src={imageUrl}
          alt={label}
          style={{
            position: 'absolute',
            top: 1,
            width: 100,
            height: 120,
            objectFit: 'contain',
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.35))',
            background: '#ffffff',
            borderRadius: 40,
            padding: 2,
            border: '1px solid rgba(148,163,184,0.25)'
          }}
        />
      )}
      <div 
        style={title}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {label}
      </div>
      <Handle type="source" position={Position.Right} id="r" style={{ opacity: 0 }} />
      <Handle type="target" position={Position.Left} id="l" style={{ opacity: 0 }} />
    </div>
  );
};

// Service block - green/health theme
export const ServiceIsoBlockNode: React.FC<{ data: Service; selected?: boolean }> = ({ data, selected }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return '#10b981';
      case 'warning': return '#f59e0b';
      case 'critical': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'platform': return <CloudServerOutlined />;
      case 'database': return <DatabaseOutlined />;
      case 'api': return <ApiOutlined />;
      case 'container': return <ContainerOutlined />;
      default: return <CloudServerOutlined />;
    }
  };

  // Safeguards for optional props
  const safeStatus = data?.status?.value.toLowerCase() || 'healthy';
  const safeType = data?.type.toLowerCase() || 'api';

  return (
    <div
      style={{
        background: 'linear-gradient(145deg, #1e293b, #334155)',
        border: `2px solid ${getStatusColor(safeStatus)}`,
        borderRadius: '12px',
        padding: '16px',
        minWidth: '180px',
        boxShadow: selected 
          ? `0 0 20px ${getStatusColor(safeStatus)}40` 
          : '0 4px 12px rgba(0,0,0,0.3)',
        transform: selected ? 'scale(1.05)' : 'scale(1)',
        transition: 'all 0.2s ease',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* 3D Effect Background */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '30%',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.1), transparent)',
          borderRadius: '12px 12px 0 0'
        }}
      />
      
      {/* Status Indicator */}
      <div
        style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: getStatusColor(safeStatus),
          boxShadow: `0 0 8px ${getStatusColor(safeStatus)}`
        }}
      />
      
      {/* Node Content */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <div style={{ color: getStatusColor(safeStatus), fontSize: '16px' }}>
            {getTypeIcon(safeType)}
          </div>
          <div style={{ color: '#ffffff', fontWeight: 'bold', fontSize: '14px' }}>
            {data?.name}
          </div>
        </div>
        
      {/* Metrics */}
      {data?.metrics && (
        <div
          style={{
            marginTop: '10px',
            paddingTop: '8px',
            borderTop: '1px solid rgba(255,255,255,0.06)'
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            <div>
              <div style={{ color: '#94a3b8', fontSize: '10px' }}>Avg. Lat</div>
              <div style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '12px' }}>{data.metrics.avgDurationMs.toFixed(2)} ms</div>
            </div>
            <div>
              <div style={{ color: '#94a3b8', fontSize: '10px' }}>Min. Lat</div>
              <div style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '12px' }}>{data.metrics.minDurationMs.toFixed(2)} ms</div>
            </div>
            <div>
              <div style={{ color: '#94a3b8', fontSize: '10px' }}>Max. Lat</div>
              <div style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '12px' }}>{data.metrics.maxDurationMs.toFixed(2)} ms</div>
            </div>
            <div>
              <div style={{ color: '#94a3b8', fontSize: '10px' }}>Calls</div>
              <div style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '12px' }}>{data.metrics.callsCount}</div>
            </div>
          </div>
        </div>
      )}
      </div>
      
      {/* Handles */}
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: getStatusColor(safeStatus), border: 'none' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: getStatusColor(safeStatus), border: 'none' }}
      />
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: getStatusColor(safeStatus), border: 'none' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: getStatusColor(safeStatus), border: 'none' }}
      />
    </div>
  );
};

// ---------- Grup node (zone/cluster çerçevesi) ----------
export const GroupNode: React.FC<any> = ({ data }) => {
  const { label, groupSize, accent = '#6b7fa4' } = data || {};
  const w = groupSize?.width || 560;
  const h = groupSize?.height || 300;
  
  return (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: 14,
        border: `1px dashed ${accent}60`,
        background:
          'repeating-linear-gradient(45deg, rgba(34,48,71,0.2), rgba(34,48,71,0.2) 10px, rgba(34,48,71,0.25) 10px, rgba(34,48,71,0.25) 20px)',
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.04)'
      }}
    >
      <div
        style={{
          position: 'absolute',
          bottom: -18,
          left: 12,
          color: '#a3b2cc',
          fontSize: 12,
          background: '#0b1220',
          padding: '4px 8px',
          borderRadius: 8,
          border: '1px solid rgba(163,178,204,0.18)'
        }}
      >
        {label}
      </div>
    </div>
  );
};

// ========== Layout yardımcıları ==========
// Basit grid yerleşim: parent içinde satır/sütun
export function gridLayout(
  count: number,
  startX: number,
  startY: number,
  cols: number,
  gapX = 140,
  gapY = 140
) {
  const pos: { x: number; y: number }[] = [];
  for (let i = 0; i < count; i++) {
    const r = Math.floor(i / cols);
    const c = i % cols;
    pos.push({ x: startX + c * gapX, y: startY + r * gapY });
  }
  return pos;
}


interface ServiceMapComponentProps {
  data: ServiceMapData;
}

const ServiceMapComponent: React.FC<ServiceMapComponentProps> = ({ data }) => {
  const [layer, setLayer] = useState<LayerKey>('infra');
  const [searchValue, setSearchValue] = useState('');
  const [selectedKey, setSelectedKey] = useState<string>('');
  const [selectedNodeId, setSelectedNodeId] = useState<string>('');
  const [detailPanelContent, setDetailPanelContent] = useState<React.ReactNode>(null);
  const infraLayerRef = useRef<any>(null);
  const applicationLayerRef = useRef<any>(null);
  const serviceLayerRef = useRef<any>(null);
  
  const treeData = useMemo(() => {
    try {
      const regions = data?.regions || [];

      console.log('regions', regions);
      const nodes: TreeNode[] = [];
      
      regions.forEach((region: Region) => {
        const regionNode: TreeNode = {
          title: region.name,
          key: `region-${region.id}`,
          type: 'infra',
          children: []
        };
        
        (region.infrastructures || []).forEach((infra: Infrastructure) => {
          const infraNode: TreeNode = {
            title: infra.name,
            key: `infra-${infra.id}`,
            type: 'infra',
            children: []
          };
          
          (infra.applications || []).forEach((app: Application) => {
            const appNode: TreeNode = {
              title: app.name,
              key: `app-${app.id}`,
              type: 'application',
              children: []
            };
            
            infraNode.children!.push(appNode);
          });
          
          (infra.services || []).forEach((service: Service) => {
              const serviceNode: TreeNode = {
                title: service.name,
                key: `service-${service.id}`,
                type: 'service',
                children: []
              };
              
            infraNode.children!.push(serviceNode);
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
  }, [data]);

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
        nodeId = `group::${key.replace('region-', '')}`;
        setLayer('infra');
      } else if (key.startsWith('infra-')) {
        nodeId = `group::${key.replace('infra-', '')}`;
        setLayer('application');
      } else if (key.startsWith('app-')) {
        nodeId = `group::${key.replace('app-', '')}`;
        setLayer('service');
      } else if (key.startsWith('service-')) {
        nodeId = `${key.replace('service-', '')}`;
        setLayer('service');
      }
      setSelectedNodeId(nodeId);
      
      // Zoom ve fit işlemi için timeout (layer değişiminden sonra)
      setTimeout(() => {
        const currentRef = layer === 'application' ? applicationLayerRef.current :
                          layer === 'service' ? serviceLayerRef.current : infraLayerRef.current;
        
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

  const handleNodeClick = useCallback((nodeId: string, nodeType: string, newLayer?: string) => {
    // console.log('handleInfraNodeClick called with:', nodeId, nodeType, newLayer);
    
    if (nodeType === 'layer-change' && newLayer) {
      // Handle layer change from detail panel
      setLayer(newLayer as LayerKey);
      setSelectedKey('');
      setSelectedNodeId('');
      
      // Zoom out to show full map for the new layer
      setTimeout(() => {
        const currentRef = newLayer === 'application' ? applicationLayerRef.current :
                          newLayer === 'service' ? serviceLayerRef.current : infraLayerRef.current;
        
        if (currentRef && currentRef.zoomToNode) {
          currentRef.zoomToNode('');
        }
      }, 100);
      return;
    }
    
    if (nodeType === 'clear') {
      // Clear selection - sadece zoom out yap, layer değiştirme
      setSelectedKey('');
      setSelectedNodeId('');
      
      // Mevcut layer'da zoom out yap
      setTimeout(() => {
        if (layer === 'infra') {
          const currentRef = infraLayerRef.current;
          if (currentRef && currentRef.zoomToNode) {
            currentRef.zoomToNode('');
          }
        } else if (layer === 'application') {
          const currentRef = applicationLayerRef.current;
          if (currentRef && currentRef.zoomToNode) {
            currentRef.zoomToNode('');
          }
        } else if (layer === 'service') {
          const currentRef = serviceLayerRef.current;
          if (currentRef && currentRef.zoomToNode) {
            currentRef.zoomToNode('');
          }
        } 
      }, 100);
    } else {
      // Normal node selection - sadece infra layer'da
      if (nodeType === 'infra') {
        setSelectedKey(nodeId);
        setSelectedNodeId(nodeId);
        setLayer('infra');
        
        // Zoom to node
        setTimeout(() => {
          const currentRef = infraLayerRef.current;
          if (currentRef && currentRef.zoomToNode) {
            // console.log('Zooming to node:', nodeId);
            currentRef.zoomToNode(nodeId);
          }
        }, 100);
      } else if (nodeType === 'application') {
        // Application node selection - sadece application layer'da
        setSelectedKey(nodeId);
        setSelectedNodeId(nodeId);
        setLayer('application');
        
        // Zoom to node
        setTimeout(() => {
          const currentRef = applicationLayerRef.current;
          if (currentRef && currentRef.zoomToNode) {
            // console.log('Zooming to application:', nodeId);
            currentRef.zoomToNode(nodeId);
          }
        }, 100);
      } else if (nodeType === 'service') {
        // Service node selection - sadece service layer'da
        setSelectedKey(nodeId);
        setSelectedNodeId(nodeId);
        setLayer('service');
        
        // Zoom to node
        setTimeout(() => {
          const currentRef = serviceLayerRef.current;
          if (currentRef && currentRef.zoomToNode) {
            // console.log('Zooming to service:', nodeId);
            currentRef.zoomToNode(nodeId);
          }
        }, 100);
      }
    }
  }, [clearSelection, layer]);

  const handleClick = useCallback((id: string, targetLayer?: string, isItem: boolean = false) => {

    setLayer(targetLayer as LayerKey);
    setSelectedKey('');
    setSelectedNodeId('');

    setTimeout(() => {
      let currentRef: any;

      if (targetLayer === 'application') {
        currentRef = applicationLayerRef.current;
      } else if (targetLayer === 'service') {
        currentRef = serviceLayerRef.current;
      } else {
        currentRef = infraLayerRef.current;
      }

      if (currentRef && currentRef.zoomToNode) {
        const nodeId = isItem ? id : `group::${id}`;
        // console.log('click to node:', nodeId);
        currentRef.zoomToNode(nodeId);
      }
    }, 100);
  }, []);

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
    <div style={{ paddingBottom: 100, height: '90vh', overflow: 'hidden' }}>
      {/* Override React Flow default width for group nodes */}
      <style>{`
        .react-flow__node-group { width: auto !important; }
      `}</style>
      <Card style={{ background: '#0f172a', borderColor: '#1f2937', height: '80vh' }} styles={{ body: { padding: 0, height: '100%' } }}>
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
                {layer === 'application' ? 'Application Layer' :
                 layer === 'service' ? 'Service Layer' : 'Infrastructure Layer'}
              </div>
              <div style={{ opacity: 0.7, fontSize: 11 }}>
                {layer === 'application' ? (
                  <>
                    <span 
                      style={{ cursor: 'pointer', textDecoration: 'underline', color: '#60a5fa' }}
                      onClick={() => {
                        setLayer('infra');
                        setTimeout(() => {
                          const currentRef = infraLayerRef.current;
                          if (currentRef && currentRef.zoomToNode) {
                            currentRef.zoomToNode('');
                          }
                        }, 100);
                      }}
                    >
                      Infrastructures
                    </span>
                    {' → '}
                    <span 
                      style={{ cursor: 'pointer', textDecoration: 'underline', color: '#60a5fa' }}
                      onClick={() => {
                        setLayer('application');
                        setTimeout(() => {
                          const currentRef = applicationLayerRef.current;
                          if (currentRef && currentRef.zoomToNode) {
                            currentRef.zoomToNode('');
                          }
                        }, 100);
                      }}
                    >
                      Applications
                    </span>
                  </>
                ) : layer === 'service' ? (
                  <>
                    <span 
                      style={{ cursor: 'pointer', textDecoration: 'underline', color: '#60a5fa' }}
                      onClick={() => {
                        setLayer('application');
                        setTimeout(() => {
                          const currentRef = applicationLayerRef.current;
                          if (currentRef && currentRef.zoomToNode) {
                            currentRef.zoomToNode('');
                          }
                        }, 100);
                      }}
                    >
                      Applications
                    </span>
                    {' → '}
                    <span 
                      style={{ cursor: 'pointer', textDecoration: 'underline', color: '#60a5fa' }}
                      onClick={() => {
                        setLayer('service');
                        setTimeout(() => {
                          const currentRef = serviceLayerRef.current;
                          if (currentRef && currentRef.zoomToNode) {
                            currentRef.zoomToNode('');
                          }
                        }, 100);
                      }}
                    >
                      Services
                    </span>
                  </>
                ) : (
                  <>
                    <span 
                      style={{ cursor: 'pointer', textDecoration: 'underline', color: '#60a5fa' }}
                      onClick={() => {
                        setLayer('infra');
                        setTimeout(() => {
                          const currentRef = infraLayerRef.current;
                          if (currentRef && currentRef.zoomToNode) {
                            currentRef.zoomToNode('');
                          }
                        }, 100);
                      }}
                    >
                      Regions
                    </span>
                    {' → '}
                    <span 
                      style={{ cursor: 'pointer', textDecoration: 'underline', color: '#60a5fa' }}
                      onClick={() => {
                        setLayer('infra');
                        setTimeout(() => {
                          const currentRef = infraLayerRef.current;
                          if (currentRef && currentRef.zoomToNode) {
                            currentRef.zoomToNode('');
                          }
                        }, 100);
                      }}
                    >
                      Infrastructures
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

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

          {/* TreeView Search - Sağ Üst */}
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

          {/* Detail Panel - Sol Orta */}
          {detailPanelContent && (
            <div style={{ position: 'absolute', left: 12, top: 80, maxHeight: '100px' }}>
              {detailPanelContent}
            </div>
          )}

          <div style={{ position: 'absolute', inset: 0 }}>
            {layer === 'infra' && (
            <MapLayer 
              ref={infraLayerRef}
              selectedNodeId={selectedNodeId} 
              onNodeClick={handleNodeClick} 
              onButtonClick={handleClick} 
              setDetailPanelContent={setDetailPanelContent} 
              data={data}
              layer={layer}
            />
            )}
            {layer === 'application' && (
            <MapLayer 
              ref={applicationLayerRef}
              selectedNodeId={selectedNodeId} 
              onNodeClick={handleNodeClick} 
              onButtonClick={handleClick} 
              setDetailPanelContent={setDetailPanelContent} 
              data={data}
              layer={layer}
            />
            )}
            {layer === 'service' && (
            <MapLayer 
              ref={serviceLayerRef}
              selectedNodeId={selectedNodeId} 
              onNodeClick={handleNodeClick} 
              onButtonClick={handleClick} 
              setDetailPanelContent={setDetailPanelContent} 
              data={data}
              layer={layer}
            />
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ServiceMapComponent;


