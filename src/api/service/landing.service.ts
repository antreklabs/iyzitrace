import { getBackendSrv } from '@grafana/runtime';
import { getQueryData as getPrometheusQueryData } from '../provider/prometheus.provider';
import { getLabels } from '../provider/prometheus.provider';
import { getQueryData as getTempoQueryData } from '../provider/tempo.provider';
import { getQueryData as getLokiQueryData } from '../provider/loki.provider';
import { getPluginSettings, getSecurePluginSettings } from './settings.service';
import { getTeams } from './team.service';
import { getOrphanServices } from './service-map.service';
import { FilterParamsModel } from './query.service';

export const isApiKeySet = async (): Promise<boolean> => {
  try {
    const settings = await getSecurePluginSettings();
    return !!(settings?.apiKey);
  } catch (error) {
    return false;
  }
};

export const hasTempoDataSource = async (): Promise<boolean> => {
  try {
    const datasources = await getBackendSrv().get('/api/datasources');
    return datasources.some((ds: any) => ds.type === 'tempo');
  } catch (error) {
    return false;
  }
};

export const hasLokiDataSource = async (): Promise<boolean> => {
  try {
    const datasources = await getBackendSrv().get('/api/datasources');
    return datasources.some((ds: any) => ds.type === 'loki');
  } catch (error) {
    return false;
  }
};

export const hasPrometheusDataSource = async (): Promise<boolean> => {
  try {
    const datasources = await getBackendSrv().get('/api/datasources');
    return datasources.some((ds: any) => ds.type === 'prometheus');
  } catch (error) {
    return false;
  }
};

export const isTracesActive = async (): Promise<boolean> => {
  try {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    const data = await getTempoQueryData('{}', oneHourAgo, now, 1);
    return data?.traces && data.traces.length > 0;
  } catch (error) {
    return false;
  }
};

export const isLogsActive = async (): Promise<boolean> => {
  try {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    const data = await getLokiQueryData('{job=~".+"}', oneHourAgo, now, 1, 'time', 'desc', '1m');
    return data?.data && data.data.length > 0;
  } catch (error) {
    return false;
  }
};

export const hasMetrics = async (): Promise<boolean> => {
  try {
    const labels = await getLabels();
    return labels && labels.length > 0;
  } catch (error) {
    return false;
  }
};

export const hasOrphanServicesAssigned = async (): Promise<boolean> => {
  try {
    const filterModel = new FilterParamsModel({
      from: String(Date.now() - 86400000),
      to: String(Date.now()),
    });
    
    const orphanServices = await getOrphanServices(filterModel);
    return orphanServices.length === 0;
  } catch (error) {
    return false;
  }
};

export const isAIConfigured = async (): Promise<boolean> => {
  try {
    const settings = await getPluginSettings();
    return !!(settings?.aiConfig?.apiKey);
  } catch (error) {
    return false;
  }
};

export const isOverviewActive = async (): Promise<boolean> => {
  try {
    const data = await getPrometheusQueryData('__inv_base');
    return data?.result && data.result.length > 0;
  } catch (error) {
    return false;
  }
};

export const isServiceMapActive = async (): Promise<boolean> => {
  try {
    const data = await getPrometheusQueryData('iyzitrace_service_graph_request_total');
    return data?.result && data.result.length > 0;
  } catch (error) {
    return false;
  }
};

export const isServicesActive = async (): Promise<boolean> => {
  try {
    const labels = await getLabels();
    return labels && labels.length > 0;
  } catch (error) {
    return false;
  }
};

export const isViewsActive = async (): Promise<boolean> => {
  try {
    const settings = await getPluginSettings();
    const pageViews = settings?.pageViews || [];
    return pageViews.length > 0;
  } catch (error) {
    return false;
  }
};

export const isExceptionsActive = async (): Promise<boolean> => {
  try {
    const data = await getPrometheusQueryData('sum by(exception_type) (iyzitrace_span_metrics_events_total{exception_type=~".+"})');
    return data?.result && data.result.length > 0;
  } catch (error) {
    return false;
  }
};

export const isTeamsActive = async (): Promise<boolean> => {
  try {
    const teams = await getTeams({ perpage: 1 });
    return teams && teams.length > 0;
  } catch (error) {
    return false;
  }
};

export const isSettingsActive = async (): Promise<boolean> => {
  try {
    const settings = await getSecurePluginSettings();
    return !!(settings?.apiKey);
  } catch (error) {
    return false;
  }
};

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