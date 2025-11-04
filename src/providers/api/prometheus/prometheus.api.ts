
import { getBackendSrv } from '@grafana/runtime';
import { getDefaultPrometheusUid } from '../../../api/service/settings.service';


export const prometheusApi = {

    async runTraceQLQuery(query: string): Promise<any> {
        try {
            const uid = await getDefaultPrometheusUid();
            if (!uid) { throw new Error('No Prometheus UID selected'); }

            const url = `/api/datasources/proxy/uid/${uid}/api/v1/query`;
            // console.log('runTraceQLQuery', query);
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
            const uid = await getDefaultPrometheusUid();
            if (!uid) { throw new Error('No Prometheus UID selected'); }

            const url = `/api/datasources/proxy/uid/${uid}/api/v1/query_range`;
            // console.log('runTraceQlQueryRange', query);
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
