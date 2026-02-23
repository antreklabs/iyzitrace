import React, { useState, useMemo } from 'react';
import { Card, Badge, Typography, Avatar, Button, Tooltip } from 'antd';
import {
  SettingOutlined,
  SafetyCertificateOutlined,
  ShoppingCartOutlined,
  CreditCardOutlined,
  BellOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import { Service } from '../../api/service/interface.service';

const { Title, Text } = Typography;

interface ServiceCardProps {
  services: Service[];
  title: string;
  icon: React.ReactNode;
  gradient: string;
  onClick: (service: Service) => void;
  onUnmap?: (service: Service) => void;
  selectedServiceId?: string;
  showUnmap?: boolean;
  searchQuery?: string;
}

const ServiceCard: React.FC<ServiceCardProps> = ({
  services,
  title,
  icon,
  gradient,
  onClick,
  onUnmap,
  selectedServiceId,
  showUnmap = false,
  searchQuery = ''
}) => {
  const [expanded, setExpanded] = useState(false);

  const formatDuration = (ms: number) => {
    if (ms >= 60000) {
      return `${(ms / 60000).toFixed(2)}m`;
    }
    if (ms >= 1000) {
      return `${(ms / 1000).toFixed(2)}s`;
    }
    return `${ms.toFixed(2)}ms`;
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'healthy':
        return '#52c41a';
      case 'warning':
        return '#faad14';
      case 'error':
        return '#f5222d';
      case 'degraded':
        return '#ff9800';
      default:
        return '#d9d9d9';
    }
  };

  const getStatusPriority = (status?: string) => {
    switch (status) {
      case 'error':
        return 1;
      case 'degraded':
        return 2;
      case 'warning':
        return 3;
      case 'healthy':
        return 4;
      default:
        return 5;
    }
  };

  const getServiceIcon = (serviceName: string) => {
    const nameLower = serviceName.toLowerCase();
    if (nameLower.includes('user') || nameLower.includes('management')) {
      return <SafetyCertificateOutlined className="overview-service-icon icon-color-blue" />;
    }
    if (nameLower.includes('order') || nameLower.includes('processing')) {
      return <ShoppingCartOutlined className="overview-service-icon icon-color-purple" />;
    }
    if (nameLower.includes('payment') || nameLower.includes('gateway')) {
      return <CreditCardOutlined className="overview-service-icon icon-color-green" />;
    }
    if (nameLower.includes('notification')) {
      return <BellOutlined className="overview-service-icon icon-color-orange" />;
    }
    return <SettingOutlined className="overview-service-icon icon-color-blue" />;
  };

  const sortedServices = useMemo(() => {
    let filtered = services;

    if (searchQuery && searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = services.filter(service =>
        service.name.toLowerCase().includes(query) ||
        service.type?.toLowerCase().includes(query)
      );
    }

    return filtered.sort((a, b) => {
      const statusPriorityA = getStatusPriority(a.status?.value);
      const statusPriorityB = getStatusPriority(b.status?.value);

      if (statusPriorityA !== statusPriorityB) {
        return statusPriorityA - statusPriorityB;
      }

      const avgLatencyA = a.metrics?.avgDurationMs || 0;
      const avgLatencyB = b.metrics?.avgDurationMs || 0;
      return avgLatencyB - avgLatencyA;
    });
  }, [services, searchQuery]);

  const displayServices = expanded ? sortedServices : sortedServices.slice(0, 2);
  const hasMore = sortedServices.length > 2;

  if (sortedServices.length === 0) {
    return null;
  }

  if (services.length === 0) {
    return null;
  }

  return (
    <Card
      className="overview-service-card"
      style={{ background: gradient }}
      bodyStyle={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1, overflow: 'visible' }}
    >
      <div className="overview-service-card-header">
        <Title
          level={4}
          className="overview-service-card-title"
          title={title}
        >
          {icon}
          {title}
        </Title>
        {hasMore && (
          <Button
            type="text"
            onClick={() => setExpanded(!expanded)}
            className="overview-service-expand-btn"
          >
            {expanded ? 'Less' : `More (+${sortedServices.length - 2})`}
          </Button>
        )}
      </div>
      <div className="overview-service-body">
        <div className="overview-card-grid" style={{
          gridTemplateColumns: expanded ? `repeat(${Math.ceil(sortedServices.length / 2)}, 240px)` : '240px',
        }}>
          {displayServices.map((service) => {
            const status = service.status?.value || 'unknown';
            const isSelected = service.id === selectedServiceId;
            const avgDurationMs = service.metrics?.avgDurationMs || 0;
            const callsPerSecond = service.metrics?.callsPerSecond || 0;

            return (
              <div
                key={service.id}
                className={`overview-service-item ${isSelected ? 'overview-card-bg-selected' : 'overview-card-bg-unselected'}`}
                onClick={() => onClick(service)}
              >
                <div className="overview-service-item-content">
                  <div className="overview-service-item-header">
                    <div className="overview-service-item-info">
                      <Avatar icon={getServiceIcon(service.name)} className="overview-service-avatar" />
                      <div className="overview-service-item-text">
                        <Text
                          className="overview-service-item-name overview-service-name"
                          title={service.name}
                        >
                          {service.name}
                        </Text>
                        <Text
                          className="overview-service-item-type overview-service-subtext"
                          title={service.type || 'Service'}
                        >
                          {service.type || 'Service'}
                        </Text>
                      </div>
                    </div>
                    <div className="overview-service-item-actions">
                      <Badge color={getStatusColor(status)} />
                      {showUnmap && onUnmap && (
                        <Tooltip title="Remove mapping">
                          <CloseCircleOutlined
                            onClick={(e) => {
                              e.stopPropagation();
                              onUnmap(service);
                            }}
                            className="overview-service-unmap-icon"
                          />
                        </Tooltip>
                      )}
                    </div>
                  </div>
                  <div className="overview-service-metrics">
                    <div>
                      <Text className="overview-service-metric-subtitle">
                        Avg Duration
                      </Text>
                      <Text className="overview-service-metric-val">
                        {formatDuration(avgDurationMs)}
                      </Text>
                    </div>
                    <div>
                      <Text className="overview-service-metric-subtitle">
                        Calls/sec
                      </Text>
                      <Text className="overview-service-metric-val">
                        {callsPerSecond.toFixed(2)}
                      </Text>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
};

export default ServiceCard;