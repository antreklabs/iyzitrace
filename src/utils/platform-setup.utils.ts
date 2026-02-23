/**
 * Shared utilities for platform setup — used by both the Wizard and Settings pages.
 */

// Datasource URL paths — appended to the platform base URL
// Must match nginx location directives (trailing slash required)
export const DATASOURCE_PATHS = {
    prometheus: '/query/v1/metrics/',
    loki: '/query/v1/logs/',
    tempo: '/query/v1/traces/',
};

// Convert browser-facing URL to Docker-internal URL for Grafana datasource proxy
// Grafana runs inside Docker, so 'localhost' or '127.0.0.1' from the browser
// won't work — those resolve to Grafana's own container, not the host machine.
// We convert them to 'host.docker.internal' which Docker routes to the host.
export const toDatasourceUrl = (browserUrl: string): string => {
    return browserUrl
        .replace(/localhost(:\d+)?/i, 'host.docker.internal')
        .replace(/127\.0\.0\.1(:\d+)?/i, 'host.docker.internal');
};

export interface StepStatus {
    checking: boolean;
    success: boolean | null;
    error: string | null;
}

export interface DatasourceStatus {
    prometheus: StepStatus;
    loki: StepStatus;
    tempo: StepStatus;
}

export interface PlatformComponentStatus {
    name: string;
    status: string;
    latency: string;
    details: {
        version?: string;
        uptime?: string;
        Upsince?: string;
        [key: string]: any;
    };
}

export interface PlatformStatusResponse {
    status: string;
    components: PlatformComponentStatus[];
    updated_at: string;
}

export type DatasourceType = 'prometheus' | 'loki' | 'tempo';

// Build datasource configurations dynamically based on platform URL and auth settings
export const getDatasourceConfigs = (baseUrl: string, auth: 'open' | 'apikey', apiKey: string) => {
    const normalizedUrl = toDatasourceUrl(baseUrl.replace(/\/$/, ''));
    const hasApiKey = auth === 'apikey' && apiKey.trim();

    // Auth headers for Grafana datasource API (httpHeaderName1 + secureJsonData pattern)
    const authJsonData = hasApiKey ? { httpHeaderName1: 'Authorization' } : {};
    const authSecureJsonFields = hasApiKey
        ? { secureJsonData: { httpHeaderValue1: `Bearer ${apiKey.trim()}` } }
        : {};

    return {
        prometheus: {
            name: 'Prometheus (Observability Platform)',
            type: 'prometheus',
            uid: 'prometheus-platform',
            access: 'proxy',
            orgId: 1,
            url: `${normalizedUrl}${DATASOURCE_PATHS.prometheus}`,
            basicAuth: false,
            isDefault: false,
            version: 1,
            editable: true,
            jsonData: {
                httpMethod: 'GET',
                ...authJsonData,
                promRegistryOverrides: {
                    metrics: {
                        traces_spanmetrics_calls_total: 'iyzitrace_span_metrics_calls_total',
                        traces_spanmetrics_latency_sum: 'iyzitrace_span_metrics_duration_milliseconds_sum',
                        traces_spanmetrics_latency_count: 'iyzitrace_span_metrics_duration_milliseconds_count',
                        traces_spanmetrics_latency_bucket: 'iyzitrace_span_metrics_duration_milliseconds_bucket',
                    },
                },
            },
            ...authSecureJsonFields,
        },
        loki: {
            name: 'Loki (Observability Platform)',
            type: 'loki',
            uid: 'loki-platform',
            access: 'proxy',
            orgId: 1,
            url: `${normalizedUrl}${DATASOURCE_PATHS.loki}`,
            isDefault: false,
            editable: true,
            ...(hasApiKey ? { jsonData: { ...authJsonData } } : {}),
            ...authSecureJsonFields,
        },
        tempo: {
            name: 'Tempo (Observability Platform)',
            type: 'tempo',
            uid: 'tempo-platform',
            access: 'proxy',
            orgId: 1,
            url: `${normalizedUrl}${DATASOURCE_PATHS.tempo}`,
            basicAuth: false,
            isDefault: false,
            version: 1,
            editable: true,
            jsonData: {
                httpMethod: 'GET',
                ...authJsonData,
                serviceMap: {
                    datasourceUid: 'prometheus-platform',
                },
            },
            ...authSecureJsonFields,
        },
    };
};

export const INITIAL_STEP_STATUS: StepStatus = {
    checking: false,
    success: null,
    error: null,
};

export const INITIAL_DATASOURCE_STATUS: DatasourceStatus = {
    prometheus: { ...INITIAL_STEP_STATUS },
    loki: { ...INITIAL_STEP_STATUS },
    tempo: { ...INITIAL_STEP_STATUS },
};
