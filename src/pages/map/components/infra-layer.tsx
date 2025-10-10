import React, { useMemo, useCallback, useRef, forwardRef, useImperativeHandle, useEffect } from 'react';
import {
  ReactFlowProvider,
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Panel,
  Node,
  Edge,
  Handle,
  Position
} from 'reactflow';
import 'reactflow/dist/style.css';
import infra from '../data/map.json'; // <= JSON’i buradan içeri alıyoruz (gerekirse yolu değiştir)

// ---------- Tipler ----------
type Operation = {
  name: string;
  method: string;
  path?: string;
  avg_latency_ms?: number;
  p95_ms?: number;
  status?: 'ok' | 'warning' | 'error';
};

type Service = {
  name: string;
  kind: string;
  port: number;
  health: 'healthy' | 'degraded' | 'warning';
  replicas?: number;
  dependencies?: string[];
  metrics?: Record<string, number>;
  operations?: Operation[];
};

type Application = {
  name: string;
  platform: string;
  version: string;
  status: 'running' | 'stopped' | 'warning';
  services: Service[];
};

type Host = {
  id: string;
  name: string;
  type: string;
  os: string;
  region: string;
  ip: string;
  cpu: { cores: number; usage_pct: number };
  memory: { used_gb: number; total_gb: number };
  status: 'healthy' | 'warning' | 'error' | 'degraded';
  tags?: string[];
  applications: Application[];
  position?: { x: number; y: number };
};

type InfraJSON = {
  schema_version: string;
  generated_at: string;
  infrastructure: Host[];
};

// Yeni şema (opsiyonel): regions -> infrastructures -> applications -> services -> operations
type RegionSchema = {
  name: string;
  infrastructures: Host[]; // Host ile aynı alanlar
  position?: { x: number; y: number };
};
type InfraJSONV2 = {
  schema_version: string;
  generated_at: string;
  regions: RegionSchema[];
};

// ---------- Renk ve durum yardımcıları ----------
const statusColor = (s?: string) =>
  s === 'ok' || s === 'healthy'
    ? '#22c55e'
    : s === 'warning' || s === 'degraded'
    ? '#f59e0b'
    : s === 'error'
    ? '#ef4444'
    : '#6b7280';

const cardBg = (hex: string) =>
  `linear-gradient(180deg, ${hex} 0%, rgba(6,10,19,0.9) 100%)`;

// ---------- İzometrik blok node ----------
const IsoBlockNode: React.FC<any> = ({ data }) => {
  const accent = data?.accent || '#22c55e';
  const label = data?.label || 'node';
  const sub = data?.sub || '';
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

  // Üst yüz: hexagon (clip-path)
  // const top: React.CSSProperties = {
  //   position: 'absolute',
  //   left: Math.round(0 * k),
  //   top: 0,
  //   width: W,
  //   height: Math.round(70 * k),
  //   background: 'linear-gradient(180deg, #eef2ff 0%, #e2e8f0 100%)',
  //   border: '1px solid rgba(148,163,184,0.8)',
  //   clipPath: 'polygon(15% 0%, 85% 0%, 100% 50%, 85% 100%, 15% 100%, 0% 50%)'
  // };

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

// ---------- Grup node (zone/cluster çerçevesi) ----------
const GroupNode: React.FC<any> = ({ data }) => {
  const { label, w = 560, h = 300, accent = '#6b7fa4' } = data || {};
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

// ---------- Infrastructure Detail Panel ----------
const InfrastructureDetailPanel: React.FC<{ 
  host: Host | null; 
}> = ({ host }) => {
  if (!host) return null;

  const { name, ip, os, cpu, memory, applications, status } = host;

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
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px',
        paddingBottom: '12px',
        borderBottom: '1px solid #334155'
      }}>
        <div>
          <h3 style={{ 
            color: '#ffffff', 
            margin: 0, 
            fontSize: '16px',
            fontWeight: 'bold'
          }}>
            {name}
          </h3>
          <div style={{
            background: '#64748b',
            color: '#ffffff',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '10px',
            marginTop: '4px',
            display: 'inline-block'
          }}>
            INFRASTRUCTURE
          </div>
        </div>
      </div>

      {/* Infrastructure Info */}
      <div style={{ marginBottom: '16px' }}>
        <h4 style={{ color: '#ffffff', margin: '0 0 8px 0', fontSize: '14px' }}>Infrastructure</h4>
        <div style={{ color: '#94a3b8', fontSize: '12px', lineHeight: '1.4' }}>
          <div><strong>IP:</strong> {ip || 'N/A'}</div>
          <div><strong>OS:</strong> {os || 'N/A'}</div>
          <div><strong>Type:</strong> {host.type || 'server'}</div>
        </div>
      </div>

      {/* System Resources */}
      <div style={{ marginBottom: '16px' }}>
        <h4 style={{ color: '#ffffff', margin: '0 0 8px 0', fontSize: '14px' }}>System Resources</h4>
        <div style={{ color: '#94a3b8', fontSize: '12px', lineHeight: '1.4' }}>
          <div><strong>CPU Usage:</strong> {cpu?.usage_pct ?? 0}%</div>
          <div><strong>Memory:</strong> {memory?.used_gb ?? 0}/{memory?.total_gb ?? 0} GB</div>
          <div><strong>Memory Usage:</strong> {memory?.total_gb ? Math.round(((memory?.used_gb ?? 0) / memory.total_gb) * 100) : 0}%</div>
        </div>
      </div>

      {/* Status */}
      <div style={{ 
        marginBottom: '20px',
        padding: '12px',
        background: status === 'healthy' ? 'rgba(16, 185, 129, 0.1)' : 
                   status === 'warning' ? 'rgba(245, 158, 11, 0.1)' : 
                   'rgba(239, 68, 68, 0.1)',
        border: `1px solid ${status === 'healthy' ? '#10b981' : 
                           status === 'warning' ? '#f59e0b' : '#ef4444'}`,
        borderRadius: '8px'
      }}>
        <div style={{ 
          color: status === 'healthy' ? '#10b981' : 
                 status === 'warning' ? '#f59e0b' : '#ef4444',
          fontWeight: 'bold',
          fontSize: '14px',
          marginBottom: '4px'
        }}>
          {status?.toUpperCase() || 'UNKNOWN'}
        </div>
        <div style={{ color: '#94a3b8', fontSize: '12px' }}>
          System status monitoring active
        </div>
      </div>

      {/* Applications */}
      {applications && applications.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ color: '#ffffff', margin: '0 0 12px 0', fontSize: '14px' }}>Applications</h4>
          <div style={{ 
            background: 'rgba(15, 23, 42, 0.8)',
            padding: '12px',
            borderRadius: '8px',
            maxHeight: '200px',
            overflowY: 'auto'
          }}>
            {applications.map((app, index) => (
              <div key={index} style={{ 
                marginBottom: index < applications.length - 1 ? '12px' : '0',
                paddingBottom: index < applications.length - 1 ? '12px' : '0',
                borderBottom: index < applications.length - 1 ? '1px solid #334155' : 'none'
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  marginBottom: '6px'
                }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: app.platform === 'java' ? '#f59e0b' : 
                               app.platform === 'go' ? '#10b981' : 
                               app.platform === 'node' ? '#3b82f6' : '#64748b'
                  }} />
                  <span style={{ color: '#ffffff', fontWeight: 'bold', fontSize: '13px' }}>
                    {app.name}
                  </span>
                  <span style={{
                    background: '#64748b',
                    color: '#ffffff',
                    padding: '2px 6px',
                    borderRadius: '3px',
                    fontSize: '10px'
                  }}>
                    {app.platform}
                  </span>
                </div>
                {app.services && app.services.length > 0 && (
                  <div style={{ marginLeft: '16px' }}>
                    {app.services.map((service, sIndex) => (
                      <div key={sIndex} style={{ 
                        color: '#94a3b8', 
                        fontSize: '11px',
                        marginBottom: '2px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <span style={{ color: '#64748b' }}>•</span>
                        {service.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ 
        display: 'flex', 
        gap: '8px',
        background: 'rgba(15, 23, 42, 0.8)',
        padding: '12px',
        borderRadius: '8px'
      }}>
        <button style={{
          flex: 1,
          background: 'rgba(30, 41, 59, 0.8)',
          border: '1px solid #334155',
          borderRadius: '6px',
          padding: '8px 12px',
          color: '#ffffff',
          fontSize: '12px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px'
        }}>
          📊 Logs
        </button>
        <button style={{
          flex: 1,
          background: 'rgba(30, 41, 59, 0.8)',
          border: '1px solid #334155',
          borderRadius: '6px',
          padding: '8px 12px',
          color: '#ffffff',
          fontSize: '12px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px'
        }}>
          📈 Metrics
        </button>
        <button style={{
          flex: 1,
          background: 'rgba(30, 41, 59, 0.8)',
          border: '1px solid #334155',
          borderRadius: '6px',
          padding: '8px 12px',
          color: '#ffffff',
          fontSize: '12px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px'
        }}>
          🔍 Traces
        </button>
      </div>
    </div>
  );
};

// ========== Layout yardımcıları ==========
// Basit grid yerleşim: parent içinde satır/sütun
function gridLayout(
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

// ID yardımcıları
const idHost = (h: Host) => h.id;
// Uygulama/servis/operasyon id yardımcıları bu layer'da kullanılmıyor (yalın altyapı görünümü)

// ========== Ana İç Bileşen ==========
interface InfraLayerProps {
  selectedNodeId?: string;
  onNodeClick?: (nodeId: string, nodeType: string) => void;
}

const InfraInner = forwardRef<any, InfraLayerProps>(({ selectedNodeId, onNodeClick }, ref) => {
  // İlk açılışta localStorage'dan veri al, yoksa JSON'dan al
  const getInitialData = () => {
    const stored = localStorage.getItem('infra-map-data');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.warn('localStorage data corrupted, using JSON fallback');
        return infra;
      }
    }
    return infra;
  };

  const raw: any = getInitialData();
  // Açılış flag'i: true → otomatik hesapla, false → JSON pozisyonlarını kullan
  const USE_AUTO_LAYOUT = false;
  const regionsRef = useRef<any>(null);

  // Region bazlı veri: V2 (regions) varsa onu kullan, yoksa V1'den inşa et
  let regions: Array<[string, Host[]]> = [];
  if (Array.isArray(raw?.regions)) {
    const v2 = raw as InfraJSONV2;
    regions = v2.regions.map((r) => [r.name, r.infrastructures] as [string, Host[]]);
    regionsRef.current = v2.regions; // canlı kopya
  } else {
    const v1 = raw as InfraJSON;
    const hosts = v1.infrastructure || [];
    regions = Array.from(
      hosts.reduce((m, h) => m.set(h.region || 'unknown', [...(m.get(h.region || 'unknown') || []), h]), new Map<string, Host[]>())
    );
  }
  // Region yerleşimi manuel (üst üste gelmeyi önlemek için sıra ile yerleştiriyoruz)

  // Node & Edge üretimi (yalnızca region ve host blokları, edges yok)
  const { initialNodes, initialEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Akış yerleşim parametreleri
    const outerMarginX = 60;
    const outerMarginY = 60;
    const regionGapX = 40;
    const regionGapY = 60;
    const maxCols = 3; // aynı satırda en fazla 3 region
    let cursorX = outerMarginX;
    let cursorY = outerMarginY;
    let colIndex = 0;
    let rowMaxHeight = 0;

    regions.forEach(([regionName, regionHosts]) => {
      const groupId = `region::${regionName}`;
      const startX = 24;
      const startY = 24;
      const cellGapX = 220;
      const cellGapY = 280;
      const blockW = 140;
      const blockH = 180;

      if (USE_AUTO_LAYOUT) {
        // Dinamik yerleşim: en fazla 3 sütun, satırlar otomatik
        const cols = Math.min(3, Math.max(1, regionHosts.length));
        const rows = Math.max(1, Math.ceil(regionHosts.length / cols));

        const groupW = startX * 2 + cols * blockW + (cols - 1) * (cellGapX - blockW);
        const groupH = startY * 2 + rows * blockH + (rows - 1) * (cellGapY - blockH) + 60;

        if (colIndex >= maxCols) {
          colIndex = 0;
          cursorX = outerMarginX;
          cursorY += rowMaxHeight + regionGapY;
          rowMaxHeight = 0;
        }

        nodes.push({
          id: groupId,
          type: 'group',
          position: { x: cursorX, y: cursorY },
          data: { label: regionName, w: groupW, h: groupH, accent: '#6b7fa4' },
          style: { background: 'transparent' }
        } as any);

        const itemPositions = gridLayout(regionHosts.length, startX, startY, cols, cellGapX, cellGapY);
        regionHosts.forEach((h, hi) => {
          nodes.push({
            id: idHost(h),
            type: 'iso',
            position: itemPositions[hi],
            data: {
              label: h.name.split(' - ')[0],
              sub: `${h.status ?? 'healthy'} ${h.cpu?.usage_pct ?? 0}%`,
              accent: statusColor(h.status),
              w: 120,
              h: 160
            },
            parentNode: groupId,
            extent: 'parent'
          });
        });

        cursorX += groupW + regionGapX;
        rowMaxHeight = Math.max(rowMaxHeight, groupH);
        colIndex += 1;
      } else {
        // JSON'daki kaydedilmiş pozisyonları kullan
        const regionPos = (raw.regions || []).find((r: any) => r.name === regionName)?.position || { x: cursorX, y: cursorY };
        // Grupların genişliği/yüksekliği: host pozisyonlarının bounding box'ına göre
        const hostPositions = regionHosts.map((h) => h.position || { x: startX, y: startY });
        const maxX = Math.max(startX, ...hostPositions.map((p) => p.x));
        const maxY = Math.max(startY, ...hostPositions.map((p) => p.y));
        const groupW = startX * 2 + maxX + blockW - startX; // startX'i iki kez eklememek için
        const groupH = startY * 2 + maxY + blockH + 60 - startY; // startY'i iki kez eklememek için

      nodes.push({
          id: groupId,
          type: 'group',
          position: regionPos,
          data: { label: regionName, w: groupW, h: groupH, accent: '#6b7fa4' },
          style: { background: 'transparent' }
        } as any);

        regionHosts.forEach((h) => {
          const pos = h.position || { x: startX, y: startY };
          nodes.push({
            id: idHost(h),
            type: 'iso',
            position: pos,
            data: {
              label: h.name.split(' - ')[0],
              sub: `${h.status ?? 'healthy'} ${h.cpu?.usage_pct ?? 0}%`,
              accent: statusColor(h.status),
              w: 120,
              h: 160
            },
            parentNode: groupId,
            extent: 'parent'
          });
        });
      }
    });

    return { initialNodes: nodes, initialEdges: edges };
  }, [regions]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);
  const reactFlowInstance = useRef<any>(null);

  // nodeTypes'i memoize et
  const nodeTypes = useMemo(() => ({
    iso: IsoBlockNode,
    group: GroupNode
  }), []);

  // Seçili node için host bilgisini bul
  const selectedHost = useMemo(() => {
    if (!selectedNodeId) return undefined;
    const allHosts = regions.flatMap(([, hosts]) => hosts);
    return allHosts.find(host => host.id === selectedNodeId || host.name === selectedNodeId);
  }, [selectedNodeId, regions]);

  // Zoom to node fonksiyonu
  const zoomToNode = useCallback((nodeId: string) => {
    if (reactFlowInstance.current) {
      if (!nodeId || nodeId === '') {
        // Boş string ise tüm view'a fit yap
        reactFlowInstance.current.fitView({
          padding: 0.1,
          duration: 800
        });
      } else {
        // Node'u bul
        const node = nodes.find(n => n.id === nodeId || n.data?.label === nodeId);
        if (node) {
          // Node'a zoom yap
          reactFlowInstance.current.fitView({
            nodes: [{ id: node.id }],
            padding: 0.1,
            duration: 800
          });
        } else {
          // Node bulunamazsa tüm view'a fit yap
          reactFlowInstance.current.fitView({
            padding: 0.1,
            duration: 800
          });
        }
      }
    }
  }, [nodes]);

  // Ref'e zoom fonksiyonunu expose et
  useImperativeHandle(ref, () => ({
    zoomToNode
  }), [zoomToNode]);

  // selectedNodeId değiştiğinde zoom yap
  useEffect(() => {
    if (selectedNodeId) {
      setTimeout(() => {
        zoomToNode(selectedNodeId);
      }, 100);
    }
  }, [selectedNodeId, zoomToNode]);

  // Kaydet: güncel regionsRef içeriğini localStorage'a yaz
  const handleSaveStorage = useCallback(() => {
    if (regionsRef.current) {
      const base = { ...(raw || {}) } as any;
      base.regions = regionsRef.current;
      delete base.infrastructure;
      localStorage.setItem('infra-map-data', JSON.stringify(base));
      // console.log('Data saved to localStorage');
    }
  }, [raw]);

  // Reset: JSON'dan veri al ve localStorage'a yaz
  const handleResetPositions = useCallback(() => {
    const base = { ...(infra || {}) } as any;
    localStorage.setItem('infra-map-data', JSON.stringify(base));
    // console.log('Positions reset from JSON');
    // Sayfayı yenile
    window.location.reload();
  }, []);

  // Drag sırasında limitleri kontrol et (dragging anında)
  const onNodeDrag = useCallback((_: any, node: any) => {
    if (!regionsRef.current || USE_AUTO_LAYOUT || node.type !== 'iso') return;
    
    const parentId = node.parentNode;
    const regionName = (parentId || '').replace('region::', '');
    const region = regionsRef.current.find((r: any) => r.name === regionName);
    if (!region) return;

    const startX = 24;
    const startY = 24;
    const blockW = 140;
    const blockH = 180;
    
    // Region'ın gerçek genişliğini hesapla: tüm infra'ların pozisyonlarına göre
    const allHostPositions = (region.infrastructures || []).map((h: any) => h.position || { x: startX, y: startY });
    const maxHostX = Math.max(0, ...allHostPositions.map((p: any) => p.x));
    const maxHostY = Math.max(0, ...allHostPositions.map((p: any) => p.y));
    const groupW = startX * 2 + maxHostX + blockW;
    const groupH = startY * 2 + maxHostY + blockH + 60;

    // Infra sayısına göre sütun sayısını hesapla (max 3)
    const infraCount = (region.infrastructures || []).length;
    const infraColumnCount = Math.min(infraCount, 3);

    // Clamp: region sınırları içinde kal - DRAGGING ANINDA
    const maxX = Math.max(startX, groupW - blockW - startX) * infraColumnCount;
    const maxY = Math.max(startY, groupH - blockH - startY) * infraColumnCount; 
    const clampedX = Math.max(Math.max(node.position.x, startX), maxX);
    const clampedY = Math.max(Math.max(node.position.y, startY), maxY);

    // Pozisyonu güncelle
    node.position = { x: clampedX, y: clampedY };
  }, [USE_AUTO_LAYOUT]);

  // Drag stop: konumu localStorage'a yaz
  const onNodeDragStop = useCallback((_: any, node: any) => {
    if (!regionsRef.current || USE_AUTO_LAYOUT) return;
    
    // Region grubu
    if (node.type === 'group' && node.id.startsWith('region::')) {
      const name = node.id.replace('region::', '');
      const region = regionsRef.current.find((r: any) => r.name === name);
      if (region) {
        region.position = { x: Math.round(node.position.x), y: Math.round(node.position.y) };
        // console.log('Region position updated:', name, region.position);
      }
      // localStorage'a kaydet
      handleSaveStorage();
      return;
    }
    
    // Infra: pozisyonu güncelle
    const parentId = node.parentNode;
    const regionName = (parentId || '').replace('region::', '');
    const region = regionsRef.current.find((r: any) => r.name === regionName);
    if (!region) {
      handleSaveStorage();
      return;
    }

    // Pozisyonu güncelle
    const host = (region.infrastructures || []).find((h: any) => h.id === node.id);
    if (host) {
      host.position = { x: Math.round(node.position.x), y: Math.round(node.position.y) };
      // console.log('Host position updated:', node.id, host.position);
    }
    
    // localStorage'a kaydet
    handleSaveStorage();
  }, [USE_AUTO_LAYOUT, handleSaveStorage]);

  return (
    <div style={{ width: '100%', height: '100%', background: '#060a13' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        nodesDraggable={true}
        nodesConnectable={false}
        onNodeClick={(_, node) => {
          // console.log('Node clicked:', node);
          // console.log('onNodeClick function:', onNodeClick);
          // console.log('node.data:', node.data);
          // console.log('node.id:', node.id);
          // Node tıklandığında onNodeClick'i çağır
          const nodeId = node.data?.id || node.id;
          if (onNodeClick && nodeId) {
            // console.log('Calling onNodeClick with:', nodeId);
            onNodeClick(nodeId, 'infrastructure');
          }
        }}
        onPaneClick={(event) => {
          //  console.log('Pane clicked:', event);
          // Pane click'te clearSelection yap
          if (onNodeClick) {
            onNodeClick('', 'clear');
          }
        }}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.4}
        maxZoom={1.6}
        onInit={(instance) => {
          reactFlowInstance.current = instance;
        }}
      >
        <Background gap={24} color="#223047" />
        <MiniMap pannable zoomable nodeColor={() => '#6b7fa4'} maskColor="rgba(2,6,23,0.65)" />
        <Controls position="bottom-left" showInteractive={false} />
        <Panel position="top-left" style={{ background: 'transparent' }}>
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
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Legend</div>
            <div>
              <span style={{ color: '#22c55e', marginRight: 8 }}>● healthy</span>
              <span style={{ color: '#f59e0b', marginRight: 8 }}>● warning / degraded</span>
              <span style={{ color: '#ef4444' }}>● error</span>
            </div>
            <div hidden style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button onClick={handleSaveStorage} style={{ padding: '4px 8px', borderRadius: 6, background: '#111827', color: '#e5e7eb', border: '1px solid #1f2937' }}>Save to Storage</button>
              <button onClick={handleResetPositions} style={{ padding: '4px 8px', borderRadius: 6, background: '#dc2626', color: '#e5e7eb', border: '1px solid #b91c1c' }}>Reset Positions</button>
              <span style={{ opacity: 0.7, fontSize: 11 }}>autoLayout: {String(USE_AUTO_LAYOUT)}</span>
            </div>
          </div>
        </Panel>

        {/* Selected node detail panel - sol orta */}
        {selectedHost && selectedHost?.id && (
          <div style={{ position: 'absolute', left: 15, top: 100, maxHeight: '100px' }}>
            <InfrastructureDetailPanel 
              host={selectedHost} 
            />
          </div>
        )}
      </ReactFlow>
      
    </div>
  );
});

// ---------- Dış sarmalayıcı ----------
const InfraLayer = forwardRef<any, InfraLayerProps>((props, ref) => (
  <ReactFlowProvider>
    <InfraInner ref={ref} {...props} />
  </ReactFlowProvider>
));

export default InfraLayer;