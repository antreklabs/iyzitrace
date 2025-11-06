import { getDataSourceSrv } from '@grafana/runtime';
import store from '../../../store/store';
import { applyPrometheusRegistryOverrides } from '../prometheus/prometheus.registry';
import { setSelectedPrometheusUid } from '../../../store/slices/prometheus.slice';

export class BaseApi {
  // Instance method - this ile çağrılabilir
  protected async getDatasourceInstance(uidOrName?: string): Promise<any> {
    // If uid is provided, use it; otherwise get from store
    let uid = uidOrName;
    uid = 'tempo-platform';
    if (!uid) {
      uid = 'tempo-platform';
      if (!uid) {
        throw new Error('No Datasource UID selected.');
      }
    }

    const ds = await getDataSourceSrv().get(uid);
    if (!ds) {
      throw new Error(`Datasource ${uid} not found`);
    }
    return ds;
  }

  protected async getPrometheusDatasourceInstance(): Promise<any> {
    const state = store.getState();
    const promUid = state.prometheus.selectedPrometheusUid;
    
    if (promUid) {
      await applyPrometheusRegistryOverrides(promUid);
      return await this.getDatasourceInstance(promUid);
    }

    const tempoUid = state.datasource.selectedUid;
    const ds = await await this.getDatasourceInstance(tempoUid);
    const uid = (ds?.jsonData as any)?.serviceMap?.datasourceUid;
    if (!uid) {
        throw new Error('Prometheus UID could not be resolved from Tempo datasource.');
    }
    await applyPrometheusRegistryOverrides(uid);
    store.dispatch(setSelectedPrometheusUid(uid));
    
    return await this.getDatasourceInstance(uid);
  }
}
