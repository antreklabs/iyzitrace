export type HealthValue = "healthy" | "degraded" | "warning" | "error";

export interface StatusItem {
  value?: HealthValue;
  metrics?: {
    errorCount?: number;
    errorPercentage?: number;
    warningCount?: number;
    warningPercentage?: number;
    degradedCount?: number;
    degradedPercentage?: number;
    totalCount?: number;
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

export interface RangeMetricItem {
  name: string;
  data: {
    x: Date;
    y: number;
  }[];
}

export interface ServiceInfrastructureMapping {
  [serviceId: string]: string; // serviceId -> infrastructureId
}

export interface ServiceMapData {
  regions?: Region[] | [];
  serviceInfrastructureMapping?: ServiceInfrastructureMapping;
}

export interface Region {
  id: string;
  name: string;
  status?: StatusItem;
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
    cpu?: {
        percentage: number;
    };
    memory?: {
        usage: number;
        capacity: number;
        percentage: number;
    };
    status?: StatusItem;
    position: PositionItem;
    groupPosition: PositionItem;
    groupSize: SizeItem;
    applications?: Application[] | [];
    services?: Service[] | [];
    }

  export interface Application {
    id: string;
    infrastructureId: string;
    name: string;
    platform: string;
    version: string;
    imageUrl?: string;
    status?: StatusItem;
    groupSize: SizeItem;
    position: PositionItem;
    groupPosition: PositionItem;
  }

  export interface Service {
    id: string;
    infrastructureId?: string;
    name: string;
    port?: string;
    type?: string;
    targetServiceIds: string[];
    metrics?: {
        sumDurationMs?: number;
        avgDurationMs?: number;
        minDurationMs?: number;
        maxDurationMs?: number;
        p50DurationMs?: number;
        p75DurationMs?: number;
        p90DurationMs?: number;
        p95DurationMs?: number;
        p99DurationMs?: number;
        callsCount?: number;
        callsPerSecond?: number;
        operationCounts?: number;
    };
    rangeMetrics?: {
        latency?: RangeMetricItem[];
        apdex?: RangeMetricItem[];
        rateByOperation?: RangeMetricItem[];
        keyopsByOperation?: RangeMetricItem[];
        apdexByOperation?: RangeMetricItem[];
        latencyByOperation?: RangeMetricItem[];
    };
    status?: StatusItem;
    groupSize?: SizeItem;
    position?: PositionItem;
    groupPosition?: PositionItem;
    operations?: Operation[] | [];
  }

  export interface Operation {
    id: string;
    serviceId?: string;
    name: string;
    type: string;
    method?: string;
    path?: string;
    // targetServiceId?: string;
    metrics: {
        avgDurationMs?: number;
        minDurationMs?: number;
        maxDurationMs?: number;
        p50DurationMs?: number;
        p75DurationMs?: number;
        p90DurationMs?: number;
        p95DurationMs?: number;
        p99DurationMs?: number;
        callsCount?: number;
        callsPerSecond?: number;
    };
    status?: StatusItem;
    position?: PositionItem;
  }
  

export interface Trace {
  traceId: string;
  serviceName: string;
  traceName: string;
  durationMs: number;
  startTime: string;
  endTime: string;
  startTimeUnixNano?: string;
  spanCount?: number;
  spanSet?: {
    spans: Array<{
      spanID: string;
      startTimeUnixNano: string;
      durationNanos: string;
    }>;
    matched: number;
  };
  spanSets?: Array<{
    spans: Array<{
      spanID: string;
      startTimeUnixNano: string;
      durationNanos: string;
      name?: string;
      serviceName?: string;
    }>;
    matched: number;
  }>;
  serviceStats?: {
    [serviceName: string]: {
      spanCount: number;
      sumDurationNanos: number;
    };
  };
}