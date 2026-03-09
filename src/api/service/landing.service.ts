import { getBackendSrv } from '@grafana/runtime';
import { getQueryData as getPrometheusQueryData } from '../provider/prometheus.provider';
import { getLabels } from '../provider/prometheus.provider';
import { getQueryData as getTempoQueryData } from '../provider/tempo.provider';
import { getQueryData as getLokiQueryData } from '../provider/loki.provider';
import { getPluginSettings, getSecurePluginSettings, savePluginSettings } from './settings.service';
import { getTeams } from './team.service';
import { getOrphanServices } from './service-map.service';
import { FilterParamsModel } from './query.service';

export const isApiKeySet = async (): Promise<boolean> => {
  try {
    // If authType is 'open', no API key is needed
    const pluginSettings = await getPluginSettings();
    if (pluginSettings?.authType === 'open') {
      return true;
    }
    const settings = await getSecurePluginSettings();
    return !!(settings?.apiKey);
  } catch (error) {
    return false;
  }
};

export const isPlatformRunning = async (): Promise<boolean> => {
  try {
    // Check if the observability platform is running by hitting the inventory service health endpoint
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      await fetch('http://localhost:8082/health', {
        method: 'GET',
        signal: controller.signal,
        mode: 'no-cors',
      });
      clearTimeout(timeoutId);
      return true;
    } catch {
      clearTimeout(timeoutId);
      return false;
    }
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
    // Use the same API key/base URL as ai.service.ts
    const settings = await getPluginSettings();
    const apiKey = settings?.aiConfig?.apiKey || '';
    const baseUrl = 'https://openrouter.ai/api/v1';

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      // Use the models endpoint as a lightweight health check
      const response = await fetch(`${baseUrl}/models?supported_parameters=temperature`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      clearTimeout(timeoutId);
      return false;
    }
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

export const isAgentManagerActive = async (): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch('http://localhost/api/v1/platform/opamp/agents/stats', {
        method: 'GET',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data?.totalAgents > 0;
    } catch {
      clearTimeout(timeoutId);
      return false;
    }
  } catch (error) {
    return false;
  }
};

export const isInventoryManagerActive = async (): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch('http://localhost:80/inventory/api/v1/stats', {
        method: 'GET',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      // API returns EntityCount (capital E)
      return data?.EntityCount > 0;
    } catch {
      clearTimeout(timeoutId);
      return false;
    }
  } catch (error) {
    return false;
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
  ai: boolean;
  agentManager: boolean;
  inventoryManager: boolean;
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
      ai,
      agentManager,
      inventoryManager,
    ] = await Promise.all([
      isOverviewActive(),
      isServiceMapActive(),
      isServicesActive(),
      isTracesActive(),
      isLogsActive(),
      isViewsActive(),
      isExceptionsActive(),
      isTeamsActive(),
      isAIConfigured(),
      isAgentManagerActive(),
      isInventoryManagerActive(),
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
      ai,
      agentManager,
      inventoryManager,
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
      ai: false,
      agentManager: false,
      inventoryManager: false,
    };
  }
};

// Pages that use ViewComponent (via BaseContainerComponent)
const VIEW_ENABLED_PAGES = [
  'overview',
  'services',
  'traces',
  'logs',
  'exceptions',
  'service-map',
];

export const ensureAllDefaultViews = async (): Promise<void> => {
  try {
    const settings = await getPluginSettings();
    const pageViews = settings.pageViews || [];

    // Find pages that don't have any view yet
    const existingPages = new Set(pageViews.map((v: any) => v.page));
    const missingPages = VIEW_ENABLED_PAGES.filter(page => !existingPages.has(page));

    if (missingPages.length === 0) {
      return; // All default views already exist
    }

    // Create default views for missing pages
    const newViews = missingPages.map(page => ({
      id: `view-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      title: 'default',
      description: '',
      page,
      query: '',
      data: {},
      createdAt: new Date().toISOString(),
    }));

    await savePluginSettings({
      ...settings,
      pageViews: [...pageViews, ...newViews],
    });
  } catch (error) {
    // Silently fail — views will be created when pages are visited
  }
};