// Service Map Service - Infrastructure and service mapping data provider
import mapData from '../../assets/data/map.json';
import { Infrastructure, Application, Service, Operation, HealthValue } from './interface.service';
/**
 * KAN-24 Query - Get all infrastructures
 * @returns Promise<Infrastructure[]> - List of all infrastructures
 */
export const getInfrastructures = async (regionId?: string): Promise<Infrastructure[]> => {
  
  const infrastructures: Infrastructure[] = [];
  
  mapData.regions.find(r => regionId ? r.id === regionId : true)?.infrastructures.forEach(infra => {
    infrastructures.push({
      id: infra.id,
      name: infra.name,
      osVersion: infra.os,
      ip: infra.ip,
      type: infra.type,
      region: infra.region,
      cpu: {
        usage: infra.cpu.usage_pct,
        capacity: infra.cpu.cores,
        percentage: infra.cpu.usage_pct,
      },
      memory: {
        usage: infra.memory.used_gb,
        capacity: infra.memory.total_gb,
        percentage: infra.memory.used_gb / infra.memory.total_gb,
      },
      status: {
        value: infra.status as HealthValue,
        metrics: {
          errorCount: 10,
          errorPercentage: 0.1,
          warningCount: 20,
          warningPercentage: 0.2,
          degradedCount: 30,
          degradedPercentage: 0.3,
          totalCount: 100,
        },
      },
      position: infra.position,
      groupPosition: infra.groupPosition,
      groupSize: infra.groupSize,
    });
  });
  
  return infrastructures;
};

/**
 * KAN-25 Query - Get applications by infrastructure
 * @param infrastructureId - The infrastructure ID to get applications for
 * @returns Promise<Application[]> - List of applications for the infrastructure
 */
export const getApplicationsByInfrastructure = async (regionId?: string, infrastructureId?: string): Promise<Application[]> => {
  
  const applications: Application[] = [];
  
  const region = mapData.regions.find(r => (regionId ? r.id === regionId : true));
  const infra = region?.infrastructures.find(i => (infrastructureId ? i.id === infrastructureId : true));

  infra?.applications.forEach(app => {
      applications.push({
        id: app.id,
        infrastructureId: infra.id,
        name: app.name,
        version: app.version,
        imageUrl: app.imageUrl,
        status: {
          value: app.status as HealthValue,
          metrics: {
            errorCount: 10,
            errorPercentage: 0.1,
            warningCount: 20,
            warningPercentage: 0.2,
            degradedCount: 30,
            degradedPercentage: 0.3,
            totalCount: 100,
          },
        },
        position: app.position,
        groupPosition: app.groupPosition,
        groupSize: app.groupSize,
      });
  });
  
  return applications;
  
};

/**
 * KAN-26 Query - Get services by application
 * @param applicationId - The application ID to get services for
 * @returns Promise<Service[]> - List of services for the application
 */
export const getServicesByApplication = async (regionId?: string, infrastructureId?: string, applicationId?: string): Promise<Service[]> => {
  
  const services: Service[] = [];
  
  const region = mapData.regions.find(r => (regionId ? r.id === regionId : true));
  const infra = region?.infrastructures.find(i => (infrastructureId ? i.id === infrastructureId : true));
  const app = infra?.applications.find(a => (applicationId ? a.id === applicationId : true));

  app?.services.forEach(service => {
      // Convert operations from map.json format to our interface format
      const operations = service.operations?.map((op: any) => ({
        id: op.id,
        serviceId: service.id,
        name: op.name,
        type: op.type,
        method: op.method,
        path: op.path,
        sourceServiceId: service.id,
        targetServiceId: op.targetServiceId,
        metrics: {
          avgLatencyMs: op.avg_latency_ms,
          p95LatencyMs: op.p95_ms,
          p50DurationMs: op.avg_latency_ms,
          p75DurationMs: op.avg_latency_ms,
          p90DurationMs: op.avg_latency_ms,
          p95DurationMs: op.avg_latency_ms,
          p99DurationMs: op.avg_latency_ms,
          avgDurationMs: op.avg_latency_ms,
          count: 10,
        },
        status: {
          value: op.status as HealthValue,
          metrics: {
            errorCount: 10,
            errorPercentage: 0.1,
            warningCount: 20,
            warningPercentage: 0.2,
            degradedCount: 30,
            degradedPercentage: 0.3,
            totalCount: 100,
          },
        },
        position: op.position,
      })) || [];

      services.push({
        id: service.id,
        applicationId: app.id,
        name: service.name,
        port: (service as any).port || 3030,
        type: (service as any).kind || 'http',
        metrics: {
          avgLatencyMs: parseFloat(service.metrics.avg.replace(' ms', '')),
          minLatencyMs: parseFloat(service.metrics.min.replace(' ms', '')),
          maxLatencyMs: parseFloat(service.metrics.max.replace(' ms', '')),
          p50DurationMs: parseFloat(service.metrics.avg.replace(' ms', '')),
          p75DurationMs: parseFloat(service.metrics.avg.replace(' ms', '')),
          p90DurationMs: parseFloat(service.metrics.avg.replace(' ms', '')),
          p95DurationMs: parseFloat(service.metrics.avg.replace(' ms', '')),
          p99DurationMs: parseFloat(service.metrics.avg.replace(' ms', '')),
          avgDurationMs: parseFloat(service.metrics.avg.replace(' ms', '')),
          requestCount: service.metrics.count,
          callsPerSecond: parseFloat(service.metrics.avg.replace(' ms', '')),
          operationCounts: parseFloat(service.metrics.avg.replace(' ms', '')),
        },
        status: {
          value: (service as any).health as HealthValue,
          metrics: {
            errorCount: 10,
            errorPercentage: 0.1,
            warningCount: 20,
            warningPercentage: 0.2,
            degradedCount: 30,
            degradedPercentage: 0.3,
            totalCount: 100,
          },
        },
        position: service.position,
        groupPosition: service.groupPosition,
        groupSize: service.groupSize,
        operations: operations, // Include operations directly
      });
  });
  
  return services;

};

/**
 * KAN-27 Query - Get operations by service
 * @param serviceId - The service ID to get operations for
 * @returns Promise<Operation[]> - List of operations for the service
 */
export const getOperationsByService = async (regionId?: string, infrastructureId?: string, applicationId?: string, serviceId?: string): Promise<Operation[]> => {
  
  const operations: Operation[] = [];
  
  const region = mapData.regions.find(r => (regionId ? r.id === regionId : true));
  const infra = region?.infrastructures.find(i => (infrastructureId ? i.id === infrastructureId : true));
  const app = infra?.applications.find(a => (applicationId ? a.id === applicationId : true));
  const service = app?.services.find(s => (serviceId ? s.id === serviceId : true));

  service?.operations.forEach(operation => {
      operations.push({
        id: operation.id,
        serviceId: service.id,
        name: operation.name,
        type: operation.type,
        method: operation.method,
        path: operation.path,
        sourceServiceId: serviceId,
        targetServiceId: operation.targetServiceId,
        metrics: {
          avgLatencyMs: operation.avg_latency_ms,
          p95LatencyMs: operation.p95_ms,
          p50DurationMs: operation.avg_latency_ms,
          p75DurationMs: operation.avg_latency_ms,
          p90DurationMs: operation.avg_latency_ms,
          p95DurationMs: operation.avg_latency_ms,
          p99DurationMs: operation.avg_latency_ms,
          avgDurationMs: operation.avg_latency_ms,
          count: 10,
        },
        status: {
          value: operation.status as HealthValue,
          metrics: {
            errorCount: 10,
            errorPercentage: 0.1,
            warningCount: 20,
            warningPercentage: 0.2,
            degradedCount: 30,
            degradedPercentage: 0.3,
            totalCount: 100,
          },
        },
        position: operation.position,
      });
  });
  
  return operations;

};

export const getServiceMapData = async (regionId?: string, infrastructureId?: string, applicationId?: string, serviceId?: string): Promise<Infrastructure[]> => {
  
  const infrastructures = await getInfrastructures(regionId);
  const applications = await getApplicationsByInfrastructure(regionId, infrastructureId);
  const services = await getServicesByApplication(regionId, infrastructureId, applicationId);
  const operations = await getOperationsByService(regionId, infrastructureId, applicationId, serviceId);

  infrastructures.forEach(infrastructure => {
    infrastructure.applications = applications.filter(application => application.infrastructureId === infrastructure.id);
  });
  
  applications.forEach(application => {
    application.services = services.filter(service => service.applicationId === application.id);
  });

  services.forEach(service => {
    service.operations = operations.filter(operation => operation.serviceId === service.id);
  });

  return infrastructures;

};
