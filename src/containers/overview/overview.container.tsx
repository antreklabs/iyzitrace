import React, { useMemo, useState } from 'react';
import BaseContainerComponent, { FetchedModel } from '../base.container';
import BaseFilter from '../base.filter';
import { getTableColumns, TableColumn } from '../../api/service/table.services';
import { FilterParamsModel } from '../../api/service/query.service';
import { columns as columnUtils } from '../../api/service/table.services';
import { Col, Row } from 'antd';
import { getRegions } from '../../api/service/service-map.service';
import { Application, Infrastructure, Operation, Region, Service } from '../../api/service/interface.service';
import { UnorderedListOutlined } from '@ant-design/icons';
import Title from 'antd/es/typography/Title';
import ServiceCard from '../../components/overview/overview.card.Service';
import OperationCard from '../../components/overview/overview.card.Operation';
import ApplicationCard from '../../components/overview/overview.card.Application';
import InfrastructureCard from '../../components/overview/overview.card.Infrastructure';
import { CloudServerOutlined, AppstoreOutlined, SettingOutlined } from '@ant-design/icons';
import BaseTable from '../base.table';

const OverviewContainer: React.FC = () => {
  
  const [regions, setRegions] = useState<Region[]>([]);
  const [infraLevelData, setInfraLevelData] = useState<Infrastructure[]>([]);
  const [columns, setColumns] = useState<TableColumn>();
  const [selectedInfrastructureId, setSelectedInfrastructureId] = useState<string | null>(null);
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedOperationId, setSelectedOperationId] = useState<string | null>(null);


  const fetchModelData = async (filterModel: FilterParamsModel): Promise<FetchedModel> => {
    const regions = await getRegions(filterModel);
    setRegions(regions);
    const infrastructures = (regions || []).flatMap((r: Region) => r.infrastructures || []);
    setInfraLevelData(infrastructures);
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
  // Flatten all infrastructures from all regions
  const allInfrastructures = useMemo(() => {
    return regions.flatMap(region => region.infrastructures || []);
  }, [regions]);

  // Filter infrastructures based on selection
  const filteredInfrastructures = useMemo(() => {
    if (selectedInfrastructureId) {
      return allInfrastructures.filter(infra => infra.id === selectedInfrastructureId);
    }
    return allInfrastructures;
  }, [allInfrastructures, selectedInfrastructureId]);

  // Get all applications from filtered infrastructures
  const allApplications = useMemo(() => {
    return filteredInfrastructures.flatMap(infra => infra.applications || []);
  }, [filteredInfrastructures]);

  // Filter applications based on selection
  const filteredApplications = useMemo(() => {
    if (selectedApplicationId) {
      return allApplications.filter(app => app.id === selectedApplicationId);
    }
    if (selectedInfrastructureId) {
      return allApplications;
    }
    return allApplications;
  }, [allApplications, selectedApplicationId, selectedInfrastructureId]);

  // Get all services from filtered applications
  const allServices = useMemo(() => {
    return filteredApplications.flatMap(app => app.services || []);
  }, [filteredApplications]);

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
      const infraServices: Service[] = [];
      const applications = (infrastructure.applications || []) as Application[];
      
      applications.forEach((app: Application) => {
        const appServices = (app.services || []) as Service[];
        appServices.forEach((service: Service) => {
          if (filteredServices.some(s => s.id === service.id)) {
            infraServices.push(service);
          }
        });
      });
      
      if (infraServices.length > 0) {
        groups[infrastructure.id] = {
          infrastructure,
          services: infraServices
        };
      }
    });
    
    return groups;
  }, [filteredInfrastructures, filteredServices]);

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

  const handleApplicationClick = (application: Application) => {
    if (selectedApplicationId === application.id) {
      setSelectedApplicationId(null);
      setSelectedServiceId(null);
      setSelectedOperationId(null);
    } else {
      setSelectedApplicationId(application.id);
      setSelectedServiceId(null);
      setSelectedOperationId(null);
    }
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
          hasDurationFilter={true}
          hasTagsFilter={true}
          hasOptionsFilter={true}
          hasLabelsFilter={true}
          hasFieldsFilter={true}
          hasTypesFilter={true}
          hasLevelsFilter={true}
          columns={columns?.RootColumns ?? []}
          data={regions}
        />
      }
    >
    <div style={{ padding: '24px', minHeight: '100vh' }}>
      {/* Servers & Infrastructure Section */}
      <div style={{ marginBottom: '32px' }}>
        <Title level={2} style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CloudServerOutlined style={{ color: '#1890ff' }} />
          Infrastructure
        </Title>
        <Row gutter={[16, 16]}>
          {filteredInfrastructures.map((infrastructure) => (
            <Col xs={24} sm={12} lg={6} key={infrastructure.id}>
              <InfrastructureCard
                infrastructure={infrastructure}
                onClick={handleInfrastructureClick}
                onApplicationsClick={(infra, e) => {
                  e.stopPropagation();
                  // TODO: Implement applications sidebar
                }}
                isSelected={selectedInfrastructureId === infrastructure.id}
              />
            </Col>
          ))}
        </Row>
      </div>

      {/* Applications Layer Section */}
      {filteredApplications.length > 0 && (
      <div style={{ marginBottom: '32px' }}>
        <Title level={2} style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AppstoreOutlined style={{ color: '#1890ff' }} />
          Applications
        </Title>
        <Row gutter={[16, 16]}>
            {filteredApplications.map((application) => (
              <Col xs={24} sm={12} lg={4} key={application.id}>
                <ApplicationCard
                  application={application}
                  onClick={handleApplicationClick}
                  isSelected={selectedApplicationId === application.id}
                />
            </Col>
          ))}
        </Row>
      </div>
      )}

      {/* Services Layer Section */}
      {Object.keys(servicesByInfrastructure).length > 0 && (
      <div style={{ marginBottom: '32px' }}>
        <Title level={2} style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <SettingOutlined style={{ color: '#1890ff' }} />
          Services Layer
        </Title>
        <Row gutter={[16, 16]}>
          {Object.entries(servicesByInfrastructure).map(([infraId, { infrastructure, services }]) => (
            <Col xs={24} lg={12} key={infraId}>
              <ServiceCard
                services={services}
                title={`${infrastructure.name} Services`}
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
              <Col xs={24} lg={12} key={serviceName}>
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