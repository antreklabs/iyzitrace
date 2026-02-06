/* Settings/Plugin Interfaces */

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
    duration_ms_label_name: string;
    http_method_label_name: string;
    http_url_label_name: string;
    net_host_port_label_name: string;
    client_label_name: string;
    client_operation_name_label_name: string;
    server_label_name: string;
    server_operation_name_label_name: string;

    request_count_metric_name: string;
    sum_duration_ms_metric_name: string;
    count_duration_ms_metric_name: string;
    bucket_duration_ms_metric_name: string;
    service_graph_metric_name: string;

    error_percentage_metric_name: string;
    p50_duration_metric_name: string;
    p75_duration_metric_name: string;
    p90_duration_metric_name: string;
    p95_duration_metric_name: string;
    p99_duration_metric_name: string;
    avg_duration_metric_name: string;

    apdex_min_threshold_seconds: string;
    apdex_max_threshold_seconds: string;

    error_status_code_value: string;
}

export interface PluginJsonData {
    serviceMap?: ServiceMapItem[];
    definitions?: Definitions;
    aiConfig?: {
        apiKey?: string;
        model?: string;
        temperature?: number;
        maxTokens?: number;
    };
}

export interface PluginSecureJsonData {
    apiKey?: string;
}
