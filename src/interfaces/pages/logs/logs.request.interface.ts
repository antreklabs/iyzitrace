export interface LogsRequestModel {
    datasourceUidOrName: string;
    expr: string;
    limit?: number;
    start?: number;
    end?: number;
    orderBy?: string;
    orderDirection?: 'asc' | 'desc';
    interval?: string;
    intervalMs?: number;
    timezone?: string;
    maxDataPoints?: number;
}