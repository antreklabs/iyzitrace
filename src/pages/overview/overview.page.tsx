import React, { useState, useEffect, useMemo } from 'react';
import { Row, Col, Typography, Spin } from 'antd';
import { 
  CloudServerOutlined, 
  AppstoreOutlined, 
  SettingOutlined, 
  UnorderedListOutlined,
  CoffeeOutlined,
  WindowsOutlined
} from '@ant-design/icons';
import { getServiceMapData } from '../../api/service/service-map.service';
import { Infrastructure, Application, Service, Operation, Region } from '../../api/service/interface.service';
import InfrastructureCard from '../../components/overview/overview.card.Infrastructure';
import ApplicationCard from '../../components/overview/overview.card.Application';
import ServiceCard from '../../components/overview/overview.card.Service';
import OperationCard from '../../components/overview/overview.card.Operation';

const { Title } = Typography;

const OverviewPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [regions, setRegions] = useState<Region[]>([]);
  const [selectedInfrastructureId, setSelectedInfrastructureId] = useState<string | null>(null);
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedOperationId, setSelectedOperationId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getServiceMapData();
        console.log(data);
        setRegions(data.regions || []);
      } catch (error) {
        console.error('Error fetching service map data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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

  // Group services by type (Java/.NET) for display
  const javaServices = useMemo(() => {
    return filteredServices.filter(service => {
      const app = filteredApplications.find(a => a.services?.some((s: Service) => s.id === service.id));
      return app?.platform?.toLowerCase().includes('java') || 
             app?.platform?.toLowerCase().includes('jdk') ||
             service.type?.toLowerCase().includes('java');
    });
  }, [filteredServices, filteredApplications]);

  const dotnetServices = useMemo(() => {
    return filteredServices.filter(service => {
      const app = filteredApplications.find(a => a.services?.some((s: Service) => s.id === service.id));
      return app?.platform?.toLowerCase().includes('.net') || 
             app?.platform?.toLowerCase().includes('dotnet') ||
             service.type?.toLowerCase().includes('.net');
    });
  }, [filteredServices, filteredApplications]);

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

  if (loading) {
    return (
      <div style={{ padding: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', minHeight: '100vh' }}>
      {/* Servers & Infrastructure Section */}
      <div style={{ marginBottom: '32px' }}>
        <Title level={2} style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CloudServerOutlined style={{ color: '#1890ff' }} />
          Servers & Infrastructure
        </Title>
        <Row gutter={[16, 16]}>
          {filteredInfrastructures.map((infrastructure) => (
            <Col xs={24} sm={12} lg={6} key={infrastructure.id}>
              <InfrastructureCard
                infrastructure={infrastructure}
                onClick={handleInfrastructureClick}
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
          Applications Layer
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
      {(javaServices.length > 0 || dotnetServices.length > 0) && (
      <div style={{ marginBottom: '32px' }}>
        <Title level={2} style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <SettingOutlined style={{ color: '#1890ff' }} />
          Services Layer
        </Title>
        <Row gutter={[16, 16]}>
            {javaServices.length > 0 && (
          <Col xs={24} lg={12}>
                <ServiceCard
                  services={javaServices}
                  title="Java Services"
                  icon={<CoffeeOutlined style={{ color: 'white' }} />}
                  gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                  onClick={handleServiceClick}
                  selectedServiceId={selectedServiceId}
                />
              </Col>
            )}
            {dotnetServices.length > 0 && (
              <Col xs={24} lg={12}>
                <ServiceCard
                  services={dotnetServices}
                  title=".NET Services"
                  icon={<WindowsOutlined style={{ color: 'white' }} />}
                  gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
                  onClick={handleServiceClick}
                  selectedServiceId={selectedServiceId}
                />
          </Col>
            )}
        </Row>
      </div>
      )}

      {/* Operations Layer Section */}
      {Object.keys(operationsByService).length > 0 && (
      <div>
        <Title level={2} style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <UnorderedListOutlined style={{ color: '#1890ff' }} />
          Operations Layer
        </Title>
        <Row gutter={[16, 16]}>
            {Object.entries(operationsByService).map(([serviceName, operations]) => (
              <Col xs={24} lg={12} key={serviceName}>
                <OperationCard
                  operations={operations}
                  title={`${serviceName} Operations`}
                  onClick={handleOperationClick}
                  selectedOperationId={selectedOperationId}
                />
          </Col>
            ))}
        </Row>
      </div>
      )}
    </div>
  );
};

export default OverviewPage;
