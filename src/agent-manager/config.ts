// Backend configuration for Agent Manager
// Reads platform URL from plugin settings (jsonData.platformUrl)

import { getPluginSettings } from '../api/service/settings.service';

let cachedHostname: string | null = null;

export async function getBackendHostname(): Promise<string> {
    if (cachedHostname) {
        return cachedHostname;
    }
    try {
        const settings = await getPluginSettings();
        if (settings?.platformUrl) {
            cachedHostname = settings.platformUrl.replace(/\/$/, '');
            return cachedHostname;
        }
    } catch { }
    return 'http://localhost';
}

export async function getApiBaseUrl(): Promise<string> {
    const hostname = await getBackendHostname();
    return `${hostname}/api/v1/platform/opamp`;
}

// Keep sync exports for backward compatibility (will use cached value)
export const BACKEND_HOSTNAME = "http://localhost";
export const apiBaseUrl = `${BACKEND_HOSTNAME}/api/v1/platform/opamp`;
