// Entity types from inventory service
export type EntityType =
    | 'cloud.region'
    | 'host'
    | 'container'
    | 'process'
    | 'k8s.cluster'
    | 'k8s.node'
    | 'k8s.namespace'
    | 'k8s.deployment'
    | 'k8s.replicaset'
    | 'k8s.statefulset'
    | 'k8s.daemonset'
    | 'k8s.pod'
    | 'service'
    | 'db.instance'
    | 'db.database'
    | 'cache.instance'
    | 'messaging.system'
    | 'messaging.destination'
    | 'messaging.producer'
    | 'messaging.consumer'
    | 'mobile.app.ios'
    | 'mobile.app.android'
    | 'mobile.app';

// Relation types
export type RelationType =
    | 'runs_on'
    | 'runs_in'
    | 'located_in'
    | 'uses'
    | 'publishes_to'
    | 'consumes_from'
    | 'belongs_to'
    | 'part_of'
    | 'managed_by'
    | 'instance_of';

// Signal source - proof of where entity/relation was discovered
export interface SignalSource {
    signal_type: 'resource' | 'span' | 'log' | 'metric';
    timestamp: string;
    trace_id?: string;
    span_id?: string;
    span_name?: string;
    metric_name?: string;
    metric_type?: string;
    log_severity?: string;
    log_body?: string;
    service_name?: string;
    service_namespace?: string;
}

// Evidence record
export interface Evidence {
    signal_type: 'resource' | 'span' | 'log' | 'metric';
    attribute_key: string;
    attribute_value: string;
    semconv_version: string;
    timestamp: string;
    source?: SignalSource;
}

// Signal type labels and colors for display
export const SIGNAL_TYPE_INFO: Record<string, { label: string; color: string; bgColor: string }> = {
    span: { label: 'Trace', color: '#2563eb', bgColor: '#dbeafe' },
    metric: { label: 'Metric', color: '#16a34a', bgColor: '#dcfce7' },
    log: { label: 'Log', color: '#ca8a04', bgColor: '#fef9c3' },
    resource: { label: 'Resource', color: '#7c3aed', bgColor: '#ede9fe' },
};

// Entity status
export type EntityStatus = 'active' | 'stale' | 'stopped';

// Instance info
export interface InstanceInfo {
    instance_id: string;
    first_seen: string;
    last_seen: string;
    status: EntityStatus;
    attrs?: Record<string, string>;
}

// Entity record
export interface Entity {
    id: string;
    type: EntityType;
    name: string;
    attrs: Record<string, string>;
    first_seen: string;
    last_seen: string;
    evidence: Evidence[];
    status: EntityStatus;
    instance_count: number;
    active_count: number;
    instances?: InstanceInfo[];
}

// Status display info
export const STATUS_INFO: Record<EntityStatus, { label: string; color: string; bgColor: string }> = {
    active: { label: 'Active', color: '#16a34a', bgColor: '#dcfce7' },
    stale: { label: 'Stale', color: '#ca8a04', bgColor: '#fef9c3' },
    stopped: { label: 'Stopped', color: '#dc2626', bgColor: '#fee2e2' },
};

// Relation record
export interface Relation {
    from_id: string;
    to_id: string;
    type: RelationType;
    attrs?: Record<string, string>;
    first_seen: string;
    last_seen: string;
    evidence: Evidence[];
}

// API Response types
export interface EntitiesResponse {
    entities: Entity[];
    count: number;
    total: number;
    limit: number;
    offset: number;
}

export interface RelationsResponse {
    relations: Relation[];
    count: number;
    total: number;
    limit: number;
    offset: number;
}

export interface StatsResponse {
    EntityCount: number;
    RelationCount: number;
    EntityTypes: Record<EntityType, number>;
    RelationTypes: Record<RelationType, number>;
}

export interface TopologyResponse {
    nodes: TopologyNode[];
    edges: TopologyEdge[];
}

export interface TopologyNode {
    id: string;
    type: EntityType;
    name: string;
    attrs?: Record<string, string>;
}

export interface TopologyEdge {
    from: string;
    to: string;
    type: RelationType;
}

// Entity type categories for grouping
export const ENTITY_CATEGORIES = {
    infrastructure: ['cloud.region', 'host', 'container', 'process'] as EntityType[],
    kubernetes: ['k8s.cluster', 'k8s.node', 'k8s.namespace', 'k8s.deployment', 'k8s.replicaset', 'k8s.statefulset', 'k8s.daemonset', 'k8s.pod'] as EntityType[],
    services: ['service'] as EntityType[],
    databases: ['db.instance', 'db.database', 'cache.instance'] as EntityType[],
    messaging: ['messaging.system', 'messaging.destination', 'messaging.producer', 'messaging.consumer'] as EntityType[],
    mobile: ['mobile.app.ios', 'mobile.app.android', 'mobile.app'] as EntityType[],
};

// Colors for entity types
export const ENTITY_COLORS: Record<string, string> = {
    'cloud.region': '#f59e0b',
    'host': '#3b82f6',
    'container': '#8b5cf6',
    'process': '#6366f1',
    'k8s.cluster': '#10b981',
    'k8s.node': '#14b8a6',
    'k8s.namespace': '#06b6d4',
    'k8s.deployment': '#0891b2',
    'k8s.replicaset': '#0e7490',
    'k8s.statefulset': '#155e75',
    'k8s.daemonset': '#164e63',
    'k8s.pod': '#22d3d1',
    'service': '#ec4899',
    'db.instance': '#f97316',
    'db.database': '#fb923c',
    'cache.instance': '#ef4444',
    'messaging.system': '#a855f7',
    'messaging.destination': '#c084fc',
    'messaging.producer': '#d946ef',
    'messaging.consumer': '#e879f9',
    'mobile.app': '#84cc16',
    'mobile.app.ios': '#a3e635',
    'mobile.app.android': '#bef264',
};

// Icons for entity types (Ant Design icon names)
export const ENTITY_ICONS: Record<string, string> = {
    'cloud.region': 'CloudOutlined',
    'host': 'DesktopOutlined',
    'container': 'ContainerOutlined',
    'process': 'ThunderboltOutlined',
    'k8s.cluster': 'ClusterOutlined',
    'k8s.node': 'HddOutlined',
    'k8s.namespace': 'FolderOutlined',
    'k8s.deployment': 'DeploymentUnitOutlined',
    'k8s.replicaset': 'CopyOutlined',
    'k8s.statefulset': 'DatabaseOutlined',
    'k8s.daemonset': 'SyncOutlined',
    'k8s.pod': 'AppstoreOutlined',
    'service': 'ApiOutlined',
    'db.instance': 'DatabaseOutlined',
    'db.database': 'TableOutlined',
    'cache.instance': 'ThunderboltOutlined',
    'messaging.system': 'MessageOutlined',
    'messaging.destination': 'SendOutlined',
    'messaging.producer': 'UploadOutlined',
    'messaging.consumer': 'DownloadOutlined',
    'mobile.app': 'MobileOutlined',
    'mobile.app.ios': 'AppleOutlined',
    'mobile.app.android': 'AndroidOutlined',
};
