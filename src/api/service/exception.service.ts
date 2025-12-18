import { FilterParamsModel } from "./query.service";
import { getQueryData } from "../provider/prometheus.provider";
import { getQueryData as getTempoQueryData } from "../provider/tempo.provider";
import { TempoApi } from "../provider/tempo.provider";

export const getExceptions = async (filterParamsModel: FilterParamsModel): Promise<ExceptionGroup[]> => {
  const query = 'sum by(service_name, span_name, type, exception_type, exception_message) (iyzitrace_span_metrics_events_total{exception_type=~".+"})';
  const data = await getQueryData(query);
  const exceptionGroupQueryData: ExceptionGroup[] = data.result.map((result: any) => ({
    service: result.metric.service_name,
    operation: result.metric.span_name,
    type: result.metric.type,
    exceptionType: result.metric.exception_type,
    exceptionMessage: result.metric.exception_message,
    traces: [] as any[],
    count: parseFloat(result.value[1]),
  }));

  return exceptionGroupQueryData;
};

export const getExceptionsByType = async (exceptionType: string, filterParamsModel: FilterParamsModel): Promise<any[]> => {
  
  const exceptionsByType: any[] = [];
  const exceptionQuery = `{event.exception.type="${exceptionType}"}`;
  const exceptionData : any = await getTempoQueryData(exceptionQuery, filterParamsModel.timeRange.from, filterParamsModel.timeRange.to, parseInt(filterParamsModel.options.limit || '1000'));
  const traceIds = exceptionData.traces.map((result: any) => result.traceID);
  for(const traceId of traceIds) {
    const trace = await TempoApi.getTrace(traceId);
    exceptionsByType.push(trace);
  }

  return exceptionsByType;
};

export interface ExceptionGroup {
  service: string;
  operation: string;
  type: string;
  exceptionType: string;
  exceptionMessage: string;
  traces: any[];
  count: number;
}