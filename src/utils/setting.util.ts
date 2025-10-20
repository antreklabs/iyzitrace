import { getBackendSrv } from '@grafana/runtime';
import pluginJson from '../plugin.json';
import type { PluginJsonData } from '../interfaces/options';

// Reuse the same PageState shape used across the app
export interface PageState {
  selectedDataSourceUid?: string;
  tempoDataSourceUid?: string;
  lokiDataSourceUid?: string;
  range?: [number, number];
  filters?: any;
  pageSize?: number;
}

const SETTING_STATE_PREFIX = 'settingState';

type Scope = {
  pluginId: string;
  orgId: string;
  pageName: string;
};

const resolveScope = async (pageName: string): Promise<Scope> => {
  const pluginId = pluginJson.id || 'iyzitrace-app';

  // Try to read org id from boot data first
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bootOrgId = (window as any)?.grafanaBootData?.user?.orgId;
  let orgId: string = bootOrgId ? String(bootOrgId) : '';
  if (!orgId) {
    try {
      const me = await getBackendSrv().get('/api/user');
      orgId = me?.orgId ? String(me.orgId) : '0';
    } catch {
      orgId = '0';
    }
  }

  return { pluginId, orgId, pageName };
};

const buildKey = (scope: Scope) => `${SETTING_STATE_PREFIX}_${scope.pluginId}_${scope.orgId}_${scope.pageName}`;

// Helpers to read/write plugin settings
async function readPluginSettings() {
  const pluginId = pluginJson.id || 'iyzitrace-app';
  return await getBackendSrv().get(`/api/plugins/${pluginId}/settings`);
}

async function writePluginSettings(jsonData: Record<string, any>) {
  const pluginId = pluginJson.id || 'iyzitrace-app';
  // Keep payload minimal; Grafana accepts partial with jsonData
  return await getBackendSrv().post(`/api/plugins/${pluginId}/settings`, { jsonData });
}

// Read default values from plugin settings (Defaults tab in Configuration)
export const getDefaultPageState = async (): Promise<PageState> => {
  try {
    const pluginId = pluginJson.id || 'iyzitrace-app';
    const settings = await getBackendSrv().get(`/api/plugins/${pluginId}/settings`);
    const jsonData = settings?.jsonData as PluginJsonData || {};

    // defaultAbsoluteRange is [startMs, endMs]
    const defaultRange: [number, number] = Array.isArray(jsonData.defaultAbsoluteRange)
      ? [Number(jsonData.defaultAbsoluteRange[0]) || Date.now() - 60 * 60 * 1000, Number(jsonData.defaultAbsoluteRange[1]) || Date.now()]
      : [Date.now() - 60 * 60 * 1000, Date.now()];

    const defaultLokiUid = jsonData.defaultLokiUid;
    const defaultTempoUid = jsonData.defaultTempoUid;


    return {
      range: defaultRange,
      tempoDataSourceUid: defaultTempoUid,
      lokiDataSourceUid: defaultLokiUid,
      filters: {},
      pageSize: 10,
    };
  } catch {
    return {
      range: [Date.now() - 60 * 60 * 1000, Date.now()],
      filters: {},
      pageSize: 10,
    };
  }
};

// Get page-scoped settings; if none exist, return defaults from plugin settings
export const getPageState = async (pageName: string): Promise<PageState> => {
  const scope = await resolveScope(pageName);
  const key = buildKey(scope);
  try {
    const settings = await readPluginSettings();
    const jsonData = (settings?.jsonData || {}) as Record<string, any>;
    const pageStates = (jsonData.pageStates || {}) as Record<string, PageState>;
    const saved = pageStates[key];
    if (saved) return saved;
    return await getDefaultPageState();
  } catch {
    return await getDefaultPageState();
  }
};

// Merge and persist updates under plugin+org+page scoped key
export const updatePageState = async (pageName: string, updates: Partial<PageState>) => {
  const scope = await resolveScope(pageName);
  const key = buildKey(scope);
  const current = await getPageState(pageName);
  const merged: PageState = { ...current, ...updates };

  const settings = await readPluginSettings();
  const jsonData = (settings?.jsonData || {}) as Record<string, any>;
  const pageStates = (jsonData.pageStates || {}) as Record<string, PageState>;
  const newPageStates = { ...pageStates, [key]: merged };
  await writePluginSettings({ ...jsonData, pageStates: newPageStates });
};


