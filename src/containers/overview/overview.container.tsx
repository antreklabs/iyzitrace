import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, Tag } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import {
  CloudServerOutlined,
  SettingOutlined,
  UnorderedListOutlined,
  CloudOutlined
} from '@ant-design/icons';
import { getOverviewData, mapServiceToInfrastructure, unmapServiceFromInfrastructure } from '../../api/service/service-map.service';
import { Infrastructure, Service, Operation, Region } from '../../api/service/interface.service';
import RegionCard from '../../components/overview/overview.card.Region';
import InfrastructureCard from '../../components/overview/overview.card.Infrastructure';
import ApplicationsSidebar from '../../components/overview/overview.applications-sidebar.component';
import ServiceCard from '../../components/overview/overview.card.Service';
import OperationCard from '../../components/overview/overview.card.Operation';
import { FilterParamsModel } from '../../api/service/query.service';
import BaseContainerComponent, { FetchedModel } from '../base.container';
import { TableColumn, getTableColumns, columns as columnUtils, ColumnItem } from '../../api/service/table.services';
import BaseFilter from '../base.filter';
import BaseTable from '../base.table';
import HorizontalScrollContainer from '../../components/core/horizontal-scroll-container.component';
import { getOperationTypeColor } from '../../api/service/services.service';
import '../../assets/styles/containers/containers.css';
import '../../assets/styles/global.css';

const OverviewContainer: React.FC = () => {
  const navigate = useNavigate();
  const [regions, setRegions] = useState<Region[]>([]);
  const [orphanServices, setOrphanServices] = useState<Service[]>([]);
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const [selectedInfrastructureId, setSelectedInfrastructureId] = useState<string | null>(null);
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedOperationId, setSelectedOperationId] = useState<string | null>(null);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [sidebarInfrastructure, setSidebarInfrastructure] = useState<Infrastructure | null>(null);
  const [infraLevelData, setInfraLevelData] = useState<Infrastructure[]>([]);
  const [columns, setColumns] = useState<TableColumn>();
  const [draggedService, setDraggedService] = useState<Service | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [droppingTargetId, setDroppingTargetId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [unmapModalVisible, setUnmapModalVisible] = useState(false);
  const [serviceToUnmap, setServiceToUnmap] = useState<Service | null>(null);
  const [servicesSearchQuery, setServicesSearchQuery] = useState('');
  const [operationsSearchQuery, setOperationsSearchQuery] = useState('');

  const fetchModelData = async (filterModel: FilterParamsModel): Promise<FetchedModel> => {
    const { regions, orphanServices: orphans } = await getOverviewData(filterModel);
    setRegions(regions);
    setOrphanServices(orphans);
    const infrastructures = (regions || []).flatMap((r: Region) => r.infrastructures || []);
    setInfraLevelData(infrastructures);
    setColumnInDetail(infrastructures);

    return { data: regions, columns: columns };
  };

  const setColumnInDetail = (data: Infrastructure[]) => {
    if (columns) {
      return;
    }
    const cols = getTableColumns(data, 'services', 'operations')
    let root = columnUtils.renameColumns(cols.RootColumns, {
      osversion: 'OS Version',
      ip: 'IP Address',
      cpupercentage: 'CPU Usage',
      memorypercentage: 'Memory Usage'
    });
    root = columnUtils.reorderColumns(root, ['region', 'name', 'osversion', 'ip', 'type', 'status.value']);
    let l1 = columnUtils.renameColumns(cols.L1Columns ?? [], {
      metricsavgdurationms: 'Avg',
      metricsmindurationms: 'Min',
      metricsmaxdurationms: 'Max',
      metricssumdurationms: 'Sum',
      metricsp50durationms: 'P50',
      metricsp75durationms: 'P75',
      metricsp90durationms: 'P90',
      metricsp95durationms: 'P95',
      metricsp99durationms: 'P99',
      metricscallscount: 'Calls',
      metricscallspersecond: 'Calls/s',
      metricsoperationcounts: 'Ops',
    });
    l1 = columnUtils.reorderColumns(l1, ['name', 'type', 'port']);
    const serviceTypeColumn = l1.find((col: ColumnItem) => col.key === 'type');
    if (serviceTypeColumn) {
      serviceTypeColumn.render = (value: string) => {
        return <Tag color={getOperationTypeColor(value)}>{value}</Tag>;
      };
    }
    const serviceNameColumn = l1.find((col: ColumnItem) => col.key === 'name');
    if (serviceNameColumn) {
      serviceNameColumn.render = (value: string) => {
        return <span style={{ color: '#1890ff', cursor: 'pointer' }} onClick={() => navigate(`/a/iyzitrace-app/services/${value}`)}>{value}</span>;
      };
    }

    let l2 = columnUtils.renameColumns(cols.L2Columns ?? [], {
      metricsavgdurationms: 'Avg',
      metricsmindurationms: 'Min',
      metricsmaxdurationms: 'Max',
      metricssumdurationms: 'Sum',
      metricsp50durationms: 'P50',
      metricsp75durationms: 'P75',
      metricsp90durationms: 'P90',
      metricsp95durationms: 'P95',
      metricsp99durationms: 'P99',
      metricscallscount: 'Calls',
      metricscallspersecond: 'Calls/s',
      metricsoperationcounts: 'Ops',
    });
    l2 = columnUtils.reorderColumns(l2, ['name', 'type', 'method', 'path']);
    const operationTypeColumn = l2.find((col: ColumnItem) => col.key === 'type');
    if (operationTypeColumn) {
      operationTypeColumn.render = (value: string) => {
        return <Tag color={getOperationTypeColor(value)}>{value}</Tag>;
      };
    }

    const hiddenCols: TableColumn = {
      RootColumns: columnUtils.hideColumns(root, ['id', 'cpu.usage', 'cpu.capacity', 'memory.usage', 'memory.capacity', 'regionId']),
      L1Columns: columnUtils.hideColumns(l1, ['id', 'infrastructureId']),
      L2Columns: columnUtils.hideColumns(l2, ['id', 'serviceId'])
    };

    setColumns(hiddenCols);
  };

  const filteredRegions = useMemo(() => {
    if (selectedRegionId) {
      return regions.filter(region => region.id === selectedRegionId);
    }
    return regions;
  }, [regions, selectedRegionId]);

  const allInfrastructures = useMemo(() => {
    return filteredRegions.flatMap(region => region.infrastructures || []);
  }, [filteredRegions]);

  const filteredInfrastructures = useMemo(() => {
    if (selectedInfrastructureId) {
      return allInfrastructures.filter(infra => infra.id === selectedInfrastructureId);
    }
    return allInfrastructures;
  }, [allInfrastructures, selectedInfrastructureId]);

  const allApplications = useMemo(() => {
    return regions.flatMap(region =>
      region.infrastructures?.flatMap(infra => infra.applications || []) || []
    );
  }, [regions]);

  const sidebarApplications = useMemo(() => {
    if (sidebarInfrastructure) {
      return sidebarInfrastructure.applications || [];
    }
    return allApplications;
  }, [sidebarInfrastructure, allApplications]);

  const allServices = useMemo(() => {
    return filteredInfrastructures.flatMap(infra => infra.services || []);
  }, [filteredInfrastructures]);

  const filteredServices = useMemo(() => {
    if (selectedServiceId) {
      return allServices.filter(service => service.id === selectedServiceId);
    }
    if (selectedApplicationId || selectedInfrastructureId) {
      return allServices;
    }
    return allServices;
  }, [allServices, selectedServiceId, selectedApplicationId, selectedInfrastructureId]);

  const servicesByInfrastructure = useMemo(() => {
    const groups: { [infraId: string]: { infrastructure: Infrastructure; services: Service[] } } = {};

    filteredInfrastructures.forEach(infrastructure => {
      const infraServices = (infrastructure.services || []) as Service[];

      if (infraServices.length > 0) {
        groups[infrastructure.id] = {
          infrastructure,
          services: infraServices
        };
      }
    });

    return groups;
  }, [filteredInfrastructures]);

  const allOperations = useMemo(() => {
    return filteredServices.flatMap(service => service.operations || []);
  }, [filteredServices]);

  const filteredOperations = useMemo(() => {
    if (selectedOperationId) {
      return allOperations.filter(op => op.id === selectedOperationId);
    }
    if (selectedServiceId || selectedApplicationId || selectedInfrastructureId) {
      return allOperations;
    }
    return allOperations;
  }, [allOperations, selectedOperationId, selectedServiceId, selectedApplicationId, selectedInfrastructureId]);

  const operationsByService = useMemo(() => {
    const groups: { [serviceName: string]: Operation[] } = {};
    filteredOperations.forEach(op => {
      const service = filteredServices.find(s => {
        const ops = s.operations || [];
        return ops.some((o: Operation) => o.id === op.id);
      });
      if (service) {
        if (!groups[service.name]) {
          groups[service.name] = [];
        }
        groups[service.name].push(op);
      }
    });
    return groups;
  }, [filteredOperations, filteredServices]);

  const handleRegionClick = (region: Region) => {
    if (selectedRegionId === region.id) {
      setSelectedRegionId(null);
      setSelectedInfrastructureId(null);
      setSelectedApplicationId(null);
      setSelectedServiceId(null);
      setSelectedOperationId(null);
    } else {
      setSelectedRegionId(region.id);
      setSelectedInfrastructureId(null);
      setSelectedApplicationId(null);
      setSelectedServiceId(null);
      setSelectedOperationId(null);
    }
  };

  const handleInfrastructureClick = (infrastructure: Infrastructure) => {
    if (selectedInfrastructureId === infrastructure.id) {
      setSelectedInfrastructureId(null);
      setSelectedApplicationId(null);
      setSelectedServiceId(null);
      setSelectedOperationId(null);
    } else {
      setSelectedInfrastructureId(infrastructure.id);
      setSelectedApplicationId(null);
      setSelectedServiceId(null);
      setSelectedOperationId(null);
    }
  };

  const handleApplicationsClick = (infrastructure: Infrastructure, e: React.MouseEvent) => {
    e.stopPropagation();
    setSidebarInfrastructure(infrastructure);
    setSidebarVisible(true);
  };

  const handleServiceClick = (service: Service) => {
    if (selectedServiceId === service.id) {
      setSelectedServiceId(null);
      setSelectedOperationId(null);
    } else {
      setSelectedServiceId(service.id);
      setSelectedOperationId(null);
    }
  };

  const handleOperationClick = (operation: Operation) => {
    if (selectedOperationId === operation.id) {
      setSelectedOperationId(null);
    } else {
      setSelectedOperationId(operation.id);
    }
  };

  const handleServiceDragStart = (service: Service) => {
    setDraggedService(service);
  };

  const handleInfrastructureDragEnter = (infrastructure: Infrastructure, e: React.DragEvent) => {
    e.preventDefault();
    setDropTargetId(infrastructure.id);
  };

  const handleInfrastructureDragLeave = (infrastructure: Infrastructure, e: React.DragEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDropTargetId(null);
    }
  };

  const handleInfrastructureDrop = async (infrastructure: Infrastructure, e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setDropTargetId(null);
    setDroppingTargetId(infrastructure.id);

    if (draggedService && draggedService.id) {
      try {
        await mapServiceToInfrastructure(draggedService.id, infrastructure.id);
        setRefreshTrigger(prev => prev + 1);
      } catch (error) {
      }
    }

    setDraggedService(null);
    setDroppingTargetId(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleUnmapService = (service: Service) => {
    setServiceToUnmap(service);
    setUnmapModalVisible(true);
  };

  const confirmUnmap = async () => {
    if (serviceToUnmap && serviceToUnmap.id) {
      try {
        await unmapServiceFromInfrastructure(serviceToUnmap.id);
        setRefreshTrigger(prev => prev + 1);
        setUnmapModalVisible(false);
        setServiceToUnmap(null);
      } catch (error) {
      }
    }
  };

  const cancelUnmap = () => {
    setUnmapModalVisible(false);
    setServiceToUnmap(null);
  };

  return (
    <BaseContainerComponent
      title="Overview"
      initialFilterCollapsed={true}
      onFetchData={fetchModelData}
      refreshTrigger={refreshTrigger}
      filterComponent={
        <BaseFilter
          hasServiceFilter={true}
          hasOperationsFilter={true}
          hasStatusesFilter={true}
          hasDurationFilter={false}
          hasTagsFilter={false}
          hasOptionsFilter={true}
          hasLabelsFilter={true}
          hasFieldsFilter={true}
          hasTypesFilter={true}
          hasExceptionTypesFilter={true}
          columns={columns?.RootColumns ?? []}
          data={regions}
        />
      }
    >
      <div style={{ padding: '24px', minHeight: '100vh' }}>
        {
        }
        <HorizontalScrollContainer
          title="Regions"
          icon={<CloudOutlined style={{ color: '#1890ff' }} />}
          searchable={true}
          searchPlaceholder=" Search regions..."
          getSearchableText={(child) => {
            const props = child.props as any;
            let children = props?.children;
            if (Array.isArray(children)) {
              children = children.find((c: any) => React.isValidElement(c));
            }
            const regionCard = React.isValidElement(children) ? (children as any) : null;
            const region = regionCard?.props?.region;
            return region?.name || '';
          }}
        >
          {regions.map((region) => (
            <div key={region.id} style={{ display: 'inline-block', width: '280px' }}>
              <RegionCard
                region={region}
                onClick={handleRegionClick}
                isSelected={selectedRegionId === region.id}
              />
            </div>
          ))}
        </HorizontalScrollContainer>

        {
        }
        <HorizontalScrollContainer
          title="Infrastructures"
          icon={<CloudServerOutlined style={{ color: '#1890ff' }} />}
          searchable={true}
          searchPlaceholder=" Search infrastructures..."
          getSearchableText={(child) => {
            const props = child.props as any;
            let children = props?.children;
            if (Array.isArray(children)) {
              children = children.find((c: any) => React.isValidElement(c));
            }
            const infraCard = React.isValidElement(children) ? (children as any) : null;
            const infrastructure = infraCard?.props?.infrastructure;
            return infrastructure?.name || '';
          }}
        >
          {filteredInfrastructures.map((infrastructure) => (
            <div key={infrastructure.id} style={{ display: 'inline-block', width: '300px' }}>
              <InfrastructureCard
                infrastructure={infrastructure}
                onClick={handleInfrastructureClick}
                isSelected={selectedInfrastructureId === infrastructure.id}
                onApplicationsClick={handleApplicationsClick}
                onDrop={handleInfrastructureDrop}
                onDragOver={handleDragOver}
                onDragEnter={handleInfrastructureDragEnter}
                onDragLeave={handleInfrastructureDragLeave}
                isDropTarget={dropTargetId === infrastructure.id}
                isDropping={droppingTargetId === infrastructure.id}
              />
            </div>
          ))}
        </HorizontalScrollContainer>

        {
        }
        <ApplicationsSidebar
          visible={sidebarVisible}
          onClose={() => setSidebarVisible(false)}
          applications={sidebarApplications}
          selectedApplicationId={selectedApplicationId}
        />

        {
        }
        {orphanServices.length > 0 && (
          <HorizontalScrollContainer
            title="Orphan Services (Drag to Infrastructure)"
            icon={<SettingOutlined style={{ color: '#8c8c8c' }} />}
            searchPlaceholder=" Search orphan services..."
            searchable={true}
            getSearchableText={(child) => {
              const props = child.props as any;
              let children = props?.children;
              if (Array.isArray(children)) {
                children = children.find((c: any) => React.isValidElement(c));
              }
              const serviceCard = React.isValidElement(children) ? (children as any) : null;
              const title = serviceCard?.props?.title;
              return title || '';
            }}
          >
            {orphanServices.map((service) => (
              <div
                key={service.id}
                style={{
                  display: 'inline-block',
                  minWidth: '240px',
                  cursor: 'grab',
                  opacity: draggedService?.id === service.id ? 0.5 : 1,
                  transition: 'opacity 0.2s ease'
                }}
                draggable
                onDragStart={() => handleServiceDragStart(service)}
              >
                <ServiceCard
                  services={[service]}
                  title={service.name}
                  icon={<SettingOutlined style={{ color: 'white' }} />}
                  gradient="linear-gradient(135deg, #6b7280 0%, #4b5563 100%)"
                  onClick={handleServiceClick}
                  selectedServiceId={selectedServiceId}
                />
              </div>
            ))}
          </HorizontalScrollContainer>
        )}

        {
        }
        {Object.keys(servicesByInfrastructure).length > 0 && (
          <HorizontalScrollContainer
            title="Services"
            icon={<SettingOutlined style={{ color: '#1890ff' }} />}
            searchable={true}
            searchPlaceholder=" Search services..."
            searchQuery={servicesSearchQuery}
            onSearchChange={setServicesSearchQuery}
          >
            {Object.entries(servicesByInfrastructure).map(([infraId, { infrastructure, services }]) => (
              <div key={infraId} style={{ display: 'inline-block' }}>
                <ServiceCard
                  services={services}
                  title={`${infrastructure.name}`}
                  icon={<SettingOutlined style={{ color: 'white' }} />}
                  gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                  onClick={handleServiceClick}
                  onUnmap={handleUnmapService}
                  selectedServiceId={selectedServiceId}
                  showUnmap={true}
                  searchQuery={servicesSearchQuery}
                />
              </div>
            ))}
          </HorizontalScrollContainer>
        )}

        {
        }
        {Object.keys(operationsByService).length > 0 && (
          <HorizontalScrollContainer
            title="Operations"
            icon={<UnorderedListOutlined style={{ color: '#1890ff' }} />}
            searchable={true}
            searchPlaceholder=" Search operations..."
            searchQuery={operationsSearchQuery}
            onSearchChange={setOperationsSearchQuery}
          >
            {Object.entries(operationsByService).map(([serviceName, operations]) => (
              <div key={serviceName} style={{ display: 'inline-block' }}>
                <OperationCard
                  operations={operations}
                  title={`${serviceName}`}
                  onClick={handleOperationClick}
                  selectedOperationId={selectedOperationId}
                  searchQuery={operationsSearchQuery}
                />
              </div>
            ))}
          </HorizontalScrollContainer>
        )}
      </div>
      {columns && columns.RootColumns && columns.RootColumns.length > 0 && (
        <BaseTable
          data={infraLevelData}
          columns={columns}
          title="Overview"
          showSearch={true}
          searchPlaceholder="Search..."
          l1Key="services"
          l2Key="operations"
        />
      )}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ExclamationCircleOutlined style={{ color: '#faad14', fontSize: '24px' }} />
            <span>Remove Service Mapping</span>
          </div>
        }
        open={unmapModalVisible}
        onOk={confirmUnmap}
        onCancel={cancelUnmap}
        okText="Remove Mapping"
        cancelText="Cancel"
        okButtonProps={{ danger: true }}
        width={500}
      >
        <div style={{ padding: '16px 0' }}>
          <p style={{ fontSize: '16px', marginBottom: '12px' }}>
            Are you sure you want to remove the mapping for <strong>"{serviceToUnmap?.name}"</strong>?
          </p>
          <p style={{ color: '#8c8c8c', fontSize: '14px' }}>
            This will move the service back to <strong>Orphan Services</strong> and it will no longer be associated with its current infrastructure.
          </p>
        </div>
      </Modal>
    </BaseContainerComponent>
  );
};

export default OverviewContainer;