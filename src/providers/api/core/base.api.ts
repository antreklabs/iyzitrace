import { getDataSourceSrv } from '@grafana/runtime';
import store from '../../../store/store';

export class BaseApi {
  // Instance method - this ile çağrılabilir
  protected async getDatasourceInstance(uidOrName?: string): Promise<any> {
    // If uid is provided, use it; otherwise get from store
    let uid = uidOrName;
    if (!uid) {
      uid = store.getState().datasource.selectedUid ?? undefined;
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
}
