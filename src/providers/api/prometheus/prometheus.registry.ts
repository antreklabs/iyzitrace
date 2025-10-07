import { getDataSourceSrv } from '@grafana/runtime';
import { prometheusApi } from './prometheus.api';
/*
  Prometheus configuration registry
  - Centralizes metric names, label keys, and query builders
  - Supports per-datasource (UID) overrides
  - Falls back to sane defaults when no override is present
*/

export const MetricKeys = {
  traces_spanmetrics_calls_total: 'span_metrics_calls_total	',
  traces_spanmetrics_latency_sum: 'span_metrics_duration_milliseconds_sum',
  traces_spanmetrics_latency_count: 'span_metrics_duration_milliseconds_count',
  traces_spanmetrics_latency_bucket: 'span_metrics_duration_milliseconds_bucket',
} as const;

export type MetricKey = keyof typeof MetricKeys;

export const LabelKeys = {
  service: 'service_name',
  span_name: 'span_name',
} as const;

export type LabelKey = keyof typeof LabelKeys;

export const QueryKeys = {
  operationCount: 'operationCount',
  totalCalls: 'totalCalls',
  maxLatencySpan: 'maxLatencySpan',
  minLatencySpan: 'minLatencySpan',
  // CallMetrics queries
  p50Latency: 'p50Latency',
  p90Latency: 'p90Latency',
  p99Latency: 'p99Latency',
  callsPerSecond: 'callsPerSecond',
  apdex: 'apdex',
  topKeyOperations: 'topKeyOperations',
  // ServiceCard queries
  totalTraceCount: 'totalTraceCount',
  avgLatency: 'avgLatency',
  minLatency: 'minLatency',
  maxLatency: 'maxLatency',
  // MiddleStatsCharts queries
  p50LatencyGlobal: 'p50LatencyGlobal',
  p90LatencyGlobal: 'p90LatencyGlobal',
  p95LatencyGlobal: 'p95LatencyGlobal',
  // TraceQLBuilder queries
  errorRate: 'errorRate',
  opsPerSec: 'opsPerSec',
  errorCount: 'errorCount',
  latencyBucket: 'latencyBucket',
  approxAvgLatency: 'approxAvgLatency',
  // ErrorStatsCharts query
  serviceCallCountGlobal: 'serviceCallCountGlobal',
} as const;

export type QueryKey = keyof typeof QueryKeys;

export interface PrometheusQueriesContext {
  serviceName: string;
  windowSeconds: number; // typically (end - start)
  spanName?: string; // for span-specific queries
  le?: string; // for latency bucket queries
  quantile?: number; // for histogram quantile queries
  rateInterval?: string; // for rate intervals (default: 5m)
}

export interface PrometheusDatasourceConfig {
  metrics?: Partial<Record<MetricKey, string>>;
  labels?: Partial<Record<LabelKey, string>>;
  queries?: Partial<Record<QueryKey, (ctx: PrometheusQueriesContext, cfg: ResolvedPrometheusConfig) => string>>;
}

export interface ResolvedPrometheusConfig {
  metrics: Record<MetricKey, string>;
  labels: Record<LabelKey, string>;
  queries: Record<QueryKey, (ctx: PrometheusQueriesContext, cfg: ResolvedPrometheusConfig) => string>;
}

// Canonical metric names without any custom prefix
export const DEFAULT_METRICS: Record<MetricKey, string> = {
  traces_spanmetrics_calls_total: MetricKeys.traces_spanmetrics_calls_total,
  traces_spanmetrics_latency_sum: MetricKeys.traces_spanmetrics_latency_sum,
  traces_spanmetrics_latency_count: MetricKeys.traces_spanmetrics_latency_count,
  traces_spanmetrics_latency_bucket: MetricKeys.traces_spanmetrics_latency_bucket,
};

// Canonical label keys used in queries
export const DEFAULT_LABELS: Record<LabelKey, string> = {
  service: LabelKeys.service,
  span_name: LabelKeys.span_name,
};

// Default query builders constructed from metrics/labels
const defaultQueryBuilders: ResolvedPrometheusConfig['queries'] = {
  operationCount: ({ serviceName, windowSeconds }, cfg) =>
    `count(count by (${cfg.labels.span_name}) (rate(${cfg.metrics.traces_spanmetrics_calls_total}{${cfg.labels.service}="${serviceName}"}[${windowSeconds}s])))`,

  totalCalls: ({ serviceName, windowSeconds }, cfg) =>
    `sum(increase(${cfg.metrics.traces_spanmetrics_calls_total}{${cfg.labels.service}="${serviceName}"}[${windowSeconds}s])) by (span_name)`,

  maxLatencySpan: ({ serviceName, windowSeconds }, cfg) =>
    `topk(1, sum_over_time(${cfg.metrics.traces_spanmetrics_latency_sum}{${cfg.labels.service}="${serviceName}"}[${windowSeconds}s]) / sum_over_time(${cfg.metrics.traces_spanmetrics_latency_count}{${cfg.labels.service}="${serviceName}"}[${windowSeconds}s])) by (${cfg.labels.span_name})`,

  minLatencySpan: ({ serviceName, windowSeconds }, cfg) =>
    `bottomk(1, sum_over_time(${cfg.metrics.traces_spanmetrics_latency_sum}{${cfg.labels.service}="${serviceName}"}[${windowSeconds}s]) / sum_over_time(${cfg.metrics.traces_spanmetrics_latency_count}{${cfg.labels.service}="${serviceName}"}[${windowSeconds}s])) by (${cfg.labels.span_name})`,

  // CallMetrics queries (use fixed 1m rate window as in UI today)
  p50Latency: ({ serviceName }, cfg) =>
    `histogram_quantile(0.50, sum(rate(${cfg.metrics.traces_spanmetrics_latency_bucket}{${cfg.labels.service}="${serviceName}"}[1m])) by (span_name, le))`,
  
  p90Latency: ({ serviceName }, cfg) =>
    `histogram_quantile(0.90, sum(rate(${cfg.metrics.traces_spanmetrics_latency_bucket}{${cfg.labels.service}="${serviceName}"}[1m])) by (span_name, le))`,
  
  p99Latency: ({ serviceName }, cfg) =>
    `histogram_quantile(0.99, sum(rate(${cfg.metrics.traces_spanmetrics_latency_bucket}{${cfg.labels.service}="${serviceName}"}[1m])) by (span_name, le))`,
  
  callsPerSecond: ({ serviceName }, cfg) =>
    `sum(rate(${cfg.metrics.traces_spanmetrics_calls_total}{${cfg.labels.service}="${serviceName}"}[1m]))`,
  
  apdex: ({ serviceName }, cfg) =>
    `(sum(rate(${cfg.metrics.traces_spanmetrics_latency_bucket}{le="0.5",${cfg.labels.service}="${serviceName}"}[1m])) + sum(rate(${cfg.metrics.traces_spanmetrics_latency_bucket}{le="2",${cfg.labels.service}="${serviceName}"}[1m])) / 2) / sum(rate(${cfg.metrics.traces_spanmetrics_latency_count}{${cfg.labels.service}="${serviceName}"}[1m]))`,
  
  topKeyOperations: ({ serviceName }, cfg) =>
    `topk(5, sum(rate(${cfg.metrics.traces_spanmetrics_calls_total}{${cfg.labels.service}="${serviceName}"}[1m])) by (${cfg.labels.span_name}))`,

  // ServiceCard queries (use 5m rate window)
  totalTraceCount: ({ serviceName }, cfg) =>
    `sum(rate(${cfg.metrics.traces_spanmetrics_calls_total}{${cfg.labels.service}="${serviceName}"}[5m])) * 300`,
  
  avgLatency: ({ serviceName }, cfg) =>
    `sum(rate(${cfg.metrics.traces_spanmetrics_latency_sum}{${cfg.labels.service}="${serviceName}"}[5m])) / sum(rate(${cfg.metrics.traces_spanmetrics_latency_count}{${cfg.labels.service}="${serviceName}"}[5m]))`,
  
  minLatency: ({ serviceName }, cfg) =>
    `min(rate(${cfg.metrics.traces_spanmetrics_latency_bucket}{${cfg.labels.service}="${serviceName}"}[5m]))`,
  
  maxLatency: ({ serviceName }, cfg) =>
    `histogram_quantile(0.99, sum(rate(${cfg.metrics.traces_spanmetrics_latency_bucket}{${cfg.labels.service}="${serviceName}"}[5m])) by (le))`,

  // MiddleStatsCharts queries (global, no service filter)
  p50LatencyGlobal: ({ rateInterval = '5m' }, cfg) =>
    `histogram_quantile(0.50, sum(rate(${cfg.metrics.traces_spanmetrics_latency_bucket}[${rateInterval}])) by (le, ${cfg.labels.service}))`,
  
  p90LatencyGlobal: ({ rateInterval = '5m' }, cfg) =>
    `histogram_quantile(0.90, sum(rate(${cfg.metrics.traces_spanmetrics_latency_bucket}[${rateInterval}])) by (le, ${cfg.labels.service}))`,
  
  p95LatencyGlobal: ({ rateInterval = '5m' }, cfg) =>
    `histogram_quantile(0.95, sum(rate(${cfg.metrics.traces_spanmetrics_latency_bucket}[${rateInterval}])) by (le, ${cfg.labels.service}))`,

  // TraceQLBuilder queries (span-specific)
  errorRate: ({ spanName, rateInterval = '5m' }, cfg) =>
    `sum(rate(${cfg.metrics.traces_spanmetrics_calls_total}{${cfg.labels.span_name}="${spanName}", status_code!="STATUS_CODE_UNSET"}[${rateInterval}])) / sum(rate(${cfg.metrics.traces_spanmetrics_calls_total}{${cfg.labels.span_name}="${spanName}"}[${rateInterval}])) by (span_name)`,
  
  opsPerSec: ({ spanName, rateInterval = '5m' }, cfg) =>
    `sum(rate(${cfg.metrics.traces_spanmetrics_calls_total}{${cfg.labels.span_name}="${spanName}"}[${rateInterval}]))`,
  
  errorCount: ({ spanName, rateInterval = '5m' }, cfg) =>
    `sum(increase(${cfg.metrics.traces_spanmetrics_calls_total}{${cfg.labels.span_name}="${spanName}", status_code!="STATUS_CODE_UNSET"}[${rateInterval}]))`,
  
  latencyBucket: ({ spanName, le, rateInterval = '5m' }, cfg) =>
    `rate(${cfg.metrics.traces_spanmetrics_latency_bucket}{${cfg.labels.span_name}="${spanName}", le="${le}"}[${rateInterval}])`,
  
  approxAvgLatency: ({ spanName, rateInterval = '5m' }, cfg) =>
    `sum(rate(${cfg.metrics.traces_spanmetrics_latency_sum}{${cfg.labels.span_name}="${spanName}"}[${rateInterval}])) / sum(rate(${cfg.metrics.traces_spanmetrics_latency_count}{${cfg.labels.span_name}="${spanName}"}[${rateInterval}]))`,

  // ErrorStatsCharts query (global service call count)
  serviceCallCountGlobal: ({ rateInterval = '1m' }, cfg) =>
    `floor(sum by(${cfg.labels.service}) (increase(${cfg.metrics.traces_spanmetrics_calls_total}[${rateInterval}])))`,
};

// In-memory override store keyed by datasource UID
const overrides = new Map<string, PrometheusDatasourceConfig>();
// Optional default (global) overrides used when UID is not provided
let defaultOverrides: PrometheusDatasourceConfig | undefined;

export function setPrometheusOverrides(uid: string, config: PrometheusDatasourceConfig): void {
  overrides.set(uid, config);
}

export function clearPrometheusOverrides(uid?: string): void {
  if (uid) overrides.delete(uid);
  else overrides.clear();
}

/**
 * Set global (default) overrides that will apply when no UID is provided.
 * Useful for environments where a single Prometheus renames metrics (e.g., adds a prefix),
 * and callers do not always have a datasource UID at hand.
 */
export function setDefaultPrometheusOverrides(config: PrometheusDatasourceConfig): void {
  defaultOverrides = config;
}

/** Clear global overrides. */
export function clearDefaultPrometheusOverrides(): void {
  defaultOverrides = undefined;
}

export function resolvePrometheusConfig(uid?: string): ResolvedPrometheusConfig {
  // Merge order: DEFAULTS <- defaultOverrides <- uidOverrides
  const base: PrometheusDatasourceConfig = defaultOverrides || {};
  const uidOverrides = (uid ? overrides.get(uid) : undefined) || {};

  const metrics: Record<MetricKey, string> = {
    ...DEFAULT_METRICS,
    ...(base.metrics || {}),
    ...(uidOverrides.metrics || {}),
  } as Record<MetricKey, string>;
  const labels: Record<LabelKey, string> = {
    ...DEFAULT_LABELS,
    ...(base.labels || {}),
    ...(uidOverrides.labels || {}),
  } as Record<LabelKey, string>;

  const merged: ResolvedPrometheusConfig = {
    metrics,
    labels,
    queries: {
      ...defaultQueryBuilders,
      ...(base.queries || {}),
      ...(uidOverrides.queries || {}),
    },
  };

  return merged;
}

/**
 * Returns all query strings for the given context, using defaults or the UID-specific overrides.
 */
export function buildAllQueries(ctx: PrometheusQueriesContext, uid?: string): Record<QueryKey, string> {
  const cfg = resolvePrometheusConfig(uid);
  return {
    operationCount: cfg.queries.operationCount(ctx, cfg),
    totalCalls: cfg.queries.totalCalls(ctx, cfg),
    maxLatencySpan: cfg.queries.maxLatencySpan(ctx, cfg),
    minLatencySpan: cfg.queries.minLatencySpan(ctx, cfg),
    p50Latency: cfg.queries.p50Latency(ctx, cfg),
    p90Latency: cfg.queries.p90Latency(ctx, cfg),
    p99Latency: cfg.queries.p99Latency(ctx, cfg),
    callsPerSecond: cfg.queries.callsPerSecond(ctx, cfg),
    apdex: cfg.queries.apdex(ctx, cfg),
    topKeyOperations: cfg.queries.topKeyOperations(ctx, cfg),
    totalTraceCount: cfg.queries.totalTraceCount(ctx, cfg),
    avgLatency: cfg.queries.avgLatency(ctx, cfg),
    minLatency: cfg.queries.minLatency(ctx, cfg),
    maxLatency: cfg.queries.maxLatency(ctx, cfg),
    p50LatencyGlobal: cfg.queries.p50LatencyGlobal(ctx, cfg),
    p90LatencyGlobal: cfg.queries.p90LatencyGlobal(ctx, cfg),
    p95LatencyGlobal: cfg.queries.p95LatencyGlobal(ctx, cfg),
    errorRate: cfg.queries.errorRate(ctx, cfg),
    opsPerSec: cfg.queries.opsPerSec(ctx, cfg),
    errorCount: cfg.queries.errorCount(ctx, cfg),
    latencyBucket: cfg.queries.latencyBucket(ctx, cfg),
    approxAvgLatency: cfg.queries.approxAvgLatency(ctx, cfg),
    serviceCallCountGlobal: cfg.queries.serviceCallCountGlobal(ctx, cfg),
  };
}

/** Build a single query string by key */
export async function buildQuery(key: QueryKey, ctx: PrometheusQueriesContext, uid?: string): Promise<string> {
  if (!uid) {
    uid = await prometheusApi.resolvePrometheusUid();
  }
  const cfg = resolvePrometheusConfig(uid);
  const builder = cfg.queries[key];
  return builder(ctx, cfg);
}


/**
 * Reads promRegistryOverrides from datasource instance settings and applies them for the given UID.
 * Safe to call multiple times; the last call wins.
 */
export async function applyPrometheusRegistryOverrides(uid: string): Promise<void> {
  try {
    const inst = await getDataSourceSrv().getInstanceSettings(uid);
    const overrides = (inst?.jsonData as any)?.promRegistryOverrides;
    if (overrides) {
      setPrometheusOverrides(uid, overrides as any);
    }
  } catch {
    // ignore: missing instance or overrides
  }
}

