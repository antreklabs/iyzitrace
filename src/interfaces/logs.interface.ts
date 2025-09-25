export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';
  service: string;
  message: string;
  attributes: Record<string, any>;
  traceId?: string;
  spanId?: string;
  hostname?: string;
  environment?: string;
  namespace?: string;
  pod?: string;
  deployment?: string;
  cluster?: string;
}

export interface LogFilter {
  key: string;
  value: string;
  operator: 'equals' | 'contains' | 'regex' | 'exists' | 'not_exists';
}

export interface LogQuery {
  query: string;
  filters: LogFilter[];
  timeRange: {
    start: number;
    end: number;
  };
  limit: number;
  orderBy: 'timestamp' | 'level' | 'service';
  orderDirection: 'asc' | 'desc';
}

export interface LogSearchResult {
  logs: LogEntry[];
  total: number;
  hasMore: boolean;
}
