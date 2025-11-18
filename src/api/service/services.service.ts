import { Service } from "./interface.service";
import { getQueryData, getQueryRangeData } from "../provider/prometheus.provider";
import { FilterParamsModel, QueryType, getQueryByType, getDefinitions } from "./query.service";
import { Definitions } from "../../interfaces/options";

interface ResultItem {
  metric: {
    service_name: string;
    span_name?: string;
    type?: string;
  };
  value: [number, string];
}

interface ServiceQueryData {
  service_name: string;
  span_name?: string;
  type?: string;
  datetime?: string;
  value: number;
  values?: {
    x: Date;
    y: number;
  }[];
}

export const getServicesTableData = async (filterParamsModel: FilterParamsModel): Promise<Service[]> => {
  await filterParamsModel.setLabelFiltersAsync();
  
  const definitions = await getDefinitions();
  const serviceQueryDataCallsByService = await getServicesQueryDataByType(QueryType.CALLS_BY_SERVICE, filterParamsModel, definitions);
  const serviceQueryDataAvgLatencyByService = await getServicesQueryDataByType(QueryType.AVG_LATENCY_BY_SERVICE, filterParamsModel, definitions);
  const serviceQueryDataMinLatencyByService = await getServicesQueryDataByType(QueryType.MIN_LATENCY_BY_SERVICE, filterParamsModel, definitions);
  const serviceQueryDataMaxLatencyByService = await getServicesQueryDataByType(QueryType.MAX_LATENCY_BY_SERVICE, filterParamsModel, definitions);
  const serviceQueryDataErrorPercentageByService = await getServicesQueryDataByType(QueryType.ERROR_PERCENTAGE_BY_SERVICE, filterParamsModel, definitions);
  const serviceQueryDataP50ByServiceInTime = await getServicesQueryDataInTime(QueryType.P50_BY_SERVICE_INTIME, filterParamsModel, definitions);
  const serviceQueryDataP75ByServiceInTime = await getServicesQueryDataInTime(QueryType.P75_BY_SERVICE_INTIME, filterParamsModel, definitions);
  const serviceQueryDataP90ByServiceInTime = await getServicesQueryDataInTime(QueryType.P90_BY_SERVICE_INTIME, filterParamsModel, definitions);
  const serviceQueryDataP95ByServiceInTime = await getServicesQueryDataInTime(QueryType.P95_BY_SERVICE_INTIME, filterParamsModel, definitions);
  const serviceQueryDataP99ByServiceInTime = await getServicesQueryDataInTime(QueryType.P99_BY_SERVICE_INTIME, filterParamsModel, definitions);
  const serviceQueryDataApdexByServiceInTime = await getServicesQueryDataInTime(QueryType.APDEX_BY_SERVICE_INTIME, filterParamsModel, definitions);
  const serviceQueryDataP50ByServiceAndSpan = await getServicesQueryDataByType(QueryType.P50_BY_SERVICE_AND_SPAN, filterParamsModel, definitions);
  const serviceQueryDataP75ByServiceAndSpan = await getServicesQueryDataByType(QueryType.P75_BY_SERVICE_AND_SPAN, filterParamsModel, definitions);
  const serviceQueryDataP90ByServiceAndSpan = await getServicesQueryDataByType(QueryType.P90_BY_SERVICE_AND_SPAN, filterParamsModel, definitions);
  const serviceQueryDataP95ByServiceAndSpan = await getServicesQueryDataByType(QueryType.P95_BY_SERVICE_AND_SPAN, filterParamsModel, definitions);
  const serviceQueryDataP99ByServiceAndSpan = await getServicesQueryDataByType(QueryType.P99_BY_SERVICE_AND_SPAN, filterParamsModel, definitions);
  const serviceQueryDataAvgDurationByServiceAndSpan = await getServicesQueryDataByType(QueryType.AVG_DURATION_BY_SERVICE_AND_SPAN, filterParamsModel, definitions);
  const serviceQueryDataAvgLatencyByServiceAndSpan = await getServicesQueryDataByType(QueryType.AVG_LATENCY_BY_SERVICE_AND_SPAN, filterParamsModel, definitions);
  const serviceQueryDataMinLatencyByServiceAndSpan = await getServicesQueryDataByType(QueryType.MIN_LATENCY_BY_SERVICE_AND_SPAN, filterParamsModel, definitions);
  const serviceQueryDataMaxLatencyByServiceAndSpan = await getServicesQueryDataByType(QueryType.MAX_LATENCY_BY_SERVICE_AND_SPAN, filterParamsModel, definitions);
  const serviceQueryDataErrorPercentageByServiceAndSpan = await getServicesQueryDataByType(QueryType.ERROR_PERCENTAGE_BY_SERVICE_AND_SPAN, filterParamsModel, definitions);
  const serviceQueryDataP50ByServiceAndSpanInTime = await getServicesQueryDataInTime(QueryType.P50_BY_SERVICE_AND_SPAN_INTIME, filterParamsModel, definitions);
  const serviceQueryDataP90ByServiceAndSpanInTime = await getServicesQueryDataInTime(QueryType.P90_BY_SERVICE_AND_SPAN_INTIME, filterParamsModel, definitions);
  const serviceQueryDataP99ByServiceAndSpanInTime = await getServicesQueryDataInTime(QueryType.P99_BY_SERVICE_AND_SPAN_INTIME, filterParamsModel, definitions);
  const serviceQueryDataApdexByServiceAndSpanInTime = await getServicesQueryDataInTime(QueryType.APDEX_BY_SERVICE_AND_SPAN_INTIME, filterParamsModel, definitions);
  const serviceQueryDataRateByServiceAndSpanInTime = await getServicesQueryDataInTime(QueryType.RATE_BY_SERVICE_AND_SPAN_INTIME, filterParamsModel, definitions);
  const serviceQueryDataTopKeyOperationsByServiceAndSpanInTime = await getServicesQueryDataInTime(QueryType.TOP_KEY_OPERATIONS_BY_SERVICE_AND_SPAN_INTIME, filterParamsModel, definitions);
  console.log('serviceQueryDataTopKeyOperationsByServiceAndSpanInTime', serviceQueryDataTopKeyOperationsByServiceAndSpanInTime);
  const servicesWithOperations: Service[] = [];

  const serviceSpanMap = new Map<string, Set<string>>();
  [
    serviceQueryDataP50ByServiceAndSpan,
    serviceQueryDataP75ByServiceAndSpan,
    serviceQueryDataP90ByServiceAndSpan,
    serviceQueryDataP95ByServiceAndSpan,
    serviceQueryDataP99ByServiceAndSpan,
    serviceQueryDataAvgDurationByServiceAndSpan,
    serviceQueryDataAvgLatencyByServiceAndSpan,
    serviceQueryDataMinLatencyByServiceAndSpan,
    serviceQueryDataMaxLatencyByServiceAndSpan,
    serviceQueryDataErrorPercentageByServiceAndSpan,
    serviceQueryDataP50ByServiceAndSpanInTime,
    serviceQueryDataP90ByServiceAndSpanInTime,
    serviceQueryDataP99ByServiceAndSpanInTime,
    serviceQueryDataApdexByServiceAndSpanInTime,
    serviceQueryDataRateByServiceAndSpanInTime,
    serviceQueryDataTopKeyOperationsByServiceAndSpanInTime,
  ].forEach(queryData => {
    queryData.forEach((item: ServiceQueryData) => {
      if (!serviceSpanMap.has(item.service_name)) {
        serviceSpanMap.set(item.service_name, new Set());
      }
      serviceSpanMap.get(item.service_name)!.add(item.span_name);
    });
  });

  serviceSpanMap.forEach((spanNames, serviceName) => {
    const operations = Array.from(spanNames).map(spanName => ({
      id: `${serviceName}-${spanName}`,
      serviceId: serviceName,
      name: spanName,
      type: 'HTTP',
      metrics: {
        p50DurationMs: 0,
        p90DurationMs: 0,
        p99DurationMs: 0,
        avgDurationMs: 0
      },
      status: {
        metrics: {
          errorPercentage: 0
        },
      }
    }));

    servicesWithOperations.push({
      id: serviceName,
      name: serviceName,
      metrics: {
        avgLatencyMs: 0,
        minLatencyMs: 0,
        maxLatencyMs: 0,
        requestCount: 0,
        operationCounts: operations.length
      },
      rangeMetrics: {
        latency: [],
        apdex: [],
        rateByOperation: [],
        keyopsByOperation: [],
        apdexByOperation: [],
        latencyByOperation: [],
      },
      status: {
        metrics: {
          errorPercentage: 0
        },
      },
      operations: operations
    } as Service);
  });

  const serviceMap = new Map<string, Service>();
  servicesWithOperations.forEach(service => {
    serviceMap.set(service.id, service);
  });

  serviceQueryDataP50ByServiceInTime.forEach((item: ServiceQueryData) => {
    const service = serviceMap.get(item.service_name);
    if (service) {
      service.rangeMetrics.latency.push({
        name: 'P50',
        data: item.values ?? [],
      });
    }
  });
  serviceQueryDataP75ByServiceInTime.forEach((item: ServiceQueryData) => {
    const service = serviceMap.get(item.service_name);
    if (service) {
      service.rangeMetrics.latency.push({
        name: 'P75',
        data: item.values ?? [],
      });
    }
  });
  serviceQueryDataP95ByServiceInTime.forEach((item: ServiceQueryData) => {
    const service = serviceMap.get(item.service_name);
    if (service) {
      service.rangeMetrics.latency.push({
        name: 'P95',
        data: item.values ?? [],
      });
    }
  });

  serviceQueryDataP90ByServiceInTime.forEach((item: ServiceQueryData) => {
    const service = serviceMap.get(item.service_name);
    if (service) {
      service.rangeMetrics.latency.push({
        name: 'P90',
        data: item.values ?? [],
      });
    }
  });

  serviceQueryDataP99ByServiceInTime.forEach((item: ServiceQueryData) => {
    const service = serviceMap.get(item.service_name);
    if (service) {
      service.rangeMetrics.latency.push({
        name: 'P99',
        data: item.values ?? [],
      });
    }
  });

  serviceQueryDataApdexByServiceInTime.forEach((item: ServiceQueryData) => {
    const service = serviceMap.get(item.service_name);
    if (service) {
      service.rangeMetrics.apdex.push({
        name: 'Apdex',
        data: item.values ?? [],
      });
    }
  });


  serviceQueryDataCallsByService.forEach((item: ServiceQueryData) => {
    const service = serviceMap.get(item.service_name);
    if (service) {
      service.metrics.requestCount = parseInt(item.value.toString());
    }
  });

  serviceQueryDataAvgLatencyByService.forEach((item: ServiceQueryData) => {
    const service = serviceMap.get(item.service_name);
    if (service) {
      service.metrics.avgLatencyMs = item.value;
    }
  });

  serviceQueryDataMinLatencyByService.forEach((item: ServiceQueryData) => {
    const service = serviceMap.get(item.service_name);
    if (service) {
      service.metrics.minLatencyMs = item.value;
    }
  });

  serviceQueryDataMaxLatencyByService.forEach((item: ServiceQueryData) => {
    const service = serviceMap.get(item.service_name);
    if (service) {
      service.metrics.maxLatencyMs = item.value;
    }
  });

  serviceQueryDataErrorPercentageByService.forEach((item: ServiceQueryData) => {
    const service = serviceMap.get(item.service_name);
    if (service) {
      service.status.metrics.errorCount = parseInt(item.value.toString())
      service.status.metrics.totalCount = service.metrics.requestCount
      service.status.metrics.errorPercentage = (service.status.metrics.errorCount / service.status.metrics.totalCount) * 100;
    }
  });

  serviceQueryDataP50ByServiceAndSpan.forEach((item: ServiceQueryData) => {
    const service = serviceMap.get(item.service_name);
    if (service && service.operations) {
      const operation = service.operations.find((op: any) => op.name === item.span_name);
      if (operation) {
          operation.metrics.p50DurationMs = item.value;
          if(item.type !== undefined && operation.type !== item.type) {
            operation.type = item.type.toUpperCase();
          }
      }
    }
  });

  serviceQueryDataP75ByServiceAndSpan.forEach((item: ServiceQueryData) => {
    const service = serviceMap.get(item.service_name);
    if (service && service.operations) {
      const operation = service.operations.find((op: any) => op.name === item.span_name);
      if (operation) {
        operation.metrics.p75DurationMs = item.value;
        if(item.type !== undefined && operation.type !== item.type) {
          operation.type = item.type.toUpperCase()
        }
      }
    }
  });

  serviceQueryDataP90ByServiceAndSpan.forEach((item: ServiceQueryData) => {
    const service = serviceMap.get(item.service_name);
    if (service && service.operations) {
      const operation = service.operations.find((op: any) => op.name === item.span_name);
      if (operation) {
        operation.metrics.p90DurationMs = item.value;
        if(item.type !== undefined && operation.type !== item.type) {
          operation.type = item.type.toUpperCase()
        }
      }
    }
  });

  serviceQueryDataP95ByServiceAndSpan.forEach((item: ServiceQueryData) => {
    const service = serviceMap.get(item.service_name);
    if (service && service.operations) {
      const operation = service.operations.find((op: any) => op.name === item.span_name);
      if (operation) {
        operation.metrics.p95DurationMs = item.value;
        if(item.type !== undefined && operation.type !== item.type) {
          operation.type = item.type.toUpperCase()
        }
      }
    }
  });

  serviceQueryDataP99ByServiceAndSpan.forEach((item: ServiceQueryData) => {
    const service = serviceMap.get(item.service_name);
    if (service && service.operations) {
      const operation = service.operations.find((op: any) => op.name === item.span_name);
      if (operation) {
        operation.metrics.p99DurationMs = item.value;
        if(item.type !== undefined && operation.type !== item.type) {
          operation.type = item.type.toUpperCase()
        }
      }
    }
  });

  serviceQueryDataAvgDurationByServiceAndSpan.forEach((item: ServiceQueryData) => {
    const service = serviceMap.get(item.service_name);
    if (service && service.operations) {
      const operation = service.operations.find((op: any) => op.name === item.span_name);
      if (operation) {
        operation.metrics.avgDurationMs = item.value;
        if(item.type !== undefined && operation.type !== item.type) {
          operation.type = item.type.toUpperCase()
        }
      }
    }
  });

  serviceQueryDataAvgLatencyByServiceAndSpan.forEach((item: ServiceQueryData) => {
    const service = serviceMap.get(item.service_name);
    if (service && service.operations) {
      const operation = service.operations.find((op: any) => op.name === item.span_name);
      if (operation) {
        operation.metrics.avgLatencyMs = item.value;
        if(item.type !== undefined && operation.type !== item.type) {
          operation.type = item.type.toUpperCase()
        }
      }
    }
  });

  serviceQueryDataMinLatencyByServiceAndSpan.forEach((item: ServiceQueryData) => {
    const service = serviceMap.get(item.service_name);
    if (service && service.operations) {
      const operation = service.operations.find((op: any) => op.name === item.span_name);
      if (operation) {
        operation.metrics.minLatencyMs = item.value;
        if(item.type !== undefined && operation.type !== item.type) {
          operation.type = item.type.toUpperCase()
        }
      }
    }
  });

  serviceQueryDataMaxLatencyByServiceAndSpan.forEach((item: ServiceQueryData) => {
    const service = serviceMap.get(item.service_name);
    if (service && service.operations) {
      const operation = service.operations.find((op: any) => op.name === item.span_name);
      if (operation) {
        operation.metrics.maxLatencyMs = item.value;
        if(item.type !== undefined && operation.type !== item.type) {
          operation.type = item.type.toUpperCase()
        }
      }
    }
  });

  serviceQueryDataErrorPercentageByServiceAndSpan.forEach((item: ServiceQueryData) => {
    const service = serviceMap.get(item.service_name);
    if (service && service.operations) {
      const operation = service.operations.find((op: any) => op.name === item.span_name);
      if (operation) {
        operation.status.metrics.errorPercentage = item.value;
        if(item.type !== undefined && operation.type !== item.type) {
          operation.type = item.type.toUpperCase()
        }
      }
    }
  });

  serviceQueryDataRateByServiceAndSpanInTime.forEach((item: ServiceQueryData) => {
    const service = serviceMap.get(item.service_name);
    if (service && service.operations) {
      const operation = service.operations.find((op: any) => op.name === item.span_name);
      if (operation) {
        service.rangeMetrics.rateByOperation.push({
          name: operation.name,
          data: item.values ?? [],
        });
        if(item.type !== undefined && operation.type !== item.type) {
          operation.type = item.type.toUpperCase()
        }
      }
    }
  });

  serviceQueryDataTopKeyOperationsByServiceAndSpanInTime.forEach((item: ServiceQueryData) => {
    const service = serviceMap.get(item.service_name);
    if (service && service.operations) {
      const operation = service.operations.find((op: any) => op.name === item.span_name);
      if (operation) {
        service.rangeMetrics.keyopsByOperation.push({
          name: operation.name,
          data: item.values ?? [],
        });
        if(item.type !== undefined && operation.type !== item.type) {
          operation.type = item.type.toUpperCase()
        }
      }
    }
  });

  serviceQueryDataApdexByServiceAndSpanInTime.forEach((item: ServiceQueryData) => {
    const service = serviceMap.get(item.service_name);
    if (service && service.operations) {
      const operation = service.operations.find((op: any) => op.name === item.span_name);
      if (operation) {
        service.rangeMetrics.apdexByOperation.push({
          name: operation.name,
          data: item.values ?? [],
        });
        if(item.type !== undefined && operation.type !== item.type) {
          operation.type = item.type.toUpperCase()
        }
      }
    }
  });

  serviceQueryDataP50ByServiceAndSpanInTime.forEach((item: ServiceQueryData) => {
    const service = serviceMap.get(item.service_name);
    if (service && service.operations) {
      const operation = service.operations.find((op: any) => op.name === item.span_name);
      if (operation) {
        service.rangeMetrics.latencyByOperation.push({
          name: `${operation.name} P50`,
          data: item.values ?? [],
        });
        if(item.type !== undefined && operation.type !== item.type) {
          operation.type = item.type.toUpperCase()
        }
      }
    }
  });

  serviceQueryDataP90ByServiceAndSpanInTime.forEach((item: ServiceQueryData) => {
    const service = serviceMap.get(item.service_name);
    if (service && service.operations) {
      const operation = service.operations.find((op: any) => op.name === item.span_name);
      if (operation) {
        service.rangeMetrics.latencyByOperation.push({
          name: `${operation.name} P90`,
          data: item.values ?? [],
        });
        if(item.type !== undefined && operation.type !== item.type) {
          operation.type = item.type.toUpperCase()
        }
      }
    }
  });
  serviceQueryDataP99ByServiceAndSpanInTime.forEach((item: ServiceQueryData) => {
    const service = serviceMap.get(item.service_name);
    if (service && service.operations) {
      const operation = service.operations.find((op: any) => op.name === item.span_name);
      if (operation) {
        service.rangeMetrics.latencyByOperation.push({
          name: `${operation.name} P99`,
          data: item.values ?? [],
        });
        if(item.type !== undefined && operation.type !== item.type) {
          operation.type = item.type.toUpperCase()
        }
      }
    }
  });

  return servicesWithOperations;
};

export const getServicesQueryData = async (filterParamsModel: FilterParamsModel, query: string): Promise<ServiceQueryData[]> => {
  const data = await getQueryData(query);
  const serviceQueryData: ServiceQueryData[] = data.result.map((result: ResultItem) => ({
    service_name: result.metric.service_name,
    span_name: result.metric.span_name,
    type: result.metric.type,
    value: parseFloat(result.value[1]),
  }));
  return serviceQueryData;
}

export const getServicesQueryDataInTime = async (
  queryType: QueryType,
  filterParamsModel: FilterParamsModel,
  definitions: Definitions
): Promise<ServiceQueryData[]> => {
  const start = filterParamsModel.timeRange.from;
  const end = filterParamsModel.timeRange.to;
  const fixedStart = Math.floor(start / 1000);
  const fixedEnd = Math.floor(end / 1000);
  const maxPoints = 60;
  const step = Math.max(Math.ceil((fixedEnd - fixedStart) / maxPoints), 60);
  const stepString = step + 's';
  // console.log('stepString', stepString);
  const query = getQueryByType(queryType, filterParamsModel, definitions);
  // console.log('query', query);
  const data = await getQueryRangeData(query, start, end, stepString);
  // console.log('data in time', data);

  return data.result.map((result: ResultItem) => ({
    service_name: result.metric.service_name,
    span_name: result.metric.span_name,
    type: result.metric.type,
    values: mapMetric(result as any),
  }));
}

export const getServicesQueryDataByType = async (
  queryType: QueryType,
  filterParamsModel: FilterParamsModel,
  definitions: Definitions
): Promise<ServiceQueryData[]> => {
  const query = getQueryByType(queryType, filterParamsModel, definitions);
  return await getServicesQueryData(filterParamsModel, query);
}

export const getOperationTypeColor = (type: string) => {
  switch (type.toUpperCase()) {
    case 'HTTP':
      return 'blue';
    case 'DATABASE':
      return 'green';
    case 'MESSAGING':
      return 'orange';
    case 'CACHE':
      return 'purple';
    case 'RPC':
      return 'red';
    case 'DATABASE':
      return 'yellow';
    case 'GENERAL':
      return 'gray';
    default:
      return 'gray';
  }
};

const mapMetric = (result: any) =>
  (result?.values ?? []).map(([ts, val]: [number, string]) => ({
    x: new Date(ts * 1000),
    y: val !== undefined && val !== 'NaN' ? parseFloat(val) * 1000 : 0,
  }));