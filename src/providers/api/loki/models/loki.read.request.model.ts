import { DataQueryRequest, TimeRange, CoreApp, dateTime } from '@grafana/data';
import { LokiQuery } from '../../../../interfaces/loki/loki-query.interface';
import { BaseApi } from '../../core/base.api';
import { LogsRequestModel } from '../../../../interfaces/pages/logs/logs.request.interface';

export interface LokiReadRequestModel {
  datasource?: any;
  request?: DataQueryRequest<LokiQuery>;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export class LokiReadRequestFactory {
  static async create(params: LogsRequestModel): Promise<LokiReadRequestModel> {

    if (!params.datasourceUidOrName) {
      throw new Error(`Datasource uid or name is required`);
    }
    // Default values
    const datasourceUidOrName = params.datasourceUidOrName;
    const limit = params.limit || 100;
    const orderBy = params.orderBy || 'timestamp';
    const orderDirection = params.orderDirection || 'desc';
    const interval = params.interval || '1s';
    const intervalMs = params.intervalMs || 1000;
    const timezone = params.timezone || 'UTC';
    const maxDataPoints = params.maxDataPoints || 1000;
    
    // Get datasource with error handling
    const ds = await BaseApi.getDatasourceInstance(datasourceUidOrName);
    if (!ds) {
      throw new Error(`Datasource "${datasourceUidOrName}" not found`);
    }
    
    if (!ds.uid) {
      throw new Error(`Datasource "${datasourceUidOrName}" has no UID`);
    }
    
    if (!ds.type) {
      throw new Error(`Datasource "${datasourceUidOrName}" has no type`);
    }

    const fallbackTo = dateTime();
    const fallbackFrom = dateTime().subtract(1, 'hour');

    const dsRef = typeof ds?.getRef === 'function'
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
      datasource: ds,
      request,
      orderBy,
      orderDirection,
    };
  }
}
