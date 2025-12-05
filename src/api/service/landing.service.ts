// Landing Service - Check if different sections of the app have active data
import { getBackendSrv } from '@grafana/runtime';
import { getQueryData as getPrometheusQueryData } from '../provider/prometheus.provider';
import { getLabels } from '../provider/prometheus.provider';
import { getQueryData as getTempoQueryData } from '../provider/tempo.provider';
import { getQueryData as getLokiQueryData } from '../provider/loki.provider';
import { getPluginSettings, getSecurePluginSettings } from './settings.service';
import { getTeams } from './team.service';
import { getOrphanServices } from './service-map.service';
import { FilterParamsModel } from './query.service';

/**
 * Step 1: Check if API Key is set
 * @returns Promise<boolean> - true if API key is configured
 */
export const isApiKeySet = async (): Promise<boolean> => {
  try {
    const settings = await getSecurePluginSettings();
    return !!(settings?.apiKey);
  } catch (error) {
    console.error('Error checking API key:', error);
    return false;
  }
};

/**
 * Step 2: Check if Tempo datasource is added
 * @returns Promise<boolean> - true if at least one Tempo datasource exists
 */
export const hasTempoDataSource = async (): Promise<boolean> => {
  try {
    const datasources = await getBackendSrv().get('/api/datasources');
    return datasources.some((ds: any) => ds.type === 'tempo');
  } catch (error) {
    console.error('Error checking Tempo datasource:', error);
    return false;
  }
};

/**
 * Step 3: Check if Loki datasource is added
 * @returns Promise<boolean> - true if at least one Loki datasource exists
 */
export const hasLokiDataSource = async (): Promise<boolean> => {
  try {
    const datasources = await getBackendSrv().get('/api/datasources');
    return datasources.some((ds: any) => ds.type === 'loki');
  } catch (error) {
    console.error('Error checking Loki datasource:', error);
    return false;
  }
};

/**
 * Step 4: Check if Prometheus datasource is added
 * @returns Promise<boolean> - true if at least one Prometheus datasource exists
 */
export const hasPrometheusDataSource = async (): Promise<boolean> => {
  try {
    const datasources = await getBackendSrv().get('/api/datasources');
    return datasources.some((ds: any) => ds.type === 'prometheus');
  } catch (error) {
    console.error('Error checking Prometheus datasource:', error);
    return false;
  }
};

/**
 * Step 5: Check if traces are being sent
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
 * Step 6: Check if logs are being sent
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
 * Step 7: Check if metrics are being sent
 * Metrics is active if Prometheus has any data
 * @returns Promise<boolean> - true if metrics have data
 */
export const hasMetrics = async (): Promise<boolean> => {
  try {
    const labels = await getLabels();
    return labels && labels.length > 0;
  } catch (error) {
    console.error('Error checking metrics active status:', error);
    return false;
  }
};

/**
 * Step 8: Check if orphan services are assigned
 * @returns Promise<boolean> - true if there are no orphan services (all services are assigned)
 */
export const hasOrphanServicesAssigned = async (): Promise<boolean> => {
  try {
    // Create a simple filter with default time range
    const filterModel = new FilterParamsModel({
      from: String(Date.now() - 86400000), // Last 24 hours
      to: String(Date.now()),
    });
    
    const orphanServices = await getOrphanServices(filterModel);
    // If there are no orphan services, it means all services are assigned
    return orphanServices.length === 0;
  } catch (error) {
    console.error('Error checking orphan services assignment:', error);
    return false;
  }
};

/**
 * Step 9: Check if AI Assistant is configured
 * @returns Promise<boolean> - true if AI API key is configured
 */
export const isAIConfigured = async (): Promise<boolean> => {
  try {
    const settings = await getPluginSettings();
    return !!(settings?.aiConfig?.apiKey);
  } catch (error) {
    console.error('Error checking AI configuration:', error);
    return false;
  }
};

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


/**
 * Get setup step statuses for landing page
 * @returns Promise<object> - Object with all setup step statuses
 */
export const getSetupStepStatuses = async (): Promise<{
  apiKey: boolean;
  tempo: boolean;
  loki: boolean;
  prometheus: boolean;
  traces: boolean;
  logs: boolean;
  metrics: boolean;
  orphanServices: boolean;
  ai: boolean;
}> => {
  try {
    // Run all checks in parallel for better performance
    const [
      apiKey,
      tempo,
      loki,
      prometheus,
      traces,
      logs,
      metrics,
      orphanServices,
      ai,
    ] = await Promise.all([
      isApiKeySet(),
      hasTempoDataSource(),
      hasLokiDataSource(),
      hasPrometheusDataSource(),
      isTracesActive(),
      isLogsActive(),
      hasMetrics(),
      hasOrphanServicesAssigned(),
      isAIConfigured(),
    ]);

    return {
      apiKey,
      tempo,
      loki,
      prometheus,
      traces,
      logs,
      metrics,
      orphanServices,
      ai,
    };
  } catch (error) {
    console.error('Error getting setup step statuses:', error);
    // Return all false on error
    return {
      apiKey: false,
      tempo: false,
      loki: false,
      prometheus: false,
      traces: false,
      logs: false,
      metrics: false,
      orphanServices: false,
      ai: false,
    };
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
      isAIConfigured(),
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

