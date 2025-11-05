import { lastValueFrom } from 'rxjs';
import { BaseApi } from '../core/base.api';
import { CoreApp, dateTime } from '@grafana/data';

export interface PrometheusRangeQueryRequest {
  query: string;
  start: number; // ms
  end: number;   // ms
  step?: string; // e.g. '15s'
}

export interface PrometheusSeriesPoint { ts: number; value: number }
export interface PrometheusQueryResult {
  metric: Record<string, string>;
  values: PrometheusSeriesPoint[];
}

export interface PrometheusQueryResponseModel {
  list: PrometheusQueryResult[];
}

class PrometheusReadApi extends BaseApi {

  async query(request: PrometheusRangeQueryRequest): Promise<PrometheusQueryResponseModel> {
    const ds = await this.getPrometheusDatasourceInstance();
    // Grafana Prometheus datasource supports query method via backendSrv, but not rxjs; use query directly
    // let step = request.step || this.getStep(request.start, request.end);
    // step = '1h';
    // const intervalMs = this.stepToMs(step);

    const req = {
      app: CoreApp.Explore,
      requestId: `prom-query-${Date.now()}`,
      // interval: step,
      // intervalMs,
      range: {
        from: dateTime(request.start),
        to: dateTime(request.end),
        // raw: { from: dateTime(request.start), to: dateTime(request.end) },
      },
      // timezone: 'UTC',
      // scopedVars: {},
      // startTime: Date.now(),
      targets: [
        {
          refId: 'A',
          expr: request.query,
          // datasource: (ds.getRef ? ds.getRef() : { uid: ds.uid, type: ds.type }), // burası kritik
          // queryType: 'range' as any,
          // editorMode: 'code',
          // interval: step,
          // intervalMs,
          // format: 'time_series',
          // instant: true,
          // range: true,
          // exemplar: false,
        },
      ],
    };
    
    // 3) Çalıştır ve sonucu al

    try {
      const response = await lastValueFrom(ds.query(req));
      // console.log('response', response);
      return this.mapResponse(response);
    } catch (err: any) {
      // Grafana Observable can complete without emission -> lastValueFrom throws EmptyError
      if (err?.name === 'EmptyError') {
        console.warn('[PrometheusReadApi] Empty response stream, returning empty list');
        return { list: [] };
      }
      console.error('[PrometheusReadApi] query error:', err);
      throw err;
    }
  }

  private mapResponse(response: any): PrometheusQueryResponseModel {
    const list: PrometheusQueryResult[] = [];
    if (response?.data && Array.isArray(response.data)) {
      response.data.forEach((frame: any) => {
        // Prefer DataFrame fields (Grafana 9+)
        const timeField = frame?.fields?.find((f: any) => f.type === 'time' || f.name === 'Time' || f.name === 'time');
        const valueField = frame?.fields?.find((f: any) => f.type === 'number' || f.name === 'Value' || f.name === 'value');
        let metric = frame?.labels || frame?.meta?.custom?.result?.[0]?.metric || {};

        if (timeField && valueField && timeField.values && valueField.values) {
          const len = Math.min(timeField.values.length, valueField.values.length);
          const values: PrometheusSeriesPoint[] = [];
          for (let i = 0; i < len; i++) {
            values.push({ ts: Number(timeField.values[i]), value: Number(valueField.values[i]) });
          }
          list.push({ metric, values });
          return;
        }

        // Fallback to meta.custom.result (older shapes)
        const series = frame?.meta?.custom?.result || [];
        if (Array.isArray(series) && series.length > 0) {
          series.forEach((s: any) => {
            const vals = s?.values || [];
            const mapped = vals.map((v: any) => ({ ts: Number(v[0]) * 1000, value: Number(v[1]) }));
            list.push({ metric: s?.metric || {}, values: mapped });
          });
        }
      });
    }
    return { list };
  }

  // private stepToMs(step: string): number {
  //   if (!step) return 1000;
  //   const m = String(step).match(/^(\d+)(ms|s|m|h|d)$/);
  //   if (!m) return 1000;
  //   const n = parseInt(m[1], 10);
  //   const u = m[2];
  //   switch (u) {
  //     case 'ms': return n;
  //     case 's': return n * 1000;
  //     case 'm': return n * 60 * 1000;
  //     case 'h': return n * 3600 * 1000;
  //     case 'd': return n * 86400 * 1000;
  //     default: return 1000;
  //   }
  // }

  // private getStep(startMs: number, endMs: number): string {
  //   const diffSec = Math.max(1, Math.floor((endMs - startMs) / 1000));
  //   if (diffSec <= 60) return '1s';
  //   if (diffSec <= 5 * 60) return '5s';
  //   if (diffSec <= 30 * 60) return '30s';
  //   if (diffSec <= 2 * 3600) return '1m';
  //   if (diffSec <= 6 * 3600) return '5m';
  //   if (diffSec <= 24 * 3600) return '10m';
  //   return '1h';
  // }
}

export const prometheusReadApi = new PrometheusReadApi();


