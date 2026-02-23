import { getBackendSrv } from '@grafana/runtime';
import { getDefaultPrometheusUid } from '../service/settings.service';

export const getLabels = async (): Promise<string[]> => {
  try {
    const prometheusUid = await getDefaultPrometheusUid();
    const response = await getBackendSrv().get(`/api/datasources/proxy/uid/${prometheusUid}/api/v1/labels`);
    return response.data;
  } catch (error) {
    return [];
  }
};

export const getLabelValues = async (labelName: string): Promise<string[]> => {
  try {
    const prometheusUid = await getDefaultPrometheusUid();
    const response = await getBackendSrv().get(`/api/datasources/proxy/uid/${prometheusUid}/api/v1/label/${labelName}/values`);
    return response.data;
  } catch (error) {
    return [];
  }
};

export const getLabelValuesWithFilter = async (labelName: string, matchSelector: string): Promise<string[]> => {
  try {
    const prometheusUid = await getDefaultPrometheusUid();
    const response = await getBackendSrv().get(
      `/api/datasources/proxy/uid/${prometheusUid}/api/v1/label/${labelName}/values`,
      { 'match[]': matchSelector }
    );
    return response.data;
  } catch (error) {
    return [];
  }
};

export const getQueryData = async (query: string): Promise<any> => {
  const prometheusUid = await getDefaultPrometheusUid();
  const response = await getBackendSrv().get(`/api/datasources/proxy/uid/${prometheusUid}/api/v1/query`, {
    query: query,
  });
  return response.data;
};

export const getQueryRangeData = async (query: string, startMs: number, endMs: number, step: string): Promise<any> => {
  const prometheusUid = await getDefaultPrometheusUid();
  const start = Math.floor(startMs / 1000);
  const end = Math.floor(endMs / 1000);
  const response = await getBackendSrv().get(`/api/datasources/proxy/uid/${prometheusUid}/api/v1/query_range`, {
    query,
    start,
    end,
    step,
  });
  return response.data;
};