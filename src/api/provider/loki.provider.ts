import { getDataSourceSrv } from '@grafana/runtime';
import { getDefaultLokiUid } from '../service/settings.service';
import { LokiReadRequestFactory } from './models/loki.read.request.model';
import { lastValueFrom, from, isObservable } from 'rxjs';

export const getQueryData = async (query: string, start: number, end: number, limit: number, 
    orderBy: string, orderDirection: 'asc' | 'desc', interval: string): Promise<any> => {
  const lokiUid = await getDefaultLokiUid();
  const datasource = await getDataSourceSrv().get(lokiUid);
  if (!datasource) {
    throw new Error(`Datasource ${lokiUid} not found`);
  }
  const lokiReadRequestModel = await LokiReadRequestFactory.create({
    expr: query,
    start: start,
    end: end,
    limit: limit,
    orderBy: orderBy,
    orderDirection: orderDirection as 'asc' | 'desc',
    interval: interval,
    timezone: "UTC",
  }, datasource);
  const queryResult = datasource.query(lokiReadRequestModel.request);
  const response = await lastValueFrom(isObservable(queryResult) ? queryResult : from(queryResult));

  return response;
}