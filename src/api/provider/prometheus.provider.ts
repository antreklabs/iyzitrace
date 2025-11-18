// Prometheus Provider - API calls to Prometheus for labels and values
import { getBackendSrv } from '@grafana/runtime';
import { getDefaultPrometheusUid } from '../service/settings.service';

/**
 * Get available labels from Prometheus API
 * @returns Array of dropdown options with available labels
 */
export const getLabels = async (): Promise<string[]> => {
  try {
    const prometheusUid = await getDefaultPrometheusUid();
    const response = await getBackendSrv().get(`/api/datasources/proxy/uid/${prometheusUid}/api/v1/labels`);
    return response.data;
  } catch (error) {
    console.error('Error fetching labels from Prometheus:', error);
    // Fallback to empty array on error
    return [];
  }
};

/**
 * Get label values for a specific label from Prometheus API
 * @param labelName - The name of the label to get values for
 * @returns Array of dropdown options with label values
 */
export const getLabelValues = async (labelName: string): Promise<string[]> => {
  try {
    const prometheusUid = await getDefaultPrometheusUid();
    const response = await getBackendSrv().get(`/api/datasources/proxy/uid/${prometheusUid}/api/v1/label/${labelName}/values`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching label values for ${labelName} from Prometheus:`, error);
    // Fallback to empty array on error
    return [];
  }
};

export const getQueryData = async (query: string): Promise<any> => {
  const prometheusUid = await getDefaultPrometheusUid();
  console.log('getQueryData', query);
  const response = await getBackendSrv().get(`/api/datasources/proxy/uid/${prometheusUid}/api/v1/query`, {
    query: query,
  });
  return response.data;
};

export const getQueryRangeData = async (query: string, startMs: number, endMs: number, step: string): Promise<any> => {
  const prometheusUid = await getDefaultPrometheusUid();
  const start = Math.floor(startMs / 1000);
  const end = Math.floor(endMs / 1000);
  console.log('getQueryRangeData', query, start, end, step);
  const response = await getBackendSrv().get(`/api/datasources/proxy/uid/${prometheusUid}/api/v1/query_range`, {
    query,
    start,
    end,
    step,
  });
  return response.data;
};
