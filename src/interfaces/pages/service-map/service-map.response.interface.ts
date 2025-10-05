export interface ServiceMapNode {
    id: string;
    service: string;
    operation?: string;
    type: 'service' | 'operation';
    parentId?: string;
    attributes: Record<string, any>;
    metrics?: {
        requestCount?: number;
        errorRate?: number;
        avgLatency?: number;
        p95Latency?: number;
        p99Latency?: number;
    };
}

export interface ServiceMapEdge {
    id: string;
    source: string;
    target: string;
    sourceService: string;
    targetService: string;
    operation?: string;
    attributes: Record<string, any>;
    metrics?: {
        requestCount?: number;
        errorRate?: number;
        avgLatency?: number;
        p95Latency?: number;
        p99Latency?: number;
    };
}

export interface ServiceMapItem {
    id: string;
    service: string;
    operation?: string;
    type: 'service' | 'operation';
    parentId?: string;
    requestCount: number;
    errorRate: number;
    avgLatency: number;
    p95Latency: number;
    p99Latency: number;
    lastSeen: string;
    attributes: Record<string, any>;
    relatedServices: string[];
    relatedOperations: string[];
}

export interface ServiceMapResponseModel {
    list: ServiceMapItem[];
    total: number;
    hasMore: boolean;
    nodes: ServiceMapNode[];
    edges: ServiceMapEdge[];
}
  