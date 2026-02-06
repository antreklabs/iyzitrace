/**
 * Observability Platform Authentication Service
 * 
 * Configures Grafana datasources to include the API key as an Authorization header
 * when making requests to the observability platform backend.
 * 
 * When Global Security is enabled on the observability platform, all requests 
 * to Loki, Tempo, and Prometheus endpoints must include:
 *   Authorization: Bearer <api_key>
 */

import { getBackendSrv } from '@grafana/runtime';
import { getSecurePluginSettings, getPluginSettings } from './settings.service';

const PLUGIN_ID = 'iyzitrace-app';

interface DatasourceConfig {
    id: number;
    uid: string;
    name: string;
    type: string;
    url: string;
    jsonData: Record<string, any>;
    secureJsonFields: Record<string, boolean>;
}

/**
 * Check if the API key is configured in the plugin settings
 */
export const isApiKeyConfigured = async (): Promise<boolean> => {
    try {
        const secureFields = await getSecurePluginSettings();
        return !!secureFields?.apiKey;
    } catch {
        return false;
    }
};

/**
 * Get the stored API key from plugin secureJsonData
 * Note: This returns the actual key only if it was just set (pending save).
 * For already-saved keys, secureJsonData is not accessible from frontend.
 */
export const getApiKeyFromSettings = async (): Promise<string | null> => {
    try {
        const response = await getBackendSrv().get(`/api/plugins/${PLUGIN_ID}/settings`);
        // Check if there's a pending (not yet saved) key
        if (response.secureJsonData?.apiKey) {
            return response.secureJsonData.apiKey;
        }
        return null;
    } catch {
        return null;
    }
};

/**
 * Get all datasources that need API key configuration
 */
export const getObservabilityDatasources = async (): Promise<DatasourceConfig[]> => {
    try {
        const datasources = await getBackendSrv().get('/api/datasources');
        // Filter for Loki, Tempo, and Prometheus datasources
        return datasources.filter((ds: any) =>
            ['loki', 'tempo', 'prometheus'].includes(ds.type)
        );
    } catch {
        return [];
    }
};

/**
 * Configure a datasource to include the Authorization header
 * This adds custom HTTP headers to the datasource configuration
 */
export const configureDatasourceAuth = async (
    datasourceUid: string,
    apiKey: string
): Promise<void> => {
    try {
        // Get current datasource config
        const ds = await getBackendSrv().get(`/api/datasources/uid/${datasourceUid}`);

        // Update jsonData to include custom header configuration
        const updatedJsonData = {
            ...ds.jsonData,
            httpHeaderName1: 'Authorization',
        };

        // Update datasource with new configuration
        await getBackendSrv().put(`/api/datasources/${ds.id}`, {
            ...ds,
            jsonData: updatedJsonData,
            secureJsonData: {
                httpHeaderValue1: `Bearer ${apiKey}`,
            },
        });
    } catch (error) {
        console.error(`Failed to configure auth for datasource ${datasourceUid}:`, error);
        throw error;
    }
};

/**
 * Configure all observability datasources with the API key
 */
export const configureAllDatasourcesAuth = async (apiKey: string): Promise<void> => {
    const datasources = await getObservabilityDatasources();

    for (const ds of datasources) {
        await configureDatasourceAuth(ds.uid, apiKey);
    }
};

/**
 * Remove Authorization header from all observability datasources
 * Call this when Global Security is disabled
 */
export const removeAllDatasourcesAuth = async (): Promise<void> => {
    const datasources = await getObservabilityDatasources();

    for (const ds of datasources) {
        try {
            const currentDs = await getBackendSrv().get(`/api/datasources/uid/${ds.uid}`);

            // Remove custom header configuration
            const { httpHeaderName1, ...restJsonData } = currentDs.jsonData || {};

            await getBackendSrv().put(`/api/datasources/${currentDs.id}`, {
                ...currentDs,
                jsonData: restJsonData,
                secureJsonData: {
                    httpHeaderValue1: '',
                },
            });
        } catch (error) {
            console.error(`Failed to remove auth from datasource ${ds.uid}:`, error);
        }
    }
};

/**
 * Check if datasources are configured with Authorization header
 */
export const areDatasourcesConfigured = async (): Promise<boolean> => {
    try {
        const datasources = await getObservabilityDatasources();

        if (datasources.length === 0) {
            return false;
        }

        // Check if at least one datasource has the header configured
        for (const ds of datasources) {
            const currentDs = await getBackendSrv().get(`/api/datasources/uid/${ds.uid}`);
            if (currentDs.jsonData?.httpHeaderName1 === 'Authorization' &&
                currentDs.secureJsonFields?.httpHeaderValue1) {
                return true;
            }
        }

        return false;
    } catch {
        return false;
    }
};
