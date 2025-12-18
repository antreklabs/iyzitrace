import { getBackendSrv, getDataSourceSrv } from '@grafana/runtime';
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
  return res;
}

export const TempoApi = {

  async getBaseUrl(): Promise<string> {
      const uid = await getDefaultTempoUid();
      const ds = await getDataSourceSrv().getInstanceSettings(uid);
      if (!ds) {
          throw new Error(`Data source with uid ${uid} not found`);
      }
      return ds.url!;
  },

  async getStatus(): Promise<any> {
      const url = await this.getBaseUrl();
      const res = await getBackendSrv().get(
          `${url}/api/v2/search/tag/status/values`,
      );
      return res;
  },

  async getTrace(traceId: string): Promise<any> {
      const url = await this.getBaseUrl();
      const res = await getBackendSrv().get(`${url}/api/traces/${traceId}`);
      return res;
  },
  
  async getTagScopes(): Promise<string[]> {
      return ['span', 'event', 'intrinsic', 'resource', 'unscoped'];
  },

  async getTagsByScope(scope: string): Promise<any> {
      const url = await this.getBaseUrl();
      const endpoint = `${url}/api/v2/search/tags?scope=${scope}`;
      const res = await getBackendSrv().get(endpoint);
      return res;
  },

  async getTagValuesByScope(scope: string, tagName: string): Promise<any> {
      const url = await this.getBaseUrl();
      const endpoint = `${url}/api/v2/search/tag/${scope}.${tagName}/values`;
      const res = await getBackendSrv().get(endpoint);
      return res;
  },
};