// src/services/tempoApi.ts

import { getBackendSrv, getDataSourceSrv } from '@grafana/runtime';
import store from '../../../store/store';
import qs from 'qs';

type TraceQLSearchParams = {
    query: string;
    start: number;
    end: number;
    limit?: number;
};

export const TempoApi = {
    getSelectedUid(): string {
        const uid = store.getState().tempo.selectedTempoUid;
        if (!uid) {
            throw new Error('No Tempo UID selected.');
        }
        return uid;
    },

    async getBaseUrl(): Promise<string> {
        const uid = this.getSelectedUid();
        const ds = await getDataSourceSrv().getInstanceSettings(uid);
        if (!ds) {
            throw new Error(`Data source with uid ${uid} not found`);
        }
        return ds.url!;
    },

    async getServiceNames(): Promise<any> {
        const url = await this.getBaseUrl();
        const res = await getBackendSrv().get(`${url}/api/v2/search/tag/resource.service.name/values`);
        return res;
    },

    async getOperationNames(serviceNames: string[]): Promise<any[]> {
        console.log('serviceName', serviceNames);
        const url = await this.getBaseUrl();
        let payload = serviceNames.map((name) => `resource.service.name=${name}`).join('||');
        if(serviceNames.length>1){
            payload = `(${payload})`;
        }
        const res = await getBackendSrv().get(
            `${url}/api/v2/search/tag/name/values?q=${payload}`,
        );
        return res;
    },

    async getStatusByServiceName(serviceNames: string[]): Promise<any> {
        const url = await this.getBaseUrl();
        let payload = serviceNames.map((name) => `resource.service.name=${name}`).join('||');
        if(serviceNames.length>1){
            payload = `(${payload})`;
        }
        const res = await getBackendSrv().get(
            `${url}/api/v2/search/tag/status/values?q=${payload}`,
        );
        return res;
    },

    async getTrace(traceId: string): Promise<any> {
        const url = await this.getBaseUrl();
        const res = await getBackendSrv().get(`${url}/api/traces/${traceId}`);
        return res;
    },

    async searchTraceQL(params: TraceQLSearchParams): Promise<any> {
        const url = await this.getBaseUrl();
        const query = params.query;
        const payload = {
            q: query,
            start: params.start,
            end: params.end,
            limit: params.limit || 1000,
        };
        const res = await getBackendSrv().get(`${url}/api/search?${qs.stringify(payload)}`);
        return res;
    },

    async getTagValues(tagName: string): Promise<string[]> {
        const url = await this.getBaseUrl();
        const res = await getBackendSrv().get(`${url}/api/v2/search/tag/${tagName}/values`);
        return res.values ?? [];
    },
    async getAvgLatency(serviceName: string, start: number, end: number): Promise<Object | null> {
        const uid = store.getState().tempo.selectedTempoUid;
        const url = `/api/datasources/proxy/uid/${uid}/api/search`;

        const query = `service.name = "${serviceName}"`;

        const response = await getBackendSrv().post(url, {
            query,
            start: start * 1_000_000,
            end: end * 1_000_000,
            limit: 1000,
        });
        console.log(response);
        const traces = response?.traces ?? [];

        const durations: number[] = traces
            .filter((trace: any) => typeof trace.durationMs === 'number')
            .map((trace: any) => trace.durationMs);

        if (durations.length === 0) {
            return null;
        }
        const total = durations.reduce((sum, d) => sum + d, 0);
        const max = Math.max(...durations);
        const min = Math.min(...durations);
        const avg = total / durations.length;

        return {
            avg,
            max,
            min,
            count: durations.length,
        };
    },


    getAvailableTempos() {
        return getDataSourceSrv()
            .getList()
            .filter((ds) => ds.type === 'tempo');
    },
};
