import { getBackendSrv } from "@grafana/runtime";
import type { TimeRange, AlertRule, FailedCheck, TimelineData } from '../../interfaces/api';

// Re-export for backwards compatibility
export type { TimeRange, AlertRule, FailedCheck, TimelineData };

export const getAlertRules = async (): Promise<any> => {
  const promResponse = await getBackendSrv().get<any>('/api/prometheus/grafana/api/v1/rules');
  return promResponse;
};

export const getFailedChecks = async (): Promise<any> => {
  const response = await getBackendSrv().get<any>('/api/alertmanager/grafana/api/v2/alerts');

  return response;
};