// Grafana LokiQuery interface'i
export interface LokiQuery {
  refId: string;
  expr: string;
  queryType: LokiQueryType;
  maxLines?: number;
  instant?: boolean;
  step?: string;
  legendFormat?: string;
  hide?: boolean;
}

export enum LokiQueryType {
  Range = 'range',
  Instant = 'instant',
  Stream = 'stream'
}

export interface LokiQueryParams {
  query: string;
  start: string;
  end: string;
  limit?: number;
  direction?: 'forward' | 'backward';
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}
