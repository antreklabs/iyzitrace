import type {
    EntitiesResponse,
    RelationsResponse,
    StatsResponse,
    TopologyResponse,
    Entity,
    Relation,
    EntityType,
    RelationType,
} from '../types/inventory';
import { getPluginSettings } from '../../api/service/settings.service';

// API base - dynamically read from plugin settings (platformUrl)
let cachedApiBase: string | null = null;

async function getApiBase(): Promise<string> {
    if (cachedApiBase) {
        return cachedApiBase;
    }
    try {
        const settings = await getPluginSettings();
        if (settings?.platformUrl) {
            cachedApiBase = `${settings.platformUrl.replace(/\/$/, '')}/inventory/api/v1`;
            return cachedApiBase;
        }
    } catch { }
    return 'http://localhost:80/inventory/api/v1';
}

// Generic fetch wrapper with error handling
async function fetchAPI<T>(endpoint: string): Promise<T> {
    const apiBase = await getApiBase();
    const response = await fetch(`${apiBase}${endpoint}`);
    if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    return response.json();
}

// Entities API
export async function getEntities(params?: {
    type?: EntityType[];
    name?: string;
    limit?: number;
    offset?: number;
}): Promise<EntitiesResponse> {
    const searchParams = new URLSearchParams();
    if (params?.type) {
        params.type.forEach(t => searchParams.append('type', t));
    }
    if (params?.name) {
        searchParams.set('name', params.name);
    }
    if (params?.limit) {
        searchParams.set('limit', params.limit.toString());
    }
    if (params?.offset) {
        searchParams.set('offset', params.offset.toString());
    }
    const query = searchParams.toString();
    return fetchAPI<EntitiesResponse>(`/entities${query ? `?${query}` : ''}`);
}

export async function getEntity(id: string): Promise<Entity> {
    return fetchAPI<Entity>(`/entities/${id}`);
}

export async function getEntityRelations(
    id: string,
    direction?: 'incoming' | 'outgoing' | 'both'
): Promise<{ relations: Relation[]; count: number }> {
    const query = direction ? `?direction=${direction}` : '';
    return fetchAPI(`/entities/${id}/relations${query}`);
}

// Relations API
export async function getRelations(params?: {
    type?: RelationType[];
    from?: string;
    to?: string;
    limit?: number;
    offset?: number;
}): Promise<RelationsResponse> {
    const searchParams = new URLSearchParams();
    if (params?.type) {
        params.type.forEach(t => searchParams.append('type', t));
    }
    if (params?.from) {
        searchParams.set('from', params.from);
    }
    if (params?.to) {
        searchParams.set('to', params.to);
    }
    if (params?.limit) {
        searchParams.set('limit', params.limit.toString());
    }
    if (params?.offset) {
        searchParams.set('offset', params.offset.toString());
    }
    const query = searchParams.toString();
    return fetchAPI<RelationsResponse>(`/relations${query ? `?${query}` : ''}`);
}

// Stats API
export async function getStats(): Promise<StatsResponse> {
    return fetchAPI<StatsResponse>('/stats');
}

// Topology API
export async function getTopology(): Promise<TopologyResponse> {
    return fetchAPI<TopologyResponse>('/topology');
}

// Health API
export async function getHealth(): Promise<{ status: string }> {
    return fetchAPI<{ status: string }>('/health');
}
