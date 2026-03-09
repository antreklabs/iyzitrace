/**
 * Observability Platform Authentication Service
 * 
 * Configures Grafana datasources to include the API key as an Authorization header
 * when making requests to the observability platform backend.
 * 
 * When Global Security is enabled on the observability platform, all requests 
 * to Loki, Tempo, and Prometheus endpoints require Authorization: Bearer <api_key>
 */

import { getBackendSrv } from '@grafana/runtime';

// Datasource UIDs for observability platform (from provisioning)
const OBSERVABILITY_DATASOURCE_UIDS = [
    'loki-platform',
    'tempo-platform',
    'prometheus-platform'
];

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
 * Get observability platform datasources by their known UIDs
 */
export const getObservabilityDatasources = async (): Promise<DatasourceConfig[]> => {
    const datasources: DatasourceConfig[] = [];

    for (const uid of OBSERVABILITY_DATASOURCE_UIDS) {
        try {
            const ds = await getBackendSrv().get(`/api/datasources/uid/${uid}`);
            if (ds) {
                datasources.push(ds);
            }
        } catch {
            // Datasource may not exist, skip
        }
    }

    return datasources;
};

/**
 * Configure a single datasource to include the Authorization header
 */
export const configureDatasourceAuth = async (
    datasourceUid: string,
    apiKey: string
): Promise<void> => {
    try {
        const ds = await getBackendSrv().get(`/api/datasources/uid/${datasourceUid}`);

        // Add custom header configuration
        const updatedJsonData = {
            ...ds.jsonData,
            httpHeaderName1: 'Authorization',
        };

        await getBackendSrv().put(`/api/datasources/${ds.id}`, {
            ...ds,
            jsonData: updatedJsonData,
            secureJsonData: {
                httpHeaderValue1: `Bearer ${apiKey}`,
            },
        });

    } catch (error) {
        throw error;
    }
};

/**
 * Configure all observability platform datasources with the API key
 */
export const configureAllDatasourcesAuth = async (apiKey: string): Promise<void> => {
    const datasources = await getObservabilityDatasources();

    if (datasources.length === 0) {
        return;
    }

    for (const ds of datasources) {
        await configureDatasourceAuth(ds.uid, apiKey);
    }

};

/**
 * Remove Authorization header from all observability datasources
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
