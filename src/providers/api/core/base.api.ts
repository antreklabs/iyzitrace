import { getDataSourceSrv } from '@grafana/runtime';

export class BaseApi {
  static async getDatasourceInstance(uidOrName: string): Promise<any> {
    const ds = await getDataSourceSrv().get(uidOrName);
    if (!ds) {
      throw new Error(`Datasource ${uidOrName} not found`);
    }
    return ds;
  }
}
