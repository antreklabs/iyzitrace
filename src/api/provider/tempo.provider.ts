// Prometheus Provider - API calls to Prometheus for labels and values
import { getBackendSrv } from '@grafana/runtime';
import { getDefaultTempoUid } from '../service/settings.service';
import qs from 'qs';

export const getQueryData = async (query: string, start: number, end: number, limit: number): Promise<any> => {
  const tempoUid = await getDefaultTempoUid();
  const startSeconds = Math.floor(start / 1000);
  const endSeconds = Math.floor(end / 1000);
  const payload = {
      q: query,
      start: startSeconds,
      end: endSeconds,
      limit: limit,
  };
  const res = await getBackendSrv().get(`/api/datasources/proxy/uid/${tempoUid}/api/search?${qs.stringify(payload)}`);
  // console.log('getQueryData res', res);
  return res;
}