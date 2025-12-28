/* Service Map Specific Types */
/* Note: These are simplified types used specifically for service map visualization */

export type ServiceMapOperation = {
  name: string;
  method: string;
  path?: string;
  avg_latency_ms?: number;
  p95_ms?: number;
  status?: 'ok' | 'warning' | 'error';
};

export type ServiceMapService = {
  name: string;
  kind: string;
  port: string;
  health: 'healthy' | 'degraded' | 'warning';
  replicas?: number;
  dependencies?: string[];
  metrics?: Record<string, number>;
  operations?: ServiceMapOperation[];
};

export type ServiceMapApplication = {
  name: string;
  platform: string;
  version: string;
  status: 'running' | 'stopped' | 'warning';
  services: ServiceMapService[];
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
  applications: ServiceMapApplication[];
  position?: ServiceMapPosition;
};

export type ServiceMapPosition = {
  x: number;
  y: number;
};

export type CustomSize = {
  width: number;
  height: number;
};

export type LayerKey = 'infra' | 'application' | 'service' | 'operation';

export interface TreeNode {
  title: string;
  key: string;
  type: LayerKey;
  children?: TreeNode[];
}