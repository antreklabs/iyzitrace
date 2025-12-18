import { DataQueryRequest, TimeRange, CoreApp, dateTime } from '@grafana/data';

export interface LokiReadRequestModel {
  request?: DataQueryRequest<LokiQuery>;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface LogsRequestModel {
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

export class LokiReadRequestFactory {
  static async create(params: LogsRequestModel, ds: any): Promise<LokiReadRequestModel> {

    const limit = params.limit || 100;
    const orderBy = params.orderBy || 'timestamp';
    const orderDirection = params.orderDirection || 'desc';
    const interval = params.interval || '1s';
    const intervalMs = params.intervalMs || 1000;
    const timezone = params.timezone || 'UTC';
    const maxDataPoints = params.maxDataPoints || 1000;
    
    const fallbackTo = dateTime();
    const fallbackFrom = dateTime().subtract(1, 'hour');

    const dsRef = typeof ds.getRef === 'function'
      ? ds.getRef()
      : { uid: ds.uid, type: ds.type };

    const timeFrom = params.start ? dateTime(params.start) : fallbackFrom;
    const timeTo = params.end ? dateTime(params.end) : fallbackTo;

    const timeRange: TimeRange = {
      from: timeFrom,
      to: timeTo,
      raw: { from: timeFrom, to: timeTo },
    };

    const request: DataQueryRequest<LokiQuery> = {
      targets: [
        {
          refId: 'A',
          expr: params.expr,
          queryType: 'range' as any,
          maxLines: limit,
          datasource: dsRef as any,
        } as unknown as LokiQuery,
      ],
      range: timeRange,
      requestId: `loki-query-${Date.now()}`,
      interval: interval,
      intervalMs: intervalMs,
      scopedVars: {},
      timezone: timezone,
      app: CoreApp.Explore,
      maxDataPoints: maxDataPoints,
      startTime: Date.now(),
    };

    return {
      request,
      orderBy,
      orderDirection,
    };
  }
}