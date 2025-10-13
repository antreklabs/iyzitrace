// ---------- Tipler ----------
export type Operation = {
  name: string;
  method: string;
  path?: string;
  avg_latency_ms?: number;
  p95_ms?: number;
  status?: 'ok' | 'warning' | 'error';
};

export type Service = {
  name: string;
  kind: string;
  port: number;
  health: 'healthy' | 'degraded' | 'warning';
  replicas?: number;
  dependencies?: string[];
  metrics?: Record<string, number>;
  operations?: Operation[];
};

export type Application = {
  name: string;
  platform: string;
  version: string;
  status: 'running' | 'stopped' | 'warning';
  services: Service[];
};

export type Host = {
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
  position?: Position;
};

export type Position = {
  x: number;
  y: number;
};

export type CustomSize = {
  width: number;
  height: number;
};

export type InfraJSON = {
  schema_version: string;
  generated_at: string;
  infrastructure: Host[];
};

// Yeni şema (opsiyonel): regions -> infrastructures -> applications -> services -> operations
export type RegionSchema = {
  name: string;
  infrastructures: Host[]; // Host ile aynı alanlar
  position?: Position;
};

export type MapSchema = {
  name: string;
  hosts: Host[]; // Host ile aynı alanlar
  position?: Position;
};

export type InfraJSONV2 = {
  schema_version: string;
  generated_at: string;
  regions: RegionSchema[];
};

export type LayerKey = 'infra' | 'application' | 'service' | 'operation';

export interface TreeNode {
  title: string;
  key: string;
  type: LayerKey;
  children?: TreeNode[];
}
