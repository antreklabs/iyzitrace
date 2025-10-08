import { CoreApp, DataQueryRequest, dateTime, TimeRange } from '@grafana/data';
import { TempoRequestModel } from '../../../../interfaces/tempo/tempo.request.interface';


export class TempoReadFactory {
  static async create(params: TempoRequestModel, ds: any): Promise<DataQueryRequest> {

    const timezone = params.timezone || 'UTC';
    const interval = params.interval || '1s';
    const intervalMs = params.intervalMs || 1000;
    
    const fallbackTo = dateTime();
    const fallbackFrom = dateTime().subtract(24, 'hour'); // 24 saat geriye git
    const timeFrom = params.start ? dateTime(params.start) : fallbackFrom;
    const timeTo = params.end ? dateTime(params.end) : fallbackTo;

    const timeRange: TimeRange = {
      from: timeFrom,
      to: timeTo,
      raw: { from: timeFrom, to: timeTo },
    };

    let query: any = {};
    if (params.queryType === 'serviceMap') {
      query = {
        refId: 'A',
        queryType: 'serviceMap',
        serviceMapQuery: '{service_namespace="opentelemetry-demo"}', // Empty selector to get all services
        serviceMapIncludeNamespace: true,
        serviceMapUseNativeHistograms: false,
        // Add additional service map specific properties
        datasource: {
          type: 'tempo',
          uid: ds.uid
        }
      };
    }

    const request: DataQueryRequest = {
      app: CoreApp.Explore,
      dashboardUID: '',
      requestId: `tempo-query-${Date.now()}`,
      timezone: timezone,
      panelId: 1,
      interval: interval,
      intervalMs: intervalMs,
      targets: [query],
      range: timeRange,
      startTime: Date.now(),
      scopedVars: {}
    };

    return request;
  }
}
