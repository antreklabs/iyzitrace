export interface ServiceItem {
    id: string;
    service: string;
    avgLatency?: number;
    minLatency?: number;
    maxLatency?: number;
    count?: number;
}

export interface ServiceResponseModel {
    list: ServiceItem[];
    total: number;
    hasMore: boolean;
}
  