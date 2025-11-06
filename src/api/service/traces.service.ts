import { FilterParamsModel } from "./query.service";
import { Trace } from "./interface.service";
import { getQueryData } from "../provider/tempo.provider";

interface ResultItem {
  metrics: any;
  traces: [{
    traceID: string;
    durationMs: number;
    rootServiceName: string;
    rootTraceName: string;
    startTimeUnixNano: string;
    serviceStats: {
      [serviceName: string]: {
        spanCount: number;
        sumDurationNanos: number;
      };
    };
    spanSet: {
      spans: [{
        spanID: string;
        startTimeUnixNano: string;
        durationNanos: string;
      }]
      matched: number;
    };
    spanSets: {
      spans: [{
        spanID: string;
        startTimeUnixNano: string;
        durationNanos: string;
      }]
      matched: number;
    }[];
  }];
}

function computeStartEndIso(startTimeUnixNano: any, durationMsInput: any): { startTime: string; endTime: string } {
  function formatUtc(date: Date): string {
    const yyyy = date.getUTCFullYear();
    const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(date.getUTCDate()).padStart(2, '0');
    const hh = String(date.getUTCHours()).padStart(2, '0');
    const mi = String(date.getUTCMinutes()).padStart(2, '0');
    const ss = String(date.getUTCSeconds()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
  }

  const startTimeNano = Number(startTimeUnixNano);
  const durationMs = Number(durationMsInput) || 0;

  const startTimeMs = Number.isFinite(startTimeNano) && startTimeNano > 0
    ? Math.floor(startTimeNano / 1_000_000)
    : Date.now();

  const startDate = new Date(startTimeMs);
  const endDate = new Date(startTimeMs + durationMs);

  const startTime = Number.isFinite(startDate.getTime())
    ? formatUtc(startDate)
    : formatUtc(new Date());

  const endTime = Number.isFinite(endDate.getTime())
    ? formatUtc(endDate)
    : formatUtc(new Date());

  return { startTime, endTime };
}

export const getTracesTableData = async (filterParamsModel: FilterParamsModel): Promise<Trace[]> => {
  

  const query = await filterParamsModel.getTraceQueryAsync();
  console.log('query', query);
  const data : ResultItem = await getQueryData(query, filterParamsModel.timeRange.from, filterParamsModel.timeRange.to, parseInt(filterParamsModel.options.limit || '1000'));
  const traces: Trace[] = data.traces.map((trace: any) => {
    const { startTime, endTime } = computeStartEndIso(trace.startTimeUnixNano, trace.durationMs);
    return {
      traceId: trace.traceID,
      serviceName: trace.rootServiceName,
      traceName: trace.rootTraceName,
      durationMs: Number(trace.durationMs) || 0,
      startTime,
      endTime,
      startTimeUnixNano: trace.startTimeUnixNano,
      spanCount: trace.spanSet?.matched || trace.spanSets?.[0]?.matched || 0,
      spanSet: trace.spanSet,
      spanSets: trace.spanSets,
      serviceStats: trace.serviceStats,
    };
  });

  return traces;
};