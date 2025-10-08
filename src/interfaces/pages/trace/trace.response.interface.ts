export interface TraceItem {
    key: string;
    traceID: string;
    rootServiceName: string;
    rootTraceName?: string;
    durationMs: number;
    startTimeUnixNano: string;
    endTimeUnixNano: string;
    spanCount: number;
    spanSet: {
        spans: any[];
        matched: number;
    };
    children: any[];
    spanSets?: any[];
}

export interface TraceResponseModel {
    list: TraceItem[];
    total: number;
    hasMore: boolean;
}
  