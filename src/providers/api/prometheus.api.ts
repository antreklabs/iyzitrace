import store from '../../store/store';
import { getBackendSrv, getDataSourceSrv } from '@grafana/runtime';
import { setSelectedPrometheusUid } from '../../store/slices/tempo.slice'; // varsa burada

export const prometheusApi = {
    async resolvePrometheusUid(): Promise<string> {
        const state = store.getState();
        const promUid = state.tempo.selectedPrometheusUid;
        const tempoUid = state.tempo.selectedTempoUid;

        if (promUid) {
            return promUid;
        }
        const ds = await getDataSourceSrv().getInstanceSettings(tempoUid);
        const uid = (ds?.jsonData as any)?.tracesToMetrics?.datasourceUid;
        if (!uid) {
            throw new Error('Prometheus UID could not be resolved from Tempo datasource.');
        }
        store.dispatch(setSelectedPrometheusUid(uid));
        return uid;
    },

    async runTraceQLQuery(query: string): Promise<any> {
        try {
            const uid = await this.resolvePrometheusUid();
            if (!uid) { throw new Error('No Prometheus UID selected'); }

            const url = `/api/datasources/proxy/uid/${uid}/api/v1/query`;
            const res = await getBackendSrv().get(url, {
                query
            });
            return res.data.result;
        } catch (err) {
            console.error('Prometheus query failed:', err);
            return 0;
        }
    },
    async runTraceQlQueryRange(query: string, start: number, end: number,step: string): Promise<any> {
        try {
            const uid = await this.resolvePrometheusUid();
            if (!uid) { throw new Error('No Prometheus UID selected'); }

            const url = `/api/datasources/proxy/uid/${uid}/api/v1/query_range`;
            const res = await getBackendSrv().get(url, {
                query,
                start,
                end,
                step
            });
            return res.data.result;
        }
        catch (err) {
            console.error('Prometheus query failed:', err);
            return 0;
        }
    },
    getPrometheusDuration(start: number, end: number): string {
        const diffSec = Math.floor((end - start) / 1000);

        if (diffSec < 60) {
            return `${diffSec}s`;
        }
        if (diffSec < 3600) { return `${Math.floor(diffSec / 60)}m`; }
        if (diffSec < 86400) { return `${Math.floor(diffSec / 3600)}h`; }
        return `${Math.floor(diffSec / 86400)}d`;
    }
};
