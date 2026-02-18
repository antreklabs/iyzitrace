import { Operation, Service } from "./interface.service";
import { getQueryData, getQueryRangeData } from "../provider/prometheus.provider";
import { FilterParamsModel, QueryType, getQueryByType, getDefinitions } from "./query.service";
import { Definitions } from "../../interfaces/utils/options";

interface ResultItem {
  metric: {
    server: string;
    client: string;
    service_name: string;
    span_name?: string;
    type?: string;
    http_method?: string;
    http_url?: string;
    net_host_port?: string;
    server_operation_name?: string;
    client_operation_name?: string;
  };
  value: [number, string];
}

interface ServiceQueryData {
  service_name: string;
  span_name?: string;
  type?: string;
  http_method?: string;
  http_url?: string;
  net_host_port?: string;
  datetime?: string;
  value: number;
  values?: {
    x: Date;
    y: number;
  }[];
}

interface ServiceMapQueryData {
  server_operation_name?: string;
  client_operation_name?: string;
  server?: string;
  client?: string;
}

const setSpanAdditionalDimensions = (item: ServiceQueryData, operation: Operation, service: Service) => {
  if (item.type !== undefined && operation.type !== item.type) {
    operation.type = item.type.toUpperCase()
  }

  if (item.type !== undefined && service.type !== item.type) {
    service.type = item.type.toUpperCase();
  }

  if (item.http_method !== undefined && operation.method !== item.http_method) {
    operation.method = item.http_method.toUpperCase();
  }

  if (item.http_url !== undefined && operation.path !== item.http_url) {
    operation.path = item.http_url;
  }

  if (item.net_host_port !== undefined && service.port !== item.net_host_port) {
    service.port = item.net_host_port;
  }
}

export const getServicesTableData = async (filterParamsModel: FilterParamsModel): Promise<Service[]> => {
  await filterParamsModel.setLabelFiltersAsync();

  const definitions = await getDefinitions();

  // Fire ALL queries in parallel instead of sequentially
  const [
    serviceQueryDataCallsByService,
    serviceQueryDataAvgDurationByService,
    serviceQueryDataSumDurationByService,
    serviceQueryDataMinDurationByService,
    serviceQueryDataMaxDurationByService,
    serviceQueryDataP50ByService,
    serviceQueryDataP75ByService,
    serviceQueryDataP90ByService,
    serviceQueryDataP95ByService,
    serviceQueryDataP99ByService,
    serviceQueryDataErrorPercentageByService,
    serviceQueryDataP50ByServiceInTime,
    serviceQueryDataP75ByServiceInTime,
    serviceQueryDataP90ByServiceInTime,
    serviceQueryDataP95ByServiceInTime,
    serviceQueryDataP99ByServiceInTime,
    serviceQueryDataApdexByServiceInTime,
    serviceQueryDataCallsByServiceAndSpan,
    serviceQueryDataP50ByServiceAndSpan,
    serviceQueryDataP75ByServiceAndSpan,
    serviceQueryDataP90ByServiceAndSpan,
    serviceQueryDataP95ByServiceAndSpan,
    serviceQueryDataP99ByServiceAndSpan,
    serviceQueryDataAvgDurationByServiceAndSpan,
    serviceQueryDataMinDurationByServiceAndSpan,
    serviceQueryDataMaxDurationByServiceAndSpan,
    serviceQueryDataErrorPercentageByServiceAndSpan,
    serviceQueryDataP50ByServiceAndSpanInTime,
    serviceQueryDataP75ByServiceAndSpanInTime,
    serviceQueryDataP90ByServiceAndSpanInTime,
    serviceQueryDataP95ByServiceAndSpanInTime,
    serviceQueryDataP99ByServiceAndSpanInTime,
    serviceQueryDataApdexByServiceAndSpanInTime,
    serviceQueryDataRateByServiceAndSpanInTime,
    serviceQueryDataTopKeyOperationsByServiceAndSpanInTime,
    serviceRelation,
  ] = await Promise.all([
    getServicesQueryDataByType(QueryType.CALLS_BY_SERVICE, filterParamsModel, definitions),
    getServicesQueryDataByType(QueryType.AVG_DURATION_BY_SERVICE, filterParamsModel, definitions),
    getServicesQueryDataByType(QueryType.SUM_DURATION_BY_SERVICE, filterParamsModel, definitions),
    getServicesQueryDataByType(QueryType.MIN_DURATION_BY_SERVICE, filterParamsModel, definitions),
    getServicesQueryDataByType(QueryType.MAX_DURATION_BY_SERVICE, filterParamsModel, definitions),
    getServicesQueryDataByType(QueryType.P50_BY_SERVICE, filterParamsModel, definitions),
    getServicesQueryDataByType(QueryType.P75_BY_SERVICE, filterParamsModel, definitions),
    getServicesQueryDataByType(QueryType.P90_BY_SERVICE, filterParamsModel, definitions),
    getServicesQueryDataByType(QueryType.P95_BY_SERVICE, filterParamsModel, definitions),
    getServicesQueryDataByType(QueryType.P99_BY_SERVICE, filterParamsModel, definitions),
    getServicesQueryDataByType(QueryType.ERROR_PERCENTAGE_BY_SERVICE, filterParamsModel, definitions),
    getServicesQueryDataInTime(QueryType.P50_BY_SERVICE_INTIME, filterParamsModel, definitions),
    getServicesQueryDataInTime(QueryType.P75_BY_SERVICE_INTIME, filterParamsModel, definitions),
    getServicesQueryDataInTime(QueryType.P90_BY_SERVICE_INTIME, filterParamsModel, definitions),
    getServicesQueryDataInTime(QueryType.P95_BY_SERVICE_INTIME, filterParamsModel, definitions),
    getServicesQueryDataInTime(QueryType.P99_BY_SERVICE_INTIME, filterParamsModel, definitions),
    getServicesQueryDataInTime(QueryType.APDEX_BY_SERVICE_INTIME, filterParamsModel, definitions),
    getServicesQueryDataByType(QueryType.CALLS_BY_SERVICE_AND_SPAN, filterParamsModel, definitions),
    getServicesQueryDataByType(QueryType.P50_BY_SERVICE_AND_SPAN, filterParamsModel, definitions),
    getServicesQueryDataByType(QueryType.P75_BY_SERVICE_AND_SPAN, filterParamsModel, definitions),
    getServicesQueryDataByType(QueryType.P90_BY_SERVICE_AND_SPAN, filterParamsModel, definitions),
    getServicesQueryDataByType(QueryType.P95_BY_SERVICE_AND_SPAN, filterParamsModel, definitions),
    getServicesQueryDataByType(QueryType.P99_BY_SERVICE_AND_SPAN, filterParamsModel, definitions),
    getServicesQueryDataByType(QueryType.AVG_DURATION_BY_SERVICE_AND_SPAN, filterParamsModel, definitions),
    getServicesQueryDataByType(QueryType.MIN_DURATION_BY_SERVICE_AND_SPAN, filterParamsModel, definitions),
    getServicesQueryDataByType(QueryType.MAX_DURATION_BY_SERVICE_AND_SPAN, filterParamsModel, definitions),
    getServicesQueryDataByType(QueryType.ERROR_PERCENTAGE_BY_SERVICE_AND_SPAN, filterParamsModel, definitions),
    getServicesQueryDataInTime(QueryType.P50_BY_SERVICE_AND_SPAN_INTIME, filterParamsModel, definitions),
    getServicesQueryDataInTime(QueryType.P75_BY_SERVICE_AND_SPAN_INTIME, filterParamsModel, definitions),
    getServicesQueryDataInTime(QueryType.P90_BY_SERVICE_AND_SPAN_INTIME, filterParamsModel, definitions),
    getServicesQueryDataInTime(QueryType.P95_BY_SERVICE_AND_SPAN_INTIME, filterParamsModel, definitions),
    getServicesQueryDataInTime(QueryType.P99_BY_SERVICE_AND_SPAN_INTIME, filterParamsModel, definitions),
    getServicesQueryDataInTime(QueryType.APDEX_BY_SERVICE_AND_SPAN_INTIME, filterParamsModel, definitions),
    getServicesQueryDataInTime(QueryType.RATE_BY_SERVICE_AND_SPAN_INTIME, filterParamsModel, definitions),
    getServicesQueryDataInTime(QueryType.TOP_KEY_OPERATIONS_BY_SERVICE_AND_SPAN_INTIME, filterParamsModel, definitions),
    getServiceMapQueryDataByServiceSpanRelation(QueryType.SERVICE_RELATION, filterParamsModel, definitions),
  ]);
  let servicesWithOperations: Service[] = [];

  const serviceSpanMap = new Map<string, Set<string>>();
  [
    serviceQueryDataP50ByServiceAndSpan,
    serviceQueryDataP75ByServiceAndSpan,
    serviceQueryDataP90ByServiceAndSpan,
    serviceQueryDataP95ByServiceAndSpan,
    serviceQueryDataP99ByServiceAndSpan,
    serviceQueryDataCallsByServiceAndSpan,
    serviceQueryDataAvgDurationByServiceAndSpan,
    serviceQueryDataMinDurationByServiceAndSpan,
    serviceQueryDataMaxDurationByServiceAndSpan,
    serviceQueryDataErrorPercentageByServiceAndSpan,
    serviceQueryDataP50ByServiceAndSpanInTime,
    serviceQueryDataP75ByServiceAndSpanInTime,
    serviceQueryDataP90ByServiceAndSpanInTime,
    serviceQueryDataP95ByServiceAndSpanInTime,
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
      metrics: {
        avgDurationMs: 0,
        minDurationMs: 0,
        maxDurationMs: 0,
        p50DurationMs: 0,
        p75DurationMs: 0,
        p90DurationMs: 0,
        p95DurationMs: 0,
        p99DurationMs: 0,
        callsCount: 0,
      },
      status: {
        value: 'healthy',
        metrics: {
          errorCount: 0,
          errorPercentage: 0,
          warningCount: 0,
          warningPercentage: 0,
          degradedCount: 0,
          degradedPercentage: 0,
          totalCount: 0,
        },
      },
    }));

    servicesWithOperations.push({
      id: serviceName,
      name: serviceName,
      operations: operations as Operation[],
      targetServiceIds: [],
      metrics: {
        sumDurationMs: 0,
        avgDurationMs: 0,
        minDurationMs: 0,
        maxDurationMs: 0,
        p50DurationMs: 0,
        p75DurationMs: 0,
        p90DurationMs: 0,
        p95DurationMs: 0,
        p99DurationMs: 0,
        callsCount: 0,
        callsPerSecond: 0,
        operationCounts: operations.length,
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
        value: 'healthy',
        metrics: {
          errorCount: 0,
          errorPercentage: 0,
          warningCount: 0,
          warningPercentage: 0,
          degradedCount: 0,
          degradedPercentage: 0,
          totalCount: 0,
        },
      },
    });

    return servicesWithOperations;
  });

  const serviceMap = new Map<string, Service>();
  servicesWithOperations.forEach(service => {
    serviceMap.set(service.id, service);
  });

  serviceRelation.forEach((item: ServiceMapQueryData) => {
    const service = serviceMap.get(item.client);
    const targetService = serviceMap.get(item.server);
    if (service && targetService && !service.targetServiceIds.includes(targetService.id)) {
      service.targetServiceIds.push(targetService.id);
    }
  });

  serviceQueryDataSumDurationByService.forEach((item: ServiceQueryData) => {
    const service = serviceMap.get(item.service_name);
    if (service) {
      service.metrics.sumDurationMs = item.value;
    }
  });

  serviceQueryDataAvgDurationByService.forEach((item: ServiceQueryData) => {
    const service = serviceMap.get(item.service_name);
    if (service) {
      service.metrics.avgDurationMs = item.value;
    }
  });

  serviceQueryDataMinDurationByService.forEach((item: ServiceQueryData) => {
    const service = serviceMap.get(item.service_name);
    if (service) {
      service.metrics.minDurationMs = item.value;
    }
  });

  serviceQueryDataMaxDurationByService.forEach((item: ServiceQueryData) => {
    const service = serviceMap.get(item.service_name);
    if (service) {
      service.metrics.maxDurationMs = item.value;
    }
  });

  serviceQueryDataP50ByService.forEach((item: ServiceQueryData) => {
    const service = serviceMap.get(item.service_name);
    if (service) {
      service.metrics.p50DurationMs = item.value;
    }
  });

  serviceQueryDataP75ByService.forEach((item: ServiceQueryData) => {
    const service = serviceMap.get(item.service_name);
    if (service) {
      service.metrics.p75DurationMs = item.value;
    }
  });

  serviceQueryDataP90ByService.forEach((item: ServiceQueryData) => {
    const service = serviceMap.get(item.service_name);
    if (service) {
      service.metrics.p90DurationMs = item.value;
    }
  });

  serviceQueryDataP95ByService.forEach((item: ServiceQueryData) => {
    const service = serviceMap.get(item.service_name);
    if (service) {
      service.metrics.p95DurationMs = item.value;
    }
  });

  serviceQueryDataP99ByService.forEach((item: ServiceQueryData) => {
    const service = serviceMap.get(item.service_name);
    if (service) {
      service.metrics.p99DurationMs = item.value;
    }
  });

  serviceQueryDataCallsByService.forEach((item: ServiceQueryData) => {
    const service = serviceMap.get(item.service_name);
    if (service) {
      service.metrics.callsCount = parseInt(item.value.toString());
      service.metrics.callsPerSecond = service.metrics.callsCount / (service.metrics.sumDurationMs / 1000)
    }
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

  serviceQueryDataP90ByServiceInTime.forEach((item: ServiceQueryData) => {
    const service = serviceMap.get(item.service_name);
    if (service) {
      service.rangeMetrics.latency.push({
        name: 'P90',
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

  serviceQueryDataRateByServiceAndSpanInTime.forEach((item: ServiceQueryData) => {
    const service = serviceMap.get(item.service_name);
    if (service && service.operations) {
      const operation = service.operations.find((op: any) => op.name === item.span_name);
      if (operation) {
        service.rangeMetrics.rateByOperation.push({
          name: operation.name,
          data: item.values ?? [],
        });
        setSpanAdditionalDimensions(item, operation, service);
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
        setSpanAdditionalDimensions(item, operation, service);
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
        setSpanAdditionalDimensions(item, operation, service);
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
        setSpanAdditionalDimensions(item, operation, service);
      }
    }
  });

  serviceQueryDataP75ByServiceAndSpanInTime.forEach((item: ServiceQueryData) => {
    const service = serviceMap.get(item.service_name);
    if (service && service.operations) {
      const operation = service.operations.find((op: any) => op.name === item.span_name);
      if (operation) {
        service.rangeMetrics.latencyByOperation.push({
          name: `${operation.name} P75`,
          data: item.values ?? [],
        });
        setSpanAdditionalDimensions(item, operation, service);
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
        setSpanAdditionalDimensions(item, operation, service);
      }
    }
  });

  serviceQueryDataP95ByServiceAndSpanInTime.forEach((item: ServiceQueryData) => {
    const service = serviceMap.get(item.service_name);
    if (service && service.operations) {
      const operation = service.operations.find((op: any) => op.name === item.span_name);
      if (operation) {
        service.rangeMetrics.latencyByOperation.push({
          name: `${operation.name} P95`,
          data: item.values ?? [],
        });
        setSpanAdditionalDimensions(item, operation, service);
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
        setSpanAdditionalDimensions(item, operation, service);
      }
    }
  });

  serviceQueryDataErrorPercentageByService.forEach((item: ServiceQueryData) => {
    const service = serviceMap.get(item.service_name);
    if (service) {
      service.status.metrics.errorCount = parseInt(item.value.toString())
      service.status.metrics.totalCount = service.metrics.callsCount
      service.status.metrics.errorPercentage = (service.status.metrics.errorCount / service.status.metrics.totalCount) * 100;
      service.status.value = service.status.metrics.errorPercentage > 0 ? 'error' : 'healthy';
    }
  });

  serviceQueryDataAvgDurationByServiceAndSpan.forEach((item: ServiceQueryData) => {
    const service = serviceMap.get(item.service_name);
    if (service && service.operations) {
      const operation = service.operations.find((op: any) => op.name === item.span_name);
      if (operation) {
        operation.metrics.avgDurationMs = item.value;
        setSpanAdditionalDimensions(item, operation, service);
      }
    }
  });

  serviceQueryDataMinDurationByServiceAndSpan.forEach((item: ServiceQueryData) => {
    const service = serviceMap.get(item.service_name);
    if (service && service.operations) {
      const operation = service.operations.find((op: any) => op.name === item.span_name);
      if (operation) {
        operation.metrics.minDurationMs = item.value;
        setSpanAdditionalDimensions(item, operation, service);
      }
    }
  });

  serviceQueryDataMaxDurationByServiceAndSpan.forEach((item: ServiceQueryData) => {
    const service = serviceMap.get(item.service_name);
    if (service && service.operations) {
      const operation = service.operations.find((op: any) => op.name === item.span_name);
      if (operation) {
        operation.metrics.maxDurationMs = item.value;
        setSpanAdditionalDimensions(item, operation, service);
      }
    }
  });

  serviceQueryDataP50ByServiceAndSpan.forEach((item: ServiceQueryData) => {
    const service = serviceMap.get(item.service_name);
    if (service && service.operations) {
      const operation = service.operations.find((op: any) => op.name === item.span_name);
      if (operation) {
        operation.metrics.p50DurationMs = item.value;
        setSpanAdditionalDimensions(item, operation, service);
      }
    }
  });

  serviceQueryDataP75ByServiceAndSpan.forEach((item: ServiceQueryData) => {
    const service = serviceMap.get(item.service_name);
    if (service && service.operations) {
      const operation = service.operations.find((op: any) => op.name === item.span_name);
      if (operation) {
        operation.metrics.p75DurationMs = item.value;
        setSpanAdditionalDimensions(item, operation, service);
      }
    }
  });

  serviceQueryDataP90ByServiceAndSpan.forEach((item: ServiceQueryData) => {
    const service = serviceMap.get(item.service_name);
    if (service && service.operations) {
      const operation = service.operations.find((op: any) => op.name === item.span_name);
      if (operation) {
        operation.metrics.p90DurationMs = item.value;
        setSpanAdditionalDimensions(item, operation, service);
      }
    }
  });

  serviceQueryDataP95ByServiceAndSpan.forEach((item: ServiceQueryData) => {
    const service = serviceMap.get(item.service_name);
    if (service && service.operations) {
      const operation = service.operations.find((op: any) => op.name === item.span_name);
      if (operation) {
        operation.metrics.p95DurationMs = item.value;
        setSpanAdditionalDimensions(item, operation, service);
      }
    }
  });

  serviceQueryDataP99ByServiceAndSpan.forEach((item: ServiceQueryData) => {
    const service = serviceMap.get(item.service_name);
    if (service && service.operations) {
      const operation = service.operations.find((op: any) => op.name === item.span_name);
      if (operation) {
        operation.metrics.p99DurationMs = item.value;
        setSpanAdditionalDimensions(item, operation, service);
      }
    }
  });

  serviceQueryDataCallsByServiceAndSpan.forEach((item: ServiceQueryData) => {
    const service = serviceMap.get(item.service_name);
    if (service && service.operations) {
      const operation = service.operations.find((op: any) => op.name === item.span_name);
      if (operation) {
        operation.metrics.callsCount = item.value;
        setSpanAdditionalDimensions(item, operation, service);
      }
    }
  });

  serviceQueryDataErrorPercentageByServiceAndSpan.forEach((item: ServiceQueryData) => {
    const service = serviceMap.get(item.service_name);
    if (service && service.operations) {
      const operation = service.operations.find((op: any) => op.name === item.span_name);
      if (operation) {
        operation.status.metrics.errorCount = parseInt(item.value.toString())
        operation.status.metrics.totalCount = operation.metrics.callsCount
        operation.status.metrics.errorPercentage = (operation.status.metrics.errorCount / operation.status.metrics.totalCount) * 100;
        operation.status.value = operation.status.metrics.errorPercentage > 0 ? 'error' : 'healthy';
        setSpanAdditionalDimensions(item, operation, service);
      }
    }
  });

  servicesWithOperations.forEach((service: Service) => {
    if (service.type === undefined) {
      service.type = 'GENERAL';
    }
    if (service.port === undefined) {
      service.port = 'N/A';
    }
    service.operations.forEach((operation: Operation) => {
      if (operation.type === undefined) {
        operation.type = 'GENERAL';
      }
      if (operation.method === undefined) {
        operation.method = 'N/A';
      }
      if (operation.path === undefined) {
        operation.path = 'N/A';
      }
    });
  });

  return servicesWithOperations;
};

export const getServiceMapQueryData = async (filterParamsModel: FilterParamsModel, query: string): Promise<ServiceMapQueryData[]> => {
  const data = await getQueryData(query);
  const serviceMapQueryData: ServiceMapQueryData[] = data.result.map((result: ResultItem) => ({
    server: result.metric.server,
    client: result.metric.client,
    server_operation_name: result.metric.server_operation_name,
    client_operation_name: result.metric.client_operation_name,
  }));
  return serviceMapQueryData;
}

export const getServicesQueryData = async (filterParamsModel: FilterParamsModel, query: string): Promise<ServiceQueryData[]> => {
  const data = await getQueryData(query);
  const serviceQueryData: ServiceQueryData[] = data.result.map((result: ResultItem) => ({
    service_name: result.metric.service_name,
    span_name: result.metric.span_name,
    type: result.metric.type,
    http_method: result.metric.http_method,
    http_url: result.metric.http_url,
    net_host_port: result.metric.net_host_port,
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
  const query = getQueryByType(queryType, filterParamsModel, definitions);
  const data = await getQueryRangeData(query, start, end, stepString);

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

export const getServiceMapQueryDataByServiceSpanRelation = async (
  queryType: QueryType,
  filterParamsModel: FilterParamsModel,
  definitions: Definitions
): Promise<ServiceMapQueryData[]> => {
  const query = getQueryByType(queryType, filterParamsModel, definitions);
  return await getServiceMapQueryData(filterParamsModel, query);
}

export const getOperationTypeColor = (type: string) => {
  switch (type) {
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

/**
 * Lightweight version for overview cards.
 * Only fetches 5 queries instead of 40: calls, avg duration, sum duration, error%, and span-level calls.
 * Returns the same Service[] shape but with only the fields needed for cards.
 */
export const getServicesOverviewData = async (filterParamsModel: FilterParamsModel): Promise<Service[]> => {
  await filterParamsModel.setLabelFiltersAsync();
  const definitions = await getDefinitions();

  const [
    callsByService,
    avgDurationByService,
    sumDurationByService,
    errorPercentageByService,
    callsByServiceAndSpan,
    serviceRelation,
  ] = await Promise.all([
    getServicesQueryDataByType(QueryType.CALLS_BY_SERVICE, filterParamsModel, definitions),
    getServicesQueryDataByType(QueryType.AVG_DURATION_BY_SERVICE, filterParamsModel, definitions),
    getServicesQueryDataByType(QueryType.SUM_DURATION_BY_SERVICE, filterParamsModel, definitions),
    getServicesQueryDataByType(QueryType.ERROR_PERCENTAGE_BY_SERVICE, filterParamsModel, definitions),
    getServicesQueryDataByType(QueryType.CALLS_BY_SERVICE_AND_SPAN, filterParamsModel, definitions),
    getServiceMapQueryDataByServiceSpanRelation(QueryType.SERVICE_RELATION, filterParamsModel, definitions),
  ]);

  // Build service → span names map from span-level calls
  const serviceSpanMap = new Map<string, Set<string>>();
  callsByServiceAndSpan.forEach((item: ServiceQueryData) => {
    if (!serviceSpanMap.has(item.service_name)) {
      serviceSpanMap.set(item.service_name, new Set());
    }
    serviceSpanMap.get(item.service_name)!.add(item.span_name);
  });

  const servicesWithOperations: Service[] = [];

  serviceSpanMap.forEach((spanNames, serviceName) => {
    const operations = Array.from(spanNames).map(spanName => ({
      id: `${serviceName}-${spanName}`,
      serviceId: serviceName,
      name: spanName,
      metrics: { avgDurationMs: 0, minDurationMs: 0, maxDurationMs: 0, p50DurationMs: 0, p75DurationMs: 0, p90DurationMs: 0, p95DurationMs: 0, p99DurationMs: 0, callsCount: 0 },
      status: { value: 'healthy', metrics: { errorCount: 0, errorPercentage: 0, warningCount: 0, warningPercentage: 0, degradedCount: 0, degradedPercentage: 0, totalCount: 0 } },
    }));

    servicesWithOperations.push({
      id: serviceName,
      name: serviceName,
      operations: operations as Operation[],
      targetServiceIds: [],
      metrics: { sumDurationMs: 0, avgDurationMs: 0, minDurationMs: 0, maxDurationMs: 0, p50DurationMs: 0, p75DurationMs: 0, p90DurationMs: 0, p95DurationMs: 0, p99DurationMs: 0, callsCount: 0, callsPerSecond: 0, operationCounts: operations.length },
      rangeMetrics: { latency: [], apdex: [], rateByOperation: [], keyopsByOperation: [], apdexByOperation: [], latencyByOperation: [] },
      status: { value: 'healthy', metrics: { errorCount: 0, errorPercentage: 0, warningCount: 0, warningPercentage: 0, degradedCount: 0, degradedPercentage: 0, totalCount: 0 } },
    });
  });

  const serviceMap = new Map<string, Service>();
  servicesWithOperations.forEach(s => serviceMap.set(s.id, s));

  // Populate essential metrics
  serviceRelation.forEach((item: ServiceMapQueryData) => {
    const service = serviceMap.get(item.client);
    const target = serviceMap.get(item.server);
    if (service && target && !service.targetServiceIds.includes(target.id)) {
      service.targetServiceIds.push(target.id);
    }
  });

  sumDurationByService.forEach((item: ServiceQueryData) => {
    const service = serviceMap.get(item.service_name);
    if (service) service.metrics.sumDurationMs = item.value;
  });

  avgDurationByService.forEach((item: ServiceQueryData) => {
    const service = serviceMap.get(item.service_name);
    if (service) service.metrics.avgDurationMs = item.value;
  });

  callsByService.forEach((item: ServiceQueryData) => {
    const service = serviceMap.get(item.service_name);
    if (service) {
      service.metrics.callsCount = parseInt(item.value.toString());
      service.metrics.callsPerSecond = service.metrics.callsCount / (service.metrics.sumDurationMs / 1000);
    }
  });

  errorPercentageByService.forEach((item: ServiceQueryData) => {
    const service = serviceMap.get(item.service_name);
    if (service) {
      service.status.metrics.errorCount = parseInt(item.value.toString());
      service.status.metrics.totalCount = service.metrics.callsCount;
      service.status.metrics.errorPercentage = (service.status.metrics.errorCount / service.status.metrics.totalCount) * 100;
      service.status.value = service.status.metrics.errorPercentage > 0 ? 'error' : 'healthy';
    }
  });

  // Set type from span-level data
  callsByServiceAndSpan.forEach((item: ServiceQueryData) => {
    const service = serviceMap.get(item.service_name);
    if (service && item.type) {
      service.type = item.type.toUpperCase();
      if (item.span_name) {
        const ops = (service.operations || []) as Operation[];
        const op = ops.find(o => o.name === item.span_name);
        if (op) op.type = item.type.toUpperCase();
      }
    }
  });

  servicesWithOperations.forEach((service: Service) => {
    if (service.type === undefined) service.type = 'GENERAL';
    if (service.port === undefined) service.port = 'N/A';
    service.operations.forEach((op: Operation) => {
      if (op.type === undefined) op.type = 'GENERAL';
      if (op.method === undefined) op.method = 'N/A';
      if (op.path === undefined) op.path = 'N/A';
    });
  });

  return servicesWithOperations;
};