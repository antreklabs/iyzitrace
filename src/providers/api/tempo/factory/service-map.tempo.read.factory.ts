import { CoreApp, DataQueryRequest, dateTime, TimeRange } from '@grafana/data';
import { TempoServiceMapQuery } from '../../../../interfaces/tempo/tempo-query.interface';
import { ServiceMapRequestModel } from '@/interfaces/pages/service-map/service-map.request.interface';

export class ServiceMapTempoReadFactory {
  static async create(params: ServiceMapRequestModel, ds: any): Promise<DataQueryRequest> {

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

    const query: TempoServiceMapQuery = {
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

    console.log('[ServiceMapTempoReadFactory] Created query:', query);
    console.log('[ServiceMapTempoReadFactory] Time range:', { from: timeFrom.format(), to: timeTo.format() });

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
