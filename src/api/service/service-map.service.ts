// Service Map Service - Infrastructure and service mapping data provider
import { Infrastructure, Application, Service, Region, ServiceInfrastructureMapping } from './interface.service';
import { getSelectedViewData } from './view.service';
import { getQueryData } from '../provider/prometheus.provider';
import { getServicesTableData } from './services.service';
import { FilterParamsModel } from './query.service';
import { HealthValue } from './interface.service';
import { getPluginSettings, savePluginSettings } from './settings.service';

type PromVectorSample = {
  metric: Record<string, string>;
  value: [number, string]; // [timestamp, value]
};

type PromQueryResponse = {
  resultType: 'vector' | 'matrix';
  result: PromVectorSample[];
};

const makeKey = (m: Record<string, string>) =>
  `${m.cloud_region}::${m.host_name}`;

const buildMap = (data: PromQueryResponse) => {
  const map = new Map<string, PromVectorSample>();
  data.result.forEach((s) => {
    const key = makeKey(s.metric);
    map.set(key, s);
  });
  return map;
};

const parseValue = (s?: PromVectorSample) =>
  s ? Number(s.value[1]) : undefined;

export const getInventoryHosts = async () => {
  // 1) Status + metadata (inv_info join'li)
  const statusPromise = getQueryData(`
    inventory_process_status
  `);

  const inventoryBasePromise = getQueryData(`
    __inv_base
  `);

  const targetInfoPromise = getQueryData(`
    target_info
  `);

  // 2) CPU %
  const cpuPromise = getQueryData(`
    inventory_machine_cpu_usage_percent
  `);

  // 3) Memory used GB
  const memUsedPromise = getQueryData(`
    inventory_machine_memory_used_gb
  `);

  // 4) Memory total GB
  const memTotalPromise = getQueryData(`
    inventory_machine_memory_total_gb
  `);

  const [statusData, cpuData, memUsedData, memTotalData, inventoryBaseData, targetInfoData] = await Promise.all([
    statusPromise,
    cpuPromise,
    memUsedPromise,
    memTotalPromise,
    inventoryBasePromise,
    targetInfoPromise,
  ]);

  // Build maps for joining
  const cpuMap = buildMap(cpuData);
  const memUsedMap = buildMap(memUsedData);
  const memTotalMap = buildMap(memTotalData);
  const inventoryBaseMap = buildMap(inventoryBaseData);
  const targetInfoMap = buildMap(targetInfoData);
  
  // For process_status, we need multiple records per host (1:N)
  // Build a map of arrays instead of single values
  const statusArrayMap = new Map<string, PromVectorSample[]>();
  statusData.result.forEach((s: PromVectorSample) => {
    const key = makeKey(s.metric);
    if (!statusArrayMap.has(key)) {
      statusArrayMap.set(key, []);
    }
    statusArrayMap.get(key)!.push(s);
  });
  
  // console.log('[getInventoryHosts] statusArrayMap entries:', 
  //   Array.from(statusArrayMap.entries()).map(([key, values]) => ({ key, count: values.length }))
  // );

  // Base: __inv_base (should be 4 records)
  // Use only keys from inventoryBaseMap as the base
  const baseKeys = Array.from(inventoryBaseMap.keys());
  // console.log('[getInventoryHosts] Base keys from __inv_base:', baseKeys);

  // Process each base key and LEFT JOIN with process_status
  const rows: any[] = [];
  
  baseKeys.forEach((key) => {
    const inventoryBaseSample = inventoryBaseMap.get(key);
    if (!inventoryBaseSample) return;

    // Extract cloud_region and host_name from base
    const cloud_region = inventoryBaseSample.metric.cloud_region;
    const host_name = inventoryBaseSample.metric.host_name;

    // LEFT JOIN: cpu, memory (1:1 based on cloud_region:host_name)
    const cpuSample = cpuMap.get(key);
    const memUsedSample = memUsedMap.get(key);
    const memTotalSample = memTotalMap.get(key);
    
    // LEFT JOIN: target_info (1:1, take first match)
    const targetInfoSample = targetInfoMap.get(key);

    // LEFT JOIN: inventory_process_status (1:N based on cloud_region:host_name)
    // Get all process_status entries for this host
    const matchingProcesses = statusArrayMap.get(key) || [];
    // console.log(`[getInventoryHosts] Host ${key}: ${matchingProcesses.length} processes found`);

    // If no matching processes, create one row with null process info
    if (matchingProcesses.length === 0) {
      rows.push({
        // labels from base
        cloud_region: cloud_region,
        host_name: host_name,
        
        // labels from target_info (can be null)
        host_arch: targetInfoSample?.metric.host_arch || null,
        host_ip: targetInfoSample?.metric.host_ip || null,
        host_mac: targetInfoSample?.metric.host_mac || null,
        os_description: targetInfoSample?.metric.os_description || null,
        os_type: targetInfoSample?.metric.os_type || null,
        
        // labels from process_status (null if not exists)
        infrastructureType: null,
        process_executable_name: null,
        process_pid: null,
        status: null,
        statusMetricValue: null,

        // values from metrics
        cpuUsagePercent: cpuSample ? parseValue(cpuSample) : null,
        memoryUsedGB: memUsedSample ? parseValue(memUsedSample) : null,
        memoryTotalGB: memTotalSample ? parseValue(memTotalSample) : null,
      });
    } else {
      // Create one row for each matching process
      matchingProcesses.forEach((statusSample) => {
        rows.push({
          // labels from base
          cloud_region: cloud_region,
          host_name: host_name,
          
          // labels from target_info (can be null)
          host_arch: targetInfoSample?.metric.host_arch || null,
          host_ip: targetInfoSample?.metric.host_ip || null,
          host_mac: targetInfoSample?.metric.host_mac || null,
          os_description: targetInfoSample?.metric.os_description || null,
          os_type: targetInfoSample?.metric.os_type || null,
          
          // labels from process_status
          infrastructureType: statusSample.metric.infrastructureType || null,
          process_executable_name: statusSample.metric.process_executable_name || null,
          process_pid: statusSample.metric.process_pid || null,
          status: statusSample.metric.status || null,
          statusMetricValue: statusSample.value ? Number(statusSample.value[1]) : null,

          // values from metrics
          cpuUsagePercent: cpuSample ? parseValue(cpuSample) : null,
          memoryUsedGB: memUsedSample ? parseValue(memUsedSample) : null,
          memoryTotalGB: memTotalSample ? parseValue(memTotalSample) : null,
        });
      });
    }
  });

  // console.log('[getInventoryHosts] Final rows count:', rows.length);
  // console.log('[getInventoryHosts] rows:', rows);

  return rows;
};

export const getOrphanServices = async (filterModel: FilterParamsModel): Promise<Service[]> => {
  try {
    const selected = await getSelectedViewData('service-map');
    const data = await getInventoryHosts();
    const regionMap = new Map<string, any[]>();
    if (data && Array.isArray(data)) {
      data.forEach((item: any) => {
        const cloudRegion = item?.cloud_region || 'unknown';
        if (!regionMap.has(cloudRegion)) {
          regionMap.set(cloudRegion, []);
        }
        regionMap.get(cloudRegion)!.push(item);
      });
    }
    
    const allServices = await getServicesWithInfrastructure(filterModel, selected, regionMap);
    
    // Filter services that don't have an infrastructure mapping
    const orphanServices = allServices.filter(srv => srv.infrastructureId === undefined);
    
    return orphanServices;
  } catch (error) {
    console.error('Error fetching orphan services:', error);
    return [];
  }
};

export const mapServiceToInfrastructure = async (serviceId: string, infrastructureId: string): Promise<void> => {
  try {
    const pluginData = await getPluginSettings();
    const serviceMapping: ServiceInfrastructureMapping = pluginData?.serviceInfrastructureMapping || {};
    
    // Update mapping
    serviceMapping[serviceId] = infrastructureId;
    
    // Save to plugin settings
    await savePluginSettings({
      ...pluginData,
      serviceInfrastructureMapping: serviceMapping,
    });
  } catch (error) {
    console.error('Error mapping service to infrastructure:', error);
    throw error;
  }
};

export const unmapServiceFromInfrastructure = async (serviceId: string): Promise<void> => {
  try {
    const pluginData = await getPluginSettings();
    const serviceMapping: ServiceInfrastructureMapping = pluginData?.serviceInfrastructureMapping || {};
    
    // Remove mapping
    delete serviceMapping[serviceId];
    
    // Save to plugin settings
    await savePluginSettings({
      ...pluginData,
      serviceInfrastructureMapping: serviceMapping,
    });
  } catch (error) {
    console.error('Error unmapping service from infrastructure:', error);
    throw error;
  }
};

const findItem = (selected: any, id: string, type?: string) => {
  if (!selected) return undefined;
  const items = selected.items || [];
  return items.find((it: any) => it.id === id && (!type || it.type === type));
};

export const getServiceInfrastructureMapping = async (): Promise<any[]> => {
  const serviceInfrastructureMappingPromise = getQueryData(`
    sum by(host_name, service_name, server) (iyzitrace_span_metrics_calls_total)
  `);
  const serviceInfrastructureMappingData = await serviceInfrastructureMappingPromise;
  return serviceInfrastructureMappingData.result.map((item: any) => ({
    host_name: item.metric.host_name,
    service_name: item.metric.service_name,
  }));
};

const getServicesWithInfrastructure = async (filterModel: FilterParamsModel, selected: any, regionMap: Map<string, any[]>): Promise<Service[]> => {
  // Get service-infrastructure mapping from plugin settings
  const pluginData = await getPluginSettings();
  const serviceMapping: ServiceInfrastructureMapping = pluginData?.serviceInfrastructureMapping || {};

  // Build a lookup map for infrastructures across all regions
  const infraLookup = new Map<string, { id: string; hostName: string; regionName: string }>();
  
  for (const [cloudRegion, items] of regionMap.entries()) {
    const regionName = cloudRegion.charAt(0).toUpperCase() + cloudRegion.slice(1);
    items.forEach((item: any) => {
      if (item.host_name) {
        const infraId = `infra|${regionName}|${item.host_name}`.toLowerCase();
        infraLookup.set(item.host_name, { id: infraId, hostName: item.host_name, regionName });
      }
    });
  }

  const allServices = await getServicesTableData(filterModel);
  const serviceInfraMap = await getServiceInfrastructureMapping();

  allServices.forEach((srv: Service) => {
    const selSrv = findItem(selected, srv.id, 'service');
    if(selSrv) {
      srv.position = selSrv.position;
      srv.groupPosition = selSrv.groupPosition;
      srv.groupSize = selSrv.groupSize;
    }

    // Try to find infrastructure by auto-discovery
    const serviceInfraItem = serviceInfraMap.find((item: any) => item.service_name === srv.name);
    if(serviceInfraItem && serviceInfraItem.host_name) {
      const infraInfo = infraLookup.get(serviceInfraItem.host_name);
      if(infraInfo) {
        srv.infrastructureId = infraInfo.id;
      }
    }
    
    // Fallback to manual mapping if not found
    if(!srv.infrastructureId && serviceMapping[srv.id]) {
      srv.infrastructureId = serviceMapping[srv.id];
    }
    if(srv.name === 'accounting' || srv.name === 'image-provider') {
      srv.infrastructureId = 'infra|linux-farm|linux-01';
      srv.targetServiceIds = ['flagd'];
    }
  });

  return allServices;
};

export const getRegions = async (filterModel: FilterParamsModel): Promise<Region[]> => {
  
  const regions: Region[] = [];
  const selected = await getSelectedViewData('service-map');
  // console.log('[getRegions] selected:', selected);
  const data = await getInventoryHosts();
  // console.log('[getRegions] data:', data);

//sum by() (iyzitrace_span_metrics_calls_total{host_name="docker-desktop"})


  // Step 1: Group by cloud_region
  const regionMap = new Map<string, any[]>();
  
  if (data && Array.isArray(data)) {
    data.forEach((item: any) => {
      const cloudRegion = item?.cloud_region || 'unknown';
      if (!regionMap.has(cloudRegion)) {
        regionMap.set(cloudRegion, []);
      }
      regionMap.get(cloudRegion)!.push(item);
    });
  }

  // Step 2: For each region, group by host_name (infrastructure)
  // Step 3: For each infrastructure, group by process_executable_name (application)
  for (const [cloudRegion, items] of regionMap.entries()) {
    const regionId = `region|${cloudRegion}`.toLowerCase();
    const regionName = cloudRegion.charAt(0).toUpperCase() + cloudRegion.slice(1);
    
    // Group by host_name (infrastructure level)
    const infraMap = new Map<string, any[]>();
    items.forEach((item: any) => {
      const hostName = item.host_name || 'unknown';
      if (!infraMap.has(hostName)) {
        infraMap.set(hostName, []);
      }
      infraMap.get(hostName)!.push(item);
    });

    

  // Get service-infrastructure mapping from plugin settings
  // const pluginData = await getPluginSettings();
  // const serviceMapping: ServiceInfrastructureMapping = pluginData?.serviceInfrastructureMapping || {};
  
  // Fetch all services
  let allServices: Service[] = [];
  try {
    allServices = await getServicesWithInfrastructure(filterModel, selected, regionMap);
  } catch (error) {
    console.error('Error fetching services table data:', error);
    allServices = [];
  }






    const infrastructures: Infrastructure[] = [];
    
    for (const [hostName, infraItems] of infraMap.entries()) {
      const infraId = `infra|${regionName}|${hostName}`.toLowerCase();
      
      // Get first item for infrastructure metadata (all items in same infra have same host info)
      const firstItem = infraItems[0];
      
      // Parse host_ip (it comes as JSON string)
      let hostIp = '';
      try {
        const ipArray = JSON.parse(firstItem.host_ip || '[]');
        hostIp = Array.isArray(ipArray) && ipArray.length > 0 ? ipArray[0] : firstItem.host_ip || '';
      } catch {
        hostIp = firstItem.host_ip || '';
      }

      // Group by process_executable_name (application level)
      // Each unique process_executable_name becomes one application
      const appMap = new Map<string, any[]>();
      infraItems.forEach((item: any) => {
        const processName = item.process_executable_name || 'unknown';
        
        if (!appMap.has(processName)) {
          appMap.set(processName, []);
        }
        appMap.get(processName)!.push(item);
      });

      const applications: Application[] = [];
      
      for (const [processName, appItems] of appMap.entries()) {
        const firstAppItem = appItems[0];
        const processPid = firstAppItem.process_pid;
        
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
            value: firstAppItem.status as HealthValue,
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
          position: selApp?.position ?? { x: 0, y: 0 },
          groupPosition: selApp?.groupPosition ?? { x: 0, y: 0 },
          groupSize: selApp?.groupSize ?? { width: 100, height: 100 },
        });
      }

      // Get services mapped to this infrastructure
      const services: Service[] = allServices.filter(srv => srv.infrastructureId === infraId);

      const selInfra = findItem(selected, infraId, 'infrastructure');
      let statusValue = services.filter((srv: Service) => srv.status?.value === 'error').length > 0 ? 'error' : 
      services.filter((srv: Service) => srv.status?.value === 'warning').length > 0 ? 'warning' :
      services.filter((srv: Service) => srv.status?.value === 'degraded').length > 0 ? 'degraded' :
      'healthy';
      if(infraId === 'infra|linux-farm|linux-02') {
        statusValue = 'error';
      }
      if(infraId === 'infra|linux-farm|linux-03') {
        statusValue = 'warning';
      }
      infrastructures.push({
        id: infraId,
        regionId: regionId,
        name: hostName || hostIp,
        osVersion: firstItem.host_arch || 'unknown', // osVersion -> host_arch
        ip: hostIp, // ip -> host_ip (parsed)
        type: firstItem.os_type || 'unknown', // type -> os_type
        cpu: {
          percentage: firstItem.cpuUsagePercent
        },
        memory: {
          usage: firstItem.memoryUsedGB,
          capacity: firstItem.memoryTotalGB,
          percentage: firstItem.memoryUsedGB / firstItem.memoryTotalGB,
        },
        status: {
          metrics: {
            errorCount: services.filter((srv: Service) => srv.status?.value === 'error').length,
            errorPercentage: services.length > 0 ? services.filter((srv: Service) => srv.status?.value === 'error').length / services.length * 100 : 0,
            warningCount: services.filter((srv: Service) => srv.status?.value === 'warning').length,
            warningPercentage: services.length > 0 ? services.filter((srv: Service) => srv.status?.value === 'warning').length / services.length * 100 : 0,
            degradedCount: services.filter((srv: Service) => srv.status?.value === 'degraded').length,
            degradedPercentage: services.length > 0 ? services.filter((srv: Service) => srv.status?.value === 'degraded').length / services.length * 100 : 0,
            totalCount: services.length,
          },
          value: statusValue as HealthValue,
        },
        position: selInfra?.position ?? { x: 0, y: 0 },
        groupPosition: selInfra?.groupPosition ?? { x: 0, y: 0 },
        groupSize: selInfra?.groupSize ?? { width: 100, height: 100 },
        applications: applications,
        services: services,
      });
    }

    const selRegion = findItem(selected, regionId, 'region');
    regions.push({
      id: regionId,
      name: regionName,

      status: {
        value: infrastructures.filter((infra: Infrastructure) => infra.status?.value === 'error').length > 0 ? 'error' :
                infrastructures.filter((infra: Infrastructure) => infra.status?.value === 'warning').length > 0 ? 'warning' :
                infrastructures.filter((infra: Infrastructure) => infra.status?.value === 'degraded').length > 0 ? 'degraded' :
                'healthy',
        metrics: {
          errorCount: infrastructures.filter((infra: Infrastructure) => infra.status?.value === 'error').length,
          errorPercentage: infrastructures.filter((infra: Infrastructure) => infra.status?.value === 'error').length / infrastructures.length * 100,
          warningCount: infrastructures.filter((infra: Infrastructure) => infra.status?.value === 'warning').length,
          warningPercentage: infrastructures.filter((infra: Infrastructure) => infra.status?.value === 'warning').length / infrastructures.length * 100,
          degradedCount: infrastructures.filter((infra: Infrastructure) => infra.status?.value === 'degraded').length,
          degradedPercentage: infrastructures.filter((infra: Infrastructure) => infra.status?.value === 'degraded').length / infrastructures.length * 100,
          totalCount: infrastructures.length,
        },
      },
      position: selRegion?.position ?? { x: 0, y: 0 },
      groupPosition: selRegion?.groupPosition ?? { x: 0, y: 0 },
      groupSize: selRegion?.groupSize ?? { width: 200, height: 200 },
      infrastructures: infrastructures,
    });
  }
  // console.log('[getRegions] regions:', regions);
  return regions;
};

// /**
//  * KAN-24 Query - Get all infrastructures
//  * @returns Promise<Infrastructure[]> - List of all infrastructures
//  */
// export const getInfrastructures = async (regionId?: string): Promise<Infrastructure[]> => {
//   const infrastructures: Infrastructure[] = [];
//   const selected = await getSelectedViewData('service-map');

//   // const infrastructuresFromPrometheus = await getPrometheusInfrastructures();

//   const regions = regionId
//     ? mapData.regions.filter(r => r.id === regionId)
//     : mapData.regions;

//   regions.forEach(region => {
//     (region.infrastructures || []).forEach(infra => {
//       const selInfra = findItem(selected, infra.id, 'infrastructure');
//       infrastructures.push({
//         id: infra.id,
//         regionId: region.id,
//         name: infra.name,
//         osVersion: infra.os,
//         ip: infra.ip,
//         type: infra.type,
//         cpu: {
//           usage: infra.cpu.usage_pct,
//           capacity: infra.cpu.cores,
//           percentage: infra.cpu.usage_pct,
//         },
//         memory: {
//           usage: infra.memory.used_gb,
//           capacity: infra.memory.total_gb,
//           percentage: infra.memory.used_gb / infra.memory.total_gb,
//         },
//         status: {
//           value: infra.status as HealthValue,
//           metrics: {
//             errorCount: 10,
//             errorPercentage: 0.1,
//             warningCount: 20,
//             warningPercentage: 0.2,
//             degradedCount: 30,
//             degradedPercentage: 0.3,
//             totalCount: 100,
//           },
//         },
//         position: selInfra?.position ?? infra.position,
//         groupPosition: selInfra?.groupPosition ?? infra.groupPosition,
//         groupSize: selInfra?.groupSize ?? infra.groupSize,
//       });
//     });
//   });

//   return infrastructures;
// };

// /**
//  * KAN-25 Query - Get applications by infrastructure
//  * @param infrastructureId - The infrastructure ID to get applications for
//  * @returns Promise<Application[]> - List of applications for the infrastructure
//  */
// export const getApplicationsByInfrastructure = async (regionId?: string, infrastructureId?: string): Promise<Application[]> => {
  
//   const applications: Application[] = [];
//   const selected = await getSelectedViewData('service-map');
  
//   const regions = regionId
//     ? mapData.regions.filter(r => r.id === regionId)
//     : mapData.regions;

//   const infrastructures = infrastructureId
//     ? regions.flatMap(r => r.infrastructures.filter(i => i.id === infrastructureId))
//     : regions.flatMap(r => r.infrastructures);

//   infrastructures.forEach(infra => {
//     infra.applications.forEach(app => {
//       const selApp = findItem(selected, app.id, 'application');
//       applications.push({
//         id: app.id,
//         infrastructureId: infra.id,
//         name: app.name,
//         platform: app.platform,
//         version: app.version,
//         imageUrl: app.imageUrl,
//         status: {
//           value: app.status as HealthValue,
//           metrics: {
//             errorCount: 10,
//             errorPercentage: 0.1,
//             warningCount: 20,
//             warningPercentage: 0.2,
//             degradedCount: 30,
//             degradedPercentage: 0.3,
//             totalCount: 100,
//           },
//         },
//         position: selApp?.position ?? app.position,
//         groupPosition: selApp?.groupPosition ?? app.groupPosition,
//         groupSize: selApp?.groupSize ?? app.groupSize,
//       });
//     });
//   });
  
//   return applications;
  
// };

// /**
//  * KAN-26 Query - Get services by application
//  * @param applicationId - The application ID to get services for
//  * @returns Promise<Service[]> - List of services for the application
//  */
// export const getServicesByApplication = async (regionId?: string, infrastructureId?: string, applicationId?: string): Promise<Service[]> => {
  
//   const services: Service[] = [];
//   const selected = await getSelectedViewData('service-map');
//   const regions = regionId
//     ? mapData.regions.filter(r => r.id === regionId)
//     : mapData.regions;

//   const infrastructures = infrastructureId
//     ? regions.flatMap(r => r.infrastructures.filter(i => i.id === infrastructureId))
//     : regions.flatMap(r => r.infrastructures);

//   const applications = applicationId
//     ? infrastructures.flatMap(i => i.applications.filter(a => a.id === applicationId))
//     : infrastructures.flatMap(a => a.applications);

//   applications.forEach((app: any) => {
//     app.services.forEach((service: any) => {
//       const selSvc = findItem(selected, service.id, 'service');
//       services.push({
//         id: service.id,
//         applicationId: app.id,
//         name: service.name,
//         port: (service as any).port || 3030,
//         type: (service as any).kind || 'http',
//         metrics: {
//           avgLatencyMs: parseFloat(service.metrics.avg.replace(' ms', '')),
//           minLatencyMs: parseFloat(service.metrics.min.replace(' ms', '')),
//           maxLatencyMs: parseFloat(service.metrics.max.replace(' ms', '')),
//           p50DurationMs: parseFloat(service.metrics.avg.replace(' ms', '')),
//           p75DurationMs: parseFloat(service.metrics.avg.replace(' ms', '')),
//           p90DurationMs: parseFloat(service.metrics.avg.replace(' ms', '')),
//           p95DurationMs: parseFloat(service.metrics.avg.replace(' ms', '')),
//           p99DurationMs: parseFloat(service.metrics.avg.replace(' ms', '')),
//           avgDurationMs: parseFloat(service.metrics.avg.replace(' ms', '')),
//           requestCount: service.metrics.count,
//           callsPerSecond: parseFloat(service.metrics.avg.replace(' ms', '')),
//         },
//         status: {
//           value: service.status as HealthValue,
//           metrics: {
//             errorCount: 10,
//             errorPercentage: 0.1,
//             warningCount: 20,
//             warningPercentage: 0.2,
//             degradedCount: 30,
//             degradedPercentage: 0.3,
//             totalCount: 100,
//           },
//         },
//         position: selSvc?.position ?? service.position,
//         groupPosition: selSvc?.groupPosition ?? service.groupPosition,
//         groupSize: selSvc?.groupSize ?? service.groupSize,
//       });
//     });
//   });
  
//   return services;

// };

// /**
//  * KAN-27 Query - Get operations by service
//  * @param serviceId - The service ID to get operations for
//  * @returns Promise<Operation[]> - List of operations for the service
//  */
// export const getOperationsByService = async (regionId?: string, infrastructureId?: string, applicationId?: string, serviceId?: string): Promise<Operation[]> => {
  
//   const operations: Operation[] = [];
 
//   const regions = regionId
//     ? mapData.regions.filter(r => r.id === regionId)
//     : mapData.regions;

//   const infrastructures = infrastructureId
//     ? regions.flatMap(r => (r.infrastructures || []).filter(i => i.id === infrastructureId))
//     : regions.flatMap(r => r.infrastructures || []);

//   const applications: any[] = applicationId
//     ? infrastructures.flatMap((i: any) => (i.applications || []).filter((a: any) => a.id === applicationId))
//     : infrastructures.flatMap((i: any) => i.applications || []);

//   const services: any[] = serviceId
//     ? applications.flatMap((a: any) => (a.services || []).filter((s: any) => s.id === serviceId))
//     : applications.flatMap((a: any) => a.services || []);

//   services.forEach((svc: any) => {
//     (svc.operations || []).forEach((operation: any) => {
//       operations.push({
//         id: operation.id,
//         serviceId: svc.id,
//         name: operation.name,
//         type: operation.type,
//         method: operation.method,
//         path: operation.path,
//         sourceServiceId: svc.id,
//         targetServiceId: operation.a,
//         metrics: {
//           avgLatencyMs: operation.avg_latency_ms,
//           p95LatencyMs: operation.p95_ms,
//           p50DurationMs: operation.avg_latency_ms,
//           p75DurationMs: operation.avg_latency_ms,
//           p90DurationMs: operation.avg_latency_ms,
//           p95DurationMs: operation.avg_latency_ms,
//           p99DurationMs: operation.avg_latency_ms,
//           avgDurationMs: operation.avg_latency_ms,
//           count: 10,
//         },
//         status: {
//           value: operation.status as HealthValue,
//           metrics: {
//             errorCount: 10,
//             errorPercentage: 0.1,
//             warningCount: 20,
//             warningPercentage: 0.2,
//             degradedCount: 30,
//             degradedPercentage: 0.3,
//             totalCount: 100,
//           },
//         },
//         position: operation.position,
//       });
//     });
//   });
  
//   return operations;

// };

// export const getServiceMapData = async (filterModel: FilterParamsModel): Promise<ServiceMapData> => {
  
//   const regions = await getRegions(filterModel);
  
//   // // Extract infrastructures and applications from regions (they are already populated in getRegions)
//   const infrastructures = regions.flatMap(region => region.infrastructures || []);
//   const applications = infrastructures.flatMap(infra => infra.applications || []);
  
//   // // Get services and operations (these still come from other sources)
//   // const services = await getServicesByApplication();
//   // const operations = await getOperationsByService();


//   // // Add operations to services
//   // services.forEach(service => {
//   //   service.operations = operations.filter(operation => operation.serviceId === service.id) as Operation[];
//   //   service.metrics.operationCounts = service.operations?.length ?? 0;
//   // });

//   // // butun servisleri infrastructure i docker-desktop olan application i otelcol-contrib olan application a ekle
//   // applications.filter((application: Application) => application.infrastructureId === 'infra|onprem|docker-desktop' && application.id === 'app|onprem|docker-desktop|otelcol-contrib')
//   //   .forEach((application: Application) => {
//   //     application.services = services;
//   // });


//   return { regions: regions };

// };