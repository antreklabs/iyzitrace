import { Infrastructure, Application, Service, Region, ServiceInfrastructureMapping } from './interface.service';
import { getSelectedViewData } from './view.service';
import { getQueryData } from '../provider/prometheus.provider';
import { getServicesTableData } from './services.service';
import { FilterParamsModel } from './query.service';
import { HealthValue } from './interface.service';
import { getPluginSettings, savePluginSettings } from './settings.service';

type PromVectorSample = {
  metric: Record<string, string>;
  value: [number, string];
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
  const statusPromise = getQueryData(`
    inventory_process_status
  `);

  const inventoryBasePromise = getQueryData(`
    __inv_base
  `);

  const targetInfoPromise = getQueryData(`
    target_info
  `);

  const cpuPromise = getQueryData(`
    inventory_machine_cpu_usage_percent
  `);

  const memUsedPromise = getQueryData(`
    inventory_machine_memory_used_gb
  `);

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

  const cpuMap = buildMap(cpuData);
  const memUsedMap = buildMap(memUsedData);
  const memTotalMap = buildMap(memTotalData);
  const inventoryBaseMap = buildMap(inventoryBaseData);
  const targetInfoMap = buildMap(targetInfoData);
  
  const statusArrayMap = new Map<string, PromVectorSample[]>();
  statusData.result.forEach((s: PromVectorSample) => {
    const key = makeKey(s.metric);
    if (!statusArrayMap.has(key)) {
      statusArrayMap.set(key, []);
    }
    statusArrayMap.get(key)!.push(s);
  });

  const baseKeys = Array.from(inventoryBaseMap.keys());

  const rows: any[] = [];
  
  baseKeys.forEach((key) => {
    const inventoryBaseSample = inventoryBaseMap.get(key);
    if (!inventoryBaseSample) return;

    const cloud_region = inventoryBaseSample.metric.cloud_region;
    const host_name = inventoryBaseSample.metric.host_name;

    const cpuSample = cpuMap.get(key);
    const memUsedSample = memUsedMap.get(key);
    const memTotalSample = memTotalMap.get(key);
    
    const targetInfoSample = targetInfoMap.get(key);

    const matchingProcesses = statusArrayMap.get(key) || [];

    if (matchingProcesses.length === 0) {
      rows.push({
        cloud_region: cloud_region,
        host_name: host_name,
        
        host_arch: targetInfoSample?.metric.host_arch || null,
        host_ip: targetInfoSample?.metric.host_ip || null,
        host_mac: targetInfoSample?.metric.host_mac || null,
        os_description: targetInfoSample?.metric.os_description || null,
        os_type: targetInfoSample?.metric.os_type || null,
        
        infrastructureType: null,
        process_executable_name: null,
        process_pid: null,
        status: null,
        statusMetricValue: null,

        cpuUsagePercent: cpuSample ? parseValue(cpuSample) : null,
        memoryUsedGB: memUsedSample ? parseValue(memUsedSample) : null,
        memoryTotalGB: memTotalSample ? parseValue(memTotalSample) : null,
      });
    } else {
      matchingProcesses.forEach((statusSample) => {
        rows.push({
          cloud_region: cloud_region,
          host_name: host_name,
          
          host_arch: targetInfoSample?.metric.host_arch || null,
          host_ip: targetInfoSample?.metric.host_ip || null,
          host_mac: targetInfoSample?.metric.host_mac || null,
          os_description: targetInfoSample?.metric.os_description || null,
          os_type: targetInfoSample?.metric.os_type || null,
          
          infrastructureType: statusSample.metric.infrastructureType || null,
          process_executable_name: statusSample.metric.process_executable_name || null,
          process_pid: statusSample.metric.process_pid || null,
          status: statusSample.metric.status || null,
          statusMetricValue: statusSample.value ? Number(statusSample.value[1]) : null,

          cpuUsagePercent: cpuSample ? parseValue(cpuSample) : null,
          memoryUsedGB: memUsedSample ? parseValue(memUsedSample) : null,
          memoryTotalGB: memTotalSample ? parseValue(memTotalSample) : null,
        });
      });
    }
  });

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
    
    const orphanServices = allServices.filter(srv => srv.infrastructureId === undefined);
    
    return orphanServices;
  } catch (error) {
    return [];
  }
};

export const mapServiceToInfrastructure = async (serviceId: string, infrastructureId: string): Promise<void> => {
  try {
    const pluginData = await getPluginSettings();
    const serviceMapping: ServiceInfrastructureMapping = pluginData?.serviceInfrastructureMapping || {};
    
    serviceMapping[serviceId] = infrastructureId;
    
    await savePluginSettings({
      ...pluginData,
      serviceInfrastructureMapping: serviceMapping,
    });
  } catch (error) {
    throw error;
  }
};

export const unmapServiceFromInfrastructure = async (serviceId: string): Promise<void> => {
  try {
    const pluginData = await getPluginSettings();
    const serviceMapping: ServiceInfrastructureMapping = pluginData?.serviceInfrastructureMapping || {};
    
    delete serviceMapping[serviceId];
    
    await savePluginSettings({
      ...pluginData,
      serviceInfrastructureMapping: serviceMapping,
    });
  } catch (error) {
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
  const pluginData = await getPluginSettings();
  const serviceMapping: ServiceInfrastructureMapping = pluginData?.serviceInfrastructureMapping || {};

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

    const serviceInfraItem = serviceInfraMap.find((item: any) => item.service_name === srv.name);
    if(serviceInfraItem && serviceInfraItem.host_name) {
      const infraInfo = infraLookup.get(serviceInfraItem.host_name);
      if(infraInfo) {
        srv.infrastructureId = infraInfo.id;
      }
    }
    
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

  for (const [cloudRegion, items] of regionMap.entries()) {
    const regionId = `region|${cloudRegion}`.toLowerCase();
    const regionName = cloudRegion.charAt(0).toUpperCase() + cloudRegion.slice(1);
    
    const infraMap = new Map<string, any[]>();
    items.forEach((item: any) => {
      const hostName = item.host_name || 'unknown';
      if (!infraMap.has(hostName)) {
        infraMap.set(hostName, []);
      }
      infraMap.get(hostName)!.push(item);
    });
  
  let allServices: Service[] = [];
  try {
    allServices = await getServicesWithInfrastructure(filterModel, selected, regionMap);
  } catch (error) {
    allServices = [];
  }

    const infrastructures: Infrastructure[] = [];
    
    for (const [hostName, infraItems] of infraMap.entries()) {
      const infraId = `infra|${regionName}|${hostName}`.toLowerCase();
      
      const firstItem = infraItems[0];
      
      let hostIp = '';
      try {
        const ipArray = JSON.parse(firstItem.host_ip || '[]');
        hostIp = Array.isArray(ipArray) && ipArray.length > 0 ? ipArray[0] : firstItem.host_ip || '';
      } catch {
        hostIp = firstItem.host_ip || '';
      }

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
        
        const appId = `app|${regionName}|${hostName}|${processName}`.toLowerCase();
        
        const selApp = findItem(selected, appId, 'application');
        
        applications.push({
          id: appId,
          infrastructureId: infraId,
          name: processName,
          platform: processName,
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
        osVersion: firstItem.host_arch || 'unknown',
        ip: hostIp,
        type: firstItem.os_type || 'unknown',
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
  return regions;
};



