import { getBackendSrv } from '@grafana/runtime';

const PLUGIN_ID = 'antreklabs-iyzitrace-app';

export interface PluginSettings {
  pageViews?: Array<{
    id: string;
    title: string;
    description?: string;
    page: string;
    query: string;
    createdAt: string;
  }>;
  [key: string]: any;
}

export const getPluginSettings = async (): Promise<PluginSettings> => {
  try {
    const response = await getBackendSrv().get(`/api/plugins/${PLUGIN_ID}/settings`);
    return response.jsonData || {};
  } catch (error) {
    return {};
  }
};
export const getSecurePluginSettings = async (): Promise<PluginSettings> => {
  try {
    const response = await getBackendSrv().get(`/api/plugins/${PLUGIN_ID}/settings`);
    return response.secureJsonFields || {};
  } catch (error) {
    return {};
  }
};

export const savePluginSettings = async (settings: PluginSettings): Promise<void> => {
  try {
    const currentSettings = await getPluginSettings();
    
    const mergedSettings = {
      ...currentSettings,
      ...settings
    };
    
    await getBackendSrv().request({
      method: 'POST',
      url: `/api/plugins/${PLUGIN_ID}/settings`,
      data: {
        enabled: true,
        pinned: true,
        jsonData: mergedSettings,
        secureJsonData: {}
      },
      showSuccessAlert: false,
      showErrorAlert: true,
    });
  } catch (error) {
    throw error;
  }
};

export const getDefaultPrometheusUid = async (): Promise<string> => {
  try {
    const datasources = await getBackendSrv().get('/api/datasources');
    
    const prometheusDs = datasources.find((ds: any) => 
      ds.type === 'prometheus' && ds.isDefault
    );
    
    if (prometheusDs) {
      return prometheusDs.uid;
    }
    
    const firstPrometheusDs = datasources.find((ds: any) => ds.type === 'prometheus');
    if (firstPrometheusDs) {
      return firstPrometheusDs.uid;
    }
    
    throw new Error('No Prometheus datasource found');
  } catch (error) {
    throw error;
  }
};

export const getDefaultTempoUid = async (): Promise<string> => {
  try {
    const datasources = await getBackendSrv().get('/api/datasources');
    
    const tempoDs = datasources.find((ds: any) => 
      ds.type === 'tempo' && ds.isDefault
    );
    
    if (tempoDs) {
      return tempoDs.uid;
    }
    
    const firstTempoDs = datasources.find((ds: any) => ds.type === 'tempo');
    if (firstTempoDs) {
      return firstTempoDs.uid;
    }
    
    throw new Error('No Tempo datasource found');
  } catch (error) {
    throw error;
  }
};

export const getDefaultLokiUid = async (): Promise<string> => {
  try {
    const datasources = await getBackendSrv().get('/api/datasources');
    
    const lokiDs = datasources.find((ds: any) => 
      ds.type === 'loki' && ds.isDefault
    );
    
    if (lokiDs) {
      return lokiDs.uid;
    }
    
    const firstLokiDs = datasources.find((ds: any) => ds.type === 'loki');
    if (firstLokiDs) {
      return firstLokiDs.uid;
    }
    
    throw new Error('No Loki datasource found');
  } catch (error) {
    throw error;
  }
};