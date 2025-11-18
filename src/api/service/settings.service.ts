import { getBackendSrv } from '@grafana/runtime';

const PLUGIN_ID = 'iyzitrace-app';

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

/**
 * Plugin settings'ini getirir
 * @returns Plugin settings objesi
 */
export const getPluginSettings = async (): Promise<PluginSettings> => {
  try {
    const response = await getBackendSrv().get(`/api/plugins/${PLUGIN_ID}/settings`);
    console.log('[getPluginSettings] response:', response);
    return response.jsonData || {};
  } catch (error) {
    console.error('Error getting plugin settings:', error);
    return {};
  }
};

/**
 * Plugin settings'ini kaydeder
 * @param settings - Kaydedilecek settings objesi
 * @returns Promise<void>
 */
export const savePluginSettings = async (settings: PluginSettings): Promise<void> => {
  try {
    // Mevcut settings'i al
    const currentSettings = await getPluginSettings();
    
    // Yeni settings'i mevcut settings ile merge et
    const mergedSettings = {
      ...currentSettings,
      ...settings
    };
    
    // Grafana API: POST /api/plugins/:pluginId/settings
    // request ile showSuccessAlert=false göndererek toast'ı bastır
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
    console.error('Error saving plugin settings:', error);
    throw error;
  }
};

/**
 * Default Prometheus datasource UID'ini getirir
 * @returns Promise<string> - Prometheus datasource UID
 */
export const getDefaultPrometheusUid = async (): Promise<string> => {
  try {
    // Önce Prometheus datasource'larını listele
    const datasources = await getBackendSrv().get('/api/datasources');
    
    // Prometheus datasource'unu bul
    const prometheusDs = datasources.find((ds: any) => 
      ds.type === 'prometheus' && ds.isDefault
    );
    
    if (prometheusDs) {
      return prometheusDs.uid;
    }
    
    // Default bulunamazsa ilk Prometheus datasource'unu al
    const firstPrometheusDs = datasources.find((ds: any) => ds.type === 'prometheus');
    if (firstPrometheusDs) {
      return firstPrometheusDs.uid;
    }
    
    // Hiç Prometheus datasource yoksa hata fırlat
    throw new Error('No Prometheus datasource found');
  } catch (error) {
    console.error('Error getting default Prometheus UID:', error);
    throw error;
  }
};

/**
 * Default Tempo datasource UID'ini getirir
 * @returns Promise<string> - Tempo datasource UID
 */
export const getDefaultTempoUid = async (): Promise<string> => {
  try {
    // Önce Tempo datasource'larını listele
    const datasources = await getBackendSrv().get('/api/datasources');
    
    // Tempo datasource'unu bul
    const tempoDs = datasources.find((ds: any) => 
      ds.type === 'tempo' && ds.isDefault
    );
    
    if (tempoDs) {
      return tempoDs.uid;
    }
    
    // Default bulunamazsa ilk Tempo datasource'unu al
    const firstTempoDs = datasources.find((ds: any) => ds.type === 'tempo');
    if (firstTempoDs) {
      return firstTempoDs.uid;
    }
    
    // Hiç Tempo datasource yoksa hata fırlat
    throw new Error('No Tempo datasource found');
  } catch (error) {
    console.error('Error getting default Tempo UID:', error);
    throw error;
  }
};

/**
 * Default Loki datasource UID'ini getirir
 * @returns Promise<string> - Loki datasource UID
 */
export const getDefaultLokiUid = async (): Promise<string> => {
  try {
    // Önce Loki datasource'larını listele
    const datasources = await getBackendSrv().get('/api/datasources');
    
    // Loki datasource'unu bul
    const lokiDs = datasources.find((ds: any) => 
      ds.type === 'loki' && ds.isDefault
    );
    
    if (lokiDs) {
      return lokiDs.uid;
    }
    
    // Default bulunamazsa ilk Loki datasource'unu al
    const firstLokiDs = datasources.find((ds: any) => ds.type === 'loki');
    if (firstLokiDs) {
      return firstLokiDs.uid;
    }
    
    // Hiç Loki datasource yoksa hata fırlat
    throw new Error('No Loki datasource found');
  } catch (error) {
    console.error('Error getting default Loki UID:', error);
    throw error;
  }
};