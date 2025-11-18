// Service Map Service - Infrastructure and service mapping data provider
import mapData from '../../assets/data/map.json';
import { Infrastructure, Application, Service, Operation, HealthValue, Region, ServiceMapData } from './interface.service';
import { getSelectedViewData } from './view.service';
import { getQueryData } from '../provider/prometheus.provider';

// Selected view data helper moved to view.service.ts

const findItem = (selected: any, id: string, type?: string) => {
  if (!selected) return undefined;
  const items = selected.items || [];
  return items.find((it: any) => it.id === id && (!type || it.type === type));
};

export const getRegions = async (): Promise<Region[]> => {
  
  const regions: Region[] = [];
  const selected = await getSelectedViewData('service-map');
  // console.log('[getRegions] selected:', selected);
  const data = await getQueryData("inventory_process_status * on(cloud_region, host_name) group_left(host_arch, host_ip, host_mac, infrastructureType, os_description, os_type) __inv_info");

  // console.log('[getDimensions] data:', data);

  // Step 1: Group by cloud_region
  const regionMap = new Map<string, any[]>();
  
  if (data?.result && Array.isArray(data.result)) {
    data.result.forEach((item: any) => {
      const cloudRegion = item.metric?.cloud_region || 'unknown';
      if (!regionMap.has(cloudRegion)) {
        regionMap.set(cloudRegion, []);
      }
      regionMap.get(cloudRegion)!.push(item);
    });
  }

  // Step 2: For each region, group by host_name (infrastructure)
  // Step 3: For each infrastructure, group by process_executable_name (application)
  regionMap.forEach((items, cloudRegion) => {
    const regionId = `region|${cloudRegion}`.toLowerCase();
    const regionName = cloudRegion.charAt(0).toUpperCase() + cloudRegion.slice(1);
    
    // Group by host_name (infrastructure level)
    const infraMap = new Map<string, any[]>();
    items.forEach((item: any) => {
      const hostName = item.metric?.host_name || 'unknown';
      if (!infraMap.has(hostName)) {
        infraMap.set(hostName, []);
      }
      infraMap.get(hostName)!.push(item);
    });

    const infrastructures: Infrastructure[] = [];
    
    infraMap.forEach((infraItems, hostName) => {
      const infraId = `infra|${regionName}|${hostName}`.toLowerCase();
      
      // Get first item for infrastructure metadata (all items in same infra have same host info)
      const firstItem = infraItems[0];
      const metric = firstItem.metric || {};
      
      // Parse host_ip (it comes as JSON string)
      let hostIp = '';
      try {
        const ipArray = JSON.parse(metric.host_ip || '[]');
        hostIp = Array.isArray(ipArray) && ipArray.length > 0 ? ipArray[0] : metric.host_ip || '';
      } catch {
        hostIp = metric.host_ip || '';
      }

      // Group by process_executable_name (application level)
      // Each unique process_executable_name becomes one application
      const appMap = new Map<string, any[]>();
      infraItems.forEach((item: any) => {
        const processName = item.metric?.process_executable_name || 'unknown';
        
        if (!appMap.has(processName)) {
          appMap.set(processName, []);
        }
        appMap.get(processName)!.push(item);
      });

      const applications: Application[] = [];
      
      appMap.forEach((appItems, processName) => {
        const firstAppItem = appItems[0];
        const appMetric = firstAppItem.metric || {};
        const processPid = appMetric.process_pid;
        
        // Create app ID using only process_executable_name
        const appId = `app|${regionName}|${hostName}|${processName}`.toLowerCase();
        
        const selApp = findItem(selected, appId, 'application');
        
        applications.push({
          id: appId,
          infrastructureId: infraId,
          name: processName,
          platform: processName, // platform = name (process_executable_name)
          version: processPid || 'unknown',
          status: {
            value: 'healthy',
          },
          position: selApp?.position ?? { x: 0, y: 0 },
          groupPosition: selApp?.groupPosition ?? { x: 0, y: 0 },
          groupSize: selApp?.groupSize ?? { width: 100, height: 100 },
        });
      });

      const selInfra = findItem(selected, infraId, 'infrastructure');
      
      infrastructures.push({
        id: infraId,
        regionId: regionId,
        name: hostName || hostIp,
        osVersion: metric.host_arch || 'unknown', // osVersion -> host_arch
        ip: hostIp, // ip -> host_ip (parsed)
        type: metric.os_type || 'unknown', // type -> os_type
        status: {
          value: 'healthy',
          metrics: {
            errorPercentage: 10,
          },
        },
        position: selInfra?.position ?? { x: 0, y: 0 },
        groupPosition: selInfra?.groupPosition ?? { x: 0, y: 0 },
        groupSize: selInfra?.groupSize ?? { width: 100, height: 100 },
        applications: applications,
      });
    });

    const selRegion = findItem(selected, regionId, 'region');
    regions.push({
      id: regionId,
      name: regionName,
      position: selRegion?.position ?? { x: 0, y: 0 },
      groupPosition: selRegion?.groupPosition ?? { x: 0, y: 0 },
      groupSize: selRegion?.groupSize ?? { width: 200, height: 200 },
      infrastructures: infrastructures,
    });
  });
  
  return regions;
};

/**
 * KAN-24 Query - Get all infrastructures
 * @returns Promise<Infrastructure[]> - List of all infrastructures
 */
export const getInfrastructures = async (regionId?: string): Promise<Infrastructure[]> => {
  const infrastructures: Infrastructure[] = [];
  const selected = await getSelectedViewData('service-map');

  // const infrastructuresFromPrometheus = await getPrometheusInfrastructures();

  const regions = regionId
    ? mapData.regions.filter(r => r.id === regionId)
    : mapData.regions;

  regions.forEach(region => {
    (region.infrastructures || []).forEach(infra => {
      const selInfra = findItem(selected, infra.id, 'infrastructure');
      infrastructures.push({
        id: infra.id,
        regionId: region.id,
        name: infra.name,
        osVersion: infra.os,
        ip: infra.ip,
        type: infra.type,
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
        position: selInfra?.position ?? infra.position,
        groupPosition: selInfra?.groupPosition ?? infra.groupPosition,
        groupSize: selInfra?.groupSize ?? infra.groupSize,
      });
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
  const selected = await getSelectedViewData('service-map');
  
  const regions = regionId
    ? mapData.regions.filter(r => r.id === regionId)
    : mapData.regions;

  const infrastructures = infrastructureId
    ? regions.flatMap(r => r.infrastructures.filter(i => i.id === infrastructureId))
    : regions.flatMap(r => r.infrastructures);

  infrastructures.forEach(infra => {
    infra.applications.forEach(app => {
      const selApp = findItem(selected, app.id, 'application');
      applications.push({
        id: app.id,
        infrastructureId: infra.id,
        name: app.name,
        platform: app.platform,
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
        position: selApp?.position ?? app.position,
        groupPosition: selApp?.groupPosition ?? app.groupPosition,
        groupSize: selApp?.groupSize ?? app.groupSize,
      });
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
  const selected = await getSelectedViewData('service-map');
  const regions = regionId
    ? mapData.regions.filter(r => r.id === regionId)
    : mapData.regions;

  const infrastructures = infrastructureId
    ? regions.flatMap(r => r.infrastructures.filter(i => i.id === infrastructureId))
    : regions.flatMap(r => r.infrastructures);

  const applications = applicationId
    ? infrastructures.flatMap(i => i.applications.filter(a => a.id === applicationId))
    : infrastructures.flatMap(a => a.applications);

  applications.forEach((app: any) => {
    app.services.forEach((service: any) => {
      const selSvc = findItem(selected, service.id, 'service');
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
          value: service.status as HealthValue,
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
        position: selSvc?.position ?? service.position,
        groupPosition: selSvc?.groupPosition ?? service.groupPosition,
        groupSize: selSvc?.groupSize ?? service.groupSize,
      });
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
 
  const regions = regionId
    ? mapData.regions.filter(r => r.id === regionId)
    : mapData.regions;

  const infrastructures = infrastructureId
    ? regions.flatMap(r => (r.infrastructures || []).filter(i => i.id === infrastructureId))
    : regions.flatMap(r => r.infrastructures || []);

  const applications: any[] = applicationId
    ? infrastructures.flatMap((i: any) => (i.applications || []).filter((a: any) => a.id === applicationId))
    : infrastructures.flatMap((i: any) => i.applications || []);

  const services: any[] = serviceId
    ? applications.flatMap((a: any) => (a.services || []).filter((s: any) => s.id === serviceId))
    : applications.flatMap((a: any) => a.services || []);

  services.forEach((svc: any) => {
    (svc.operations || []).forEach((operation: any) => {
      operations.push({
        id: operation.id,
        serviceId: svc.id,
        name: operation.name,
        type: operation.type,
        method: operation.method,
        path: operation.path,
        sourceServiceId: svc.id,
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
  });
  
  return operations;

};

export const getServiceMapData = async (regionId?: string, infrastructureId?: string, applicationId?: string, serviceId?: string): Promise<ServiceMapData> => {
  
  const regions = await getRegions();
  
  // Extract infrastructures and applications from regions (they are already populated in getRegions)
  const infrastructures = regions.flatMap(region => region.infrastructures || []);
  const applications = infrastructures.flatMap(infra => infra.applications || []);
  
  // Get services and operations (these still come from other sources)
  const services = await getServicesByApplication(regionId, infrastructureId, applicationId);
  const operations = await getOperationsByService(regionId, infrastructureId, applicationId, serviceId);

  // Filter regions if regionId is provided
  if (regionId) {
    regions.forEach(region => {
      if (region.id !== regionId) {
        region.infrastructures = [] as Infrastructure[];
      }
    });
  }
  
  // Filter infrastructures if infrastructureId is provided
  if (infrastructureId) {
    regions.forEach(region => {
      if (region.infrastructures && Array.isArray(region.infrastructures)) {
        region.infrastructures = region.infrastructures.filter((infra: Infrastructure) => infra.id === infrastructureId);
      }
    });
  }

  // Filter applications if applicationId is provided
  if (applicationId) {
    regions.forEach(region => {
      if (region.infrastructures && Array.isArray(region.infrastructures)) {
        region.infrastructures.forEach((infra: Infrastructure) => {
          if (infra.applications && Array.isArray(infra.applications)) {
            infra.applications = infra.applications.filter((app: Application) => app.id === applicationId);
          }
        });
      }
    });
  }

  // Add services to applications
  applications.forEach(application => {
    application.services = services.filter(service => service.applicationId === application.id) as Service[];
  });

  // Add operations to services
  services.forEach(service => {
    service.operations = operations.filter(operation => operation.serviceId === service.id) as Operation[];
  });

  return { regions: regions };

};