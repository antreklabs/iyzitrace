export type HealthValue = "healthy" | "degraded" | "warning" | "error";

export interface StatusItem {
  value: HealthValue;
  metrics: {
    errorCount: number;
    errorPercentage: number;
    warningCount: number;
    warningPercentage: number;
    degradedCount: number;
    degradedPercentage: number;
    totalCount: number;
  };
}
export interface PositionItem {
  x: number;
  y: number;
}
export interface SizeItem {
  width: number;
  height: number;
}

export interface ServiceMapData {
  regions?: Region[] | [];
}

export interface Region {
  id: string;
  name: string;
  position: PositionItem;
  groupPosition: PositionItem;
  groupSize: SizeItem;
  infrastructures?: Infrastructure[] | [];
  }

export interface Infrastructure {
    id: string;
    name: string;
    osVersion: string;
    ip: string;
    type: string;
    regionId: string;
    cpu: {
        usage: number;
        capacity: number;
        percentage: number;
    };
    memory: {
        usage: number;
        capacity: number;
        percentage: number;
    };
    status: StatusItem;
    position: PositionItem;
    groupPosition: PositionItem;
    groupSize: SizeItem;
    applications?: Application[] | [];
    }

    export interface Application {
    id: string;
    infrastructureId: string;
    name: string;
    platform: string;
    version: string;
    imageUrl: string;
    status: StatusItem;
    groupSize: SizeItem;
    position: PositionItem;
    groupPosition: PositionItem;
    services?: Service[] | [];
    }

    export interface Service {
    id: string;
    applicationId: string;
    name: string;
    port: number;
    type: string;
    metrics: {
        avgLatencyMs: number
        minLatencyMs: number;
        maxLatencyMs: number;
        p50DurationMs: number;
        p75DurationMs: number;
        p90DurationMs: number;
        p95DurationMs: number;
        p99DurationMs: number;
        avgDurationMs: number;
        requestCount: number;
        callsPerSecond: number;
        operationCounts: number;
    };
    status: StatusItem;
    groupSize: SizeItem;
    position: PositionItem;
    groupPosition: PositionItem;
    operations?: Operation[] | [];
    }

    export interface Operation {
    id: string;
    serviceId: string;
    name: string;
    type: string;
    method: string;
    path: string;
    sourceServiceId: string;
    targetServiceId: string;
    metrics: {
        avgLatencyMs: number;
        p95LatencyMs: number;
        p50DurationMs: number;
        p75DurationMs: number;
        p90DurationMs: number;
        p95DurationMs: number;
        p99DurationMs: number;
        avgDurationMs: number;
        count: number;
    };
    status: StatusItem;
    position: PositionItem;
    }
  