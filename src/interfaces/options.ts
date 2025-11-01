export interface ServiceMapItem {
  id: string;
  name: string;
  layer: string;
  position: string;
  groupPosition: string;
  groupSize: number;
  imageUrl: string;
}

export interface Definitions {
  service_label_name: string;
  span_label_name: string;
  type_label_name: string;
  status_label_name: string;
  exception_type_label_name: string;
  region_label_name: string;
  infrastructure_label_name: string;
  request_count_metric_name: string;
  avg_latency_metric_name: string;
  min_latency_metric_name: string;
  max_latency_metric_name: string;
  error_percentage_metric_name: string;
  p50_duration_metric_name: string;
  p75_duration_metric_name: string;
  p90_duration_metric_name: string;
  p95_duration_metric_name: string;
  p99_duration_metric_name: string;
  avg_duration_metric_name: string;
}

export interface PluginJsonData {
  defaultLokiUid?: string;
  defaultTempoUid?: string;
  defaultPrometheusUid?: string;
  defaultTimeRanges?: string[];
  defaultAbsoluteRange?: [number, number];
  serviceMap?: ServiceMapItem[];
  definitions?: Definitions;
}

export interface PluginSecureJsonData {
  apiKey?: string;
}


