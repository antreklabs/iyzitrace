import { getBackendSrv } from "@grafana/runtime";

export const getAlertRules = async (): Promise<any> => {
  const promResponse = await getBackendSrv().get<any>('/api/prometheus/grafana/api/v1/rules');
  var failedChecks = await getFailedChecks();
  console.log('failedChecks', failedChecks);
  return promResponse;
};
/**
 * Get firing alerts from Grafana Alertmanager
 * Uses: GET /api/alertmanager/grafana/api/v2/alerts (Grafana Alertmanager API)
 * This endpoint returns all firing alerts from Grafana's unified alerting system.
 * 
 * Alternative endpoints:
 * - GET /api/alertmanager/{datasource}/api/v2/alerts (External alertmanager)
 * - GET /api/prometheus/grafana/api/v1/alerts (Prometheus-compatible format)
 */
export const getFailedChecks = async (): Promise<any> => {
  try {
    // Try Grafana Alertmanager API first (recommended for unified alerting)
    const response = await getBackendSrv().get<any>('/api/alertmanager/grafana/api/v2/alerts');
    console.log('failedChecks from Alertmanager API:', response);
    
    // Alertmanager API v2 returns an array of alerts directly
    if (Array.isArray(response)) {
      return response;
    }
    
    // Some versions might wrap it in a data property
    if (response?.data && Array.isArray(response.data)) {
      return response.data;
    }
    
    // If response is an object, try to extract alerts
    if (response?.alerts && Array.isArray(response.alerts)) {
      return response.alerts;
    }
    
    console.warn('Unexpected Alertmanager API response format:', response);
    return [];
  } catch (error: any) {
    console.error('Error fetching failed checks from Alertmanager API:', error);
    
    // Fallback to Prometheus-compatible endpoint
    if (error?.status === 404 || error?.status === 403) {
      console.log('Trying Prometheus-compatible endpoint as fallback...');
      try {
        const promResponse = await getBackendSrv().get<any>('/api/prometheus/grafana/api/v1/alerts');
        console.log('failedChecks from Prometheus API:', promResponse);
        
        // Prometheus API format might be different
        if (Array.isArray(promResponse)) {
          return promResponse;
        }
        if (promResponse?.data && Array.isArray(promResponse.data)) {
          return promResponse.data;
        }
        
        return promResponse || [];
      } catch (promError) {
        console.error('Prometheus endpoint also failed:', promError);
        throw promError;
      }
    }
    
    throw error;
  }
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