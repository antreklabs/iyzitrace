// Landing Service - Check if different sections of the app have active data
import { getQueryData as getPrometheusQueryData } from '../provider/prometheus.provider';
import { getLabels } from '../provider/prometheus.provider';
import { getQueryData as getTempoQueryData } from '../provider/tempo.provider';
import { getQueryData as getLokiQueryData } from '../provider/loki.provider';
import { getPluginSettings, getSecurePluginSettings } from './settings.service';
import { getTeams } from './team.service';

/**
 * Check if Overview section is active
 * Overview is active if there are records in Prometheus __inv_base metric
 * @returns Promise<boolean> - true if overview has data
 */
export const isOverviewActive = async (): Promise<boolean> => {
  try {
    const data = await getPrometheusQueryData('__inv_base');
    return data?.result && data.result.length > 0;
  } catch (error) {
    console.error('Error checking overview active status:', error);
    return false;
  }
};

/**
 * Check if Service Map section is active
 * Service Map is active if there are records in Prometheus iyzitrace_service_graph_request_total metric
 * @returns Promise<boolean> - true if service map has data
 */
export const isServiceMapActive = async (): Promise<boolean> => {
  try {
    const data = await getPrometheusQueryData('iyzitrace_service_graph_request_total');
    return data?.result && data.result.length > 0;
  } catch (error) {
    console.error('Error checking service map active status:', error);
    return false;
  }
};

/**
 * Check if Services section is active
 * Services is active if Prometheus has any labels
 * @returns Promise<boolean> - true if services have data
 */
export const isServicesActive = async (): Promise<boolean> => {
  try {
    const labels = await getLabels();
    return labels && labels.length > 0;
  } catch (error) {
    console.error('Error checking services active status:', error);
    return false;
  }
};

/**
 * Check if Traces section is active
 * Traces is active if Tempo has any trace records
 * @returns Promise<boolean> - true if traces have data
 */
export const isTracesActive = async (): Promise<boolean> => {
  try {
    // Query last 1 hour for any traces, limit to 1 result
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    const data = await getTempoQueryData('{}', oneHourAgo, now, 1);
    return data?.traces && data.traces.length > 0;
  } catch (error) {
    console.error('Error checking traces active status:', error);
    return false;
  }
};

/**
 * Check if Logs section is active
 * Logs is active if Loki has any log records
 * @returns Promise<boolean> - true if logs have data
 */
export const isLogsActive = async (): Promise<boolean> => {
  try {
    // Query last 1 hour for any logs, limit to 1 result
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    const data = await getLokiQueryData('{job=~".+"}', oneHourAgo, now, 1, 'time', 'desc', '1m');
    return data?.data && data.data.length > 0;
  } catch (error) {
    console.error('Error checking logs active status:', error);
    return false;
  }
};

/**
 * Check if Views section is active
 * Views is active if there is at least one saved view
 * @returns Promise<boolean> - true if there are views
 */
export const isViewsActive = async (): Promise<boolean> => {
  try {
    const settings = await getPluginSettings();
    const pageViews = settings?.pageViews || [];
    return pageViews.length > 0;
  } catch (error) {
    console.error('Error checking views active status:', error);
    return false;
  }
};

/**
 * Check if Exceptions section is active
 * Exceptions is active if there are any exception records in Prometheus
 * @returns Promise<boolean> - true if there are exceptions
 */
export const isExceptionsActive = async (): Promise<boolean> => {
  try {
    const data = await getPrometheusQueryData('sum by(exception_type) (iyzitrace_span_metrics_events_total{exception_type=~".+"})');
    return data?.result && data.result.length > 0;
  } catch (error) {
    console.error('Error checking exceptions active status:', error);
    return false;
  }
};

/**
 * Check if Teams section is active
 * Teams is active if there is at least one team
 * @returns Promise<boolean> - true if there are teams
 */
export const isTeamsActive = async (): Promise<boolean> => {
  try {
    const teams = await getTeams({ perpage: 1 });
    return teams && teams.length > 0;
  } catch (error) {
    console.error('Error checking teams active status:', error);
    return false;
  }
};

/**
 * Check if Settings section is active
 * Settings is active if an API key has been configured
 * @returns Promise<boolean> - true if API key is configured
 */
export const isSettingsActive = async (): Promise<boolean> => {
  try {
    const settings = await getSecurePluginSettings();
    // Check if there's an API key configured
    return !!(settings?.apiKey);
  } catch (error) {
    console.error('Error checking settings active status:', error);
    return false;
  }
};

export const isAIActive = async (): Promise<boolean> => {
  try {
    const settings = await getPluginSettings();
    // Check if AI API key is configured
    return !!(settings?.aiConfig?.apiKey);
  } catch (error) {
    console.error('Error checking AI active status:', error);
    return false;
  }
};

/**
 * Get status of all sections at once
 * @returns Promise<object> - Object with all section statuses
 */
export const getAllSectionStatuses = async (): Promise<{
  overview: boolean;
  serviceMap: boolean;
  services: boolean;
  traces: boolean;
  logs: boolean;
  views: boolean;
  exceptions: boolean;
  teams: boolean;
  settings: boolean;
  ai: boolean;
}> => {
  try {
    // Run all checks in parallel for better performance
    const [
      overview,
      serviceMap,
      services,
      traces,
      logs,
      views,
      exceptions,
      teams,
      settings,
      ai,
    ] = await Promise.all([
      isOverviewActive(),
      isServiceMapActive(),
      isServicesActive(),
      isTracesActive(),
      isLogsActive(),
      isViewsActive(),
      isExceptionsActive(),
      isTeamsActive(),
      isSettingsActive(),
      isAIActive(),
    ]);

    return {
      overview,
      serviceMap,
      services,
      traces,
      logs,
      views,
      exceptions,
      teams,
      settings,
      ai,
    };
  } catch (error) {
    console.error('Error getting all section statuses:', error);
    // Return all false on error
    return {
      overview: false,
      serviceMap: false,
      services: false,
      traces: false,
      logs: false,
      views: false,
      exceptions: false,
      teams: false,
      settings: false,
      ai: false,
    };
  }
};

