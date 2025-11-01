import { Service } from "./interface.service";
import { getQueryAggregationData } from "../provider/prometheus.provider";
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
}
export const getServicesTableData = async (filterParamsModel: FilterParamsModel): Promise<Service[]> => {
  await filterParamsModel.setLabelFiltersAsync();
  
  const definitions = await getDefinitions();
  const serviceQueryDataCallsByService = await getServicesQueryDataByType(QueryType.CALLS_BY_SERVICE, filterParamsModel, definitions);
  const serviceQueryDataAvgLatencyByService = await getServicesQueryDataByType(QueryType.AVG_LATENCY_BY_SERVICE, filterParamsModel, definitions);
  const serviceQueryDataMinLatencyByService = await getServicesQueryDataByType(QueryType.MIN_LATENCY_BY_SERVICE, filterParamsModel, definitions);
  const serviceQueryDataMaxLatencyByService = await getServicesQueryDataByType(QueryType.MAX_LATENCY_BY_SERVICE, filterParamsModel, definitions);
  const serviceQueryDataErrorPercentageByService = await getServicesQueryDataByType(QueryType.ERROR_PERCENTAGE_BY_SERVICE, filterParamsModel, definitions);
  const serviceQueryDataP50ByServiceAndSpan = await getServicesQueryDataByType(QueryType.P50_BY_SERVICE_AND_SPAN, filterParamsModel, definitions);
  const serviceQueryDataP75ByServiceAndSpan = await getServicesQueryDataByType(QueryType.P75_BY_SERVICE_AND_SPAN, filterParamsModel, definitions);
  const serviceQueryDataP90ByServiceAndSpan = await getServicesQueryDataByType(QueryType.P90_BY_SERVICE_AND_SPAN, filterParamsModel, definitions);
  const serviceQueryDataP95ByServiceAndSpan = await getServicesQueryDataByType(QueryType.P95_BY_SERVICE_AND_SPAN, filterParamsModel, definitions);
  const serviceQueryDataP99ByServiceAndSpan = await getServicesQueryDataByType(QueryType.P99_BY_SERVICE_AND_SPAN, filterParamsModel, definitions);
  const serviceQueryDataAvgDurationByServiceAndSpan = await getServicesQueryDataByType(QueryType.AVG_DURATION_BY_SERVICE_AND_SPAN, filterParamsModel, definitions);
  const serviceQueryDataErrorPercentageByServiceAndSpan = await getServicesQueryDataByType(QueryType.ERROR_PERCENTAGE_BY_SERVICE_AND_SPAN, filterParamsModel, definitions);

  const servicesWithOperations: Service[] = [];

  const serviceSpanMap = new Map<string, Set<string>>();
  [
    serviceQueryDataP50ByServiceAndSpan,
    serviceQueryDataP90ByServiceAndSpan,
    serviceQueryDataP99ByServiceAndSpan,
    serviceQueryDataAvgDurationByServiceAndSpan
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
        requestCount: 0
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
      service.status.metrics.errorPercentage = item.value;
    }
  });

  serviceQueryDataP50ByServiceAndSpan.forEach((item: ServiceQueryData) => {
    const service = serviceMap.get(item.service_name);
    if (service && service.operations) {
      const operation = service.operations.find((op: any) => op.name === item.span_name);
      if (operation) {
          operation.metrics.p50DurationMs = item.value;
          if(item.type !== undefined && operation.type !== item.type) {
            operation.type = item.type;
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
          operation.type = item.type;
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
          operation.type = item.type;
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
          operation.type = item.type;
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
          operation.type = item.type;
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
          operation.type = item.type;
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
          operation.type = item.type;
        }
      }
    }
  });

  console.log('servicesWithOperations', servicesWithOperations);
  
  return servicesWithOperations;
};

export const getServicesQueryData = async (filterParamsModel: FilterParamsModel, query: string): Promise<ServiceQueryData[]> => {
  const start = filterParamsModel.timeRange.from;
  const end = filterParamsModel.timeRange.to;
  const data = await getQueryAggregationData(query, start, end);
  const serviceQueryData: ServiceQueryData[] = data.result.map((result: ResultItem) => ({
    service_name: result.metric.service_name,
    span_name: result.metric.span_name,
    type: result.metric.type,
    value: parseFloat(result.value[1]),
  }));
  return serviceQueryData;
}

export const getServicesQueryDataByType = async (
  queryType: QueryType,
  filterParamsModel: FilterParamsModel,
  definitions: Definitions
): Promise<ServiceQueryData[]> => {
  const query = getQueryByType(queryType, filterParamsModel, definitions);
  return await getServicesQueryData(filterParamsModel, query);
}