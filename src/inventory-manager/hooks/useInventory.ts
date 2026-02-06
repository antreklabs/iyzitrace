import { useState, useEffect, useCallback } from 'react';
import * as api from '../api/inventory';
import type {
    EntitiesResponse,
    RelationsResponse,
    StatsResponse,
    TopologyResponse,
    Entity,
    EntityType,
} from '../types/inventory';

// Hook for fetching stats
export function useStats() {
    const [stats, setStats] = useState<StatsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const refresh = useCallback(async () => {
        try {
            setLoading(true);
            const data = await api.getStats();
            setStats(data);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to fetch stats'));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    return { stats, loading, error, refresh };
}

// Hook for fetching entities with pagination
export function useEntities(params?: {
    type?: EntityType[];
    name?: string;
    limit?: number;
    offset?: number;
}) {
    const [data, setData] = useState<EntitiesResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const refresh = useCallback(async () => {
        try {
            setLoading(true);
            const result = await api.getEntities(params);
            setData(result);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to fetch entities'));
        } finally {
            setLoading(false);
        }
    }, [params?.type?.join(','), params?.name, params?.limit, params?.offset]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    return { data, loading, error, refresh };
}

// Hook for fetching a single entity
export function useEntity(id: string | null) {
    const [entity, setEntity] = useState<Entity | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!id) {
            setEntity(null);
            return;
        }

        const fetchEntity = async () => {
            try {
                setLoading(true);
                const data = await api.getEntity(id);
                setEntity(data);
                setError(null);
            } catch (err) {
                setError(err instanceof Error ? err : new Error('Failed to fetch entity'));
            } finally {
                setLoading(false);
            }
        };

        fetchEntity();
    }, [id]);

    return { entity, loading, error };
}

// Hook for fetching relations
export function useRelations(params?: {
    limit?: number;
    offset?: number;
}) {
    const [data, setData] = useState<RelationsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const refresh = useCallback(async () => {
        try {
            setLoading(true);
            const result = await api.getRelations(params);
            setData(result);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to fetch relations'));
        } finally {
            setLoading(false);
        }
    }, [params?.limit, params?.offset]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    return { data, loading, error, refresh };
}

// Hook for fetching topology
export function useTopology() {
    const [topology, setTopology] = useState<TopologyResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const refresh = useCallback(async () => {
        try {
            setLoading(true);
            const data = await api.getTopology();
            setTopology(data);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to fetch topology'));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    return { topology, loading, error, refresh };
}
