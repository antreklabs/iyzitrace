import React, { useState, useMemo } from 'react';
import { Row, Col, Typography } from 'antd';
import { 
  CloudServerOutlined, 
  SettingOutlined, 
  UnorderedListOutlined,
  CloudOutlined
} from '@ant-design/icons';
import { getRegions } from '../../api/service/service-map.service';
import { Infrastructure, Service, Operation, Region } from '../../api/service/interface.service';
import RegionCard from '../../components/overview/overview.card.Region';
import InfrastructureCard from '../../components/overview/overview.card.Infrastructure';
import ApplicationsSidebar from '../../components/overview/overview.applications-sidebar.component';
import ServiceCard from '../../components/overview/overview.card.Service';
import OperationCard from '../../components/overview/overview.card.Operation';
import { FilterParamsModel } from '../../api/service/query.service';
import BaseContainerComponent, { FetchedModel } from '../base.container';
import { TableColumn, getTableColumns } from '../../api/service/table.services';
import { columns as columnUtils } from '../../api/service/table.services';
import BaseFilter from '../base.filter';
import BaseTable from '../base.table';

const { Title } = Typography;

const OverviewContainer: React.FC = () => {
  const [regions, setRegions] = useState<Region[]>([]);
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const [selectedInfrastructureId, setSelectedInfrastructureId] = useState<string | null>(null);
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedOperationId, setSelectedOperationId] = useState<string | null>(null);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [sidebarInfrastructure, setSidebarInfrastructure] = useState<Infrastructure | null>(null);
  const [infraLevelData, setInfraLevelData] = useState<Infrastructure[]>([]);
  const [columns, setColumns] = useState<TableColumn>();
  

  const fetchModelData = async (filterModel: FilterParamsModel): Promise<FetchedModel> => {
    const regions = await getRegions(filterModel);
    setRegions(regions);
    const infrastructures = (regions || []).flatMap((r: Region) => r.infrastructures || []);
    setInfraLevelData(infrastructures);
    setColumnInDetail(infrastructures);

    return { data: regions, columns: columns };
  };


  const setColumnInDetail = (data: Infrastructure[]) => {
    if(columns) {
      return;
    }
    const cols = getTableColumns(data, 'applications', 'services', 'operations')
    // Example: rename and reorder Root columns before hiding
    let root = columnUtils.renameColumns(cols.RootColumns, {
      osversion: 'OS Version',
      ip: 'IP Address',
      cpupercentage: 'CPU Usage',
      memorypercentage: 'Memory Usage'
    });
    root = columnUtils.reorderColumns(root, ['region','name', 'osversion', 'ip', 'type']);

    const hiddenCols: TableColumn = {
      RootColumns: columnUtils.hideColumns(root, ['id', 'cpu.usage', 'cpu.capacity', 'memory.usage', 'memory.capacity']),
      L1Columns: columnUtils.hideColumns(cols.L1Columns ?? [], ['id', 'infrastructureId']),
      L2Columns: columnUtils.hideColumns(cols.L2Columns ?? [], ['id', 'applicationId']),
      L3Columns: columnUtils.hideColumns(cols.L3Columns ?? [], ['id', 'serviceId'])
    };

    setColumns(hiddenCols);
  };

  // Filter regions based on selection
  const filteredRegions = useMemo(() => {
    if (selectedRegionId) {
      return regions.filter(region => region.id === selectedRegionId);
    }
    return regions;
  }, [regions, selectedRegionId]);

  // Get all infrastructures from filtered regions
  const allInfrastructures = useMemo(() => {
    return filteredRegions.flatMap(region => region.infrastructures || []);
  }, [filteredRegions]);

  // Filter infrastructures based on selection
  const filteredInfrastructures = useMemo(() => {
    if (selectedInfrastructureId) {
      return allInfrastructures.filter(infra => infra.id === selectedInfrastructureId);
    }
    return allInfrastructures;
  }, [allInfrastructures, selectedInfrastructureId]);

  // Get all applications from all regions (no filter)
  const allApplications = useMemo(() => {
    return regions.flatMap(region => 
      region.infrastructures?.flatMap(infra => infra.applications || []) || []
    );
  }, [regions]);

  // Sidebar shows all applications (no filter)
  const sidebarApplications = useMemo(() => {
    if (sidebarInfrastructure) {
      return sidebarInfrastructure.applications || [];
    }
    return allApplications;
  }, [sidebarInfrastructure, allApplications]);

  // Get all services from filtered infrastructures
  const allServices = useMemo(() => {
    return filteredInfrastructures.flatMap(infra => infra.services || []);
  }, [filteredInfrastructures]);

  // Filter services based on selection
  const filteredServices = useMemo(() => {
    if (selectedServiceId) {
      return allServices.filter(service => service.id === selectedServiceId);
    }
    if (selectedApplicationId || selectedInfrastructureId) {
      return allServices;
    }
    return allServices;
  }, [allServices, selectedServiceId, selectedApplicationId, selectedInfrastructureId]);

  // Group services by infrastructure
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


  // Get all operations from filtered services
  const allOperations = useMemo(() => {
    return filteredServices.flatMap(service => service.operations || []);
  }, [filteredServices]);

  // Filter operations based on selection
  const filteredOperations = useMemo(() => {
    if (selectedOperationId) {
      return allOperations.filter(op => op.id === selectedOperationId);
    }
    if (selectedServiceId || selectedApplicationId || selectedInfrastructureId) {
      return allOperations;
    }
    return allOperations;
  }, [allOperations, selectedOperationId, selectedServiceId, selectedApplicationId, selectedInfrastructureId]);

  // Group operations by service for display
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

  return (
    <BaseContainerComponent
      title="Overview"
      initialFilterCollapsed={true}
      onFetchData={fetchModelData}
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
      {/* Regions Section */}
      <div style={{ marginBottom: '32px' }}>
        <Title level={2} style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CloudOutlined style={{ color: '#1890ff' }} />
          Regions
        </Title>
        <Row gutter={[16, 16]}>
          {regions.map((region) => (
            <Col xs={12} sm={8} md={6} lg={4} key={region.id} style={{ minWidth: '270px' }}>
              <RegionCard
                region={region}
                onClick={handleRegionClick}
                isSelected={selectedRegionId === region.id}
              />
            </Col>
          ))}
        </Row>
      </div>

      {/* Servers & Infrastructure Section */}
      <div style={{ marginBottom: '32px' }}>
        <Title level={2} style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CloudServerOutlined style={{ color: '#1890ff' }} />
          Infrastructures
        </Title>
        <Row gutter={[16, 16]}>
          {filteredInfrastructures.map((infrastructure) => (
            <Col xs={12} sm={8} md={6} lg={4} key={infrastructure.id} style={{ minWidth: '270px' }}>
              <InfrastructureCard
                infrastructure={infrastructure}
                onClick={handleInfrastructureClick}
                isSelected={selectedInfrastructureId === infrastructure.id}
                onApplicationsClick={handleApplicationsClick}
              />
            </Col>
          ))}
        </Row>
      </div>

      {/* Applications Sidebar */}
      <ApplicationsSidebar
        visible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
        applications={sidebarApplications}
        selectedApplicationId={selectedApplicationId}
      />

      {/* Services Layer Section */}
      {Object.keys(servicesByInfrastructure).length > 0 && (
      <div style={{ marginBottom: '32px' }}>
        <Title level={2} style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <SettingOutlined style={{ color: '#1890ff' }} />
          Services
        </Title>
        <Row gutter={[16, 16]}>
          {Object.entries(servicesByInfrastructure).map(([infraId, { infrastructure, services }]) => (
            <Col xs={12} sm={8} md={6} lg={4} key={infraId} style={{ minWidth: '270px' }}>
              <ServiceCard
                services={services}
                title={`${infrastructure.name}`}
                icon={<SettingOutlined style={{ color: 'white' }} />}
                gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                onClick={handleServiceClick}
                selectedServiceId={selectedServiceId}
              />
            </Col>
          ))}
        </Row>
      </div>
      )}

      {/* Operations Layer Section */}
      {Object.keys(operationsByService).length > 0 && (
      <div>
        <Title level={2} style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <UnorderedListOutlined style={{ color: '#1890ff' }} />
          Operations
        </Title>
        <Row gutter={[16, 16]}>
            {Object.entries(operationsByService).map(([serviceName, operations]) => (
              <Col xs={12} sm={8} md={6} lg={4} key={serviceName} style={{ minWidth: '270px' }}>
                <OperationCard
                  operations={operations}
                  title={`${serviceName}`}
                  onClick={handleOperationClick}
                  selectedOperationId={selectedOperationId}
                />
          </Col>
            ))}
        </Row>
      </div>
      )}
    </div>
    {columns && columns.RootColumns && columns.RootColumns.length > 0 && (
        <BaseTable
        data={infraLevelData}
        columns={columns}
        title="Overview"
        showSearch={true}
        searchPlaceholder="Search..."
        l1Key="applications"
        l2Key="services"
        l3Key="operations"
        />
      )}
    </BaseContainerComponent>
  );
};

export default OverviewContainer;
