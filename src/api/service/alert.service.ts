import { getBackendSrv } from "@grafana/runtime";

export const getAlertRules = async (): Promise<any> => {
  const promResponse = await getBackendSrv().get<any>('/api/prometheus/grafana/api/v1/rules');
  var failedChecks = await getFailedChecks();
  console.log('failedChecks', failedChecks);
  return promResponse;
};

export const getFailedChecks = async (): Promise<any> => {
    const response = await getBackendSrv().get<any>('/api/alertmanager/grafana/api/v2/alerts');
    console.log('failedChecks from Alertmanager API:', response);
    
    return response;
};


export type TimeRange = '1h' | '6h' | '1d' | '7d';

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  expression: string;
  enabled: boolean;
  thresholds: {
    critical?: number;
    warning?: number;
    degraded?: number;
  };
  category: string;
  technology: string;
}

export interface FailedCheck {
  id: string;
  status: 'CRITICAL' | 'WARNING' | 'DEGRADED';
  resource: string;
  summary: string;
  ruleName: string;
  timestamp: string;
  attributes: Record<string, any>;
}

export interface TimelineData {
  time: string;
  status: 'critical' | 'warning' | 'degraded' | 'healthy' | 'no-data';
  count: number;
}