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
      return <SafetyCertificateOutlined style={{ fontSize: '20px', color: '#1890ff' }} />;
    }
    if (nameLower.includes('order') || nameLower.includes('processing')) {
      return <ShoppingCartOutlined style={{ fontSize: '20px', color: '#722ed1' }} />;
    }
    if (nameLower.includes('payment') || nameLower.includes('gateway')) {
      return <CreditCardOutlined style={{ fontSize: '20px', color: '#52c41a' }} />;
    }
    if (nameLower.includes('notification')) {
      return <BellOutlined style={{ fontSize: '20px', color: '#fa8c16' }} />;
    }
    return <SettingOutlined style={{ fontSize: '20px', color: '#1890ff' }} />;
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
      style={{
        borderRadius: '12px',
        background: gradient,
        border: 'none',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        height: '100%',
        minWidth: '300px',
        width: 'max-content',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'visible',
        transition: 'all 0.3s ease',
      }}
      bodyStyle={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1, overflow: 'visible' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <Title 
          level={4} 
          style={{ 
            color: 'white', 
            margin: 0,
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={title}
        >
        {icon}
        {title}
      </Title>
        {hasMore && (
          <Button
            type="text"
            onClick={() => setExpanded(!expanded)}
            style={{
              color: 'white',
              fontWeight: 600,
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              padding: '4px 12px',
              height: 'auto',
              fontSize: '12px',
            }}
          >
            {expanded ? 'Less' : `More (+${sortedServices.length - 2})`}
          </Button>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: expanded ? `repeat(${Math.ceil(sortedServices.length / 2)}, 240px)` : '240px',
          gridTemplateRows: 'repeat(2, min-content)',
          gap: '8px',
          gridAutoFlow: 'column'
        }}>
          {displayServices.map((service) => {
          const status = service.status?.value || 'unknown';
          const isSelected = service.id === selectedServiceId;
          const avgDurationMs = service.metrics?.avgDurationMs || 0;
          const callsPerSecond = service.metrics?.callsPerSecond || 0;
          
          return (
            <div 
              key={service.id}
              style={{ 
                border: 'none', 
                padding: '6px',
                cursor: 'pointer',
                backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                borderRadius: '8px',
                transition: 'all 0.2s ease',
                overflow: 'hidden',
              }}
              onClick={() => onClick(service)}
            >
              <div style={{ width: '100%', minWidth: 0, overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0, overflow: 'hidden' }}>
                    <Avatar icon={getServiceIcon(service.name)} style={{ background: 'rgba(255,255,255,0.2)', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                      <Text 
                        style={{ 
                          color: 'white', 
                          fontWeight: 600, 
                          display: 'block',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={service.name}
                      >
                        {service.name}
                      </Text>
                      <Text 
                        style={{ 
                          color: 'rgba(255,255,255,0.7)', 
                          fontSize: '12px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          display: 'block',
                        }}
                        title={service.type || 'Service'}
                      >
                        {service.type || 'Service'}
                      </Text>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              <Badge color={getStatusColor(status)} />
                    {showUnmap && onUnmap && (
                      <Tooltip title="Remove mapping">
                        <CloseCircleOutlined
                          onClick={(e) => {
                            e.stopPropagation();
                            onUnmap(service);
                          }}
                          style={{
                            color: 'rgba(255,255,255,0.6)',
                            fontSize: '16px',
                            cursor: 'pointer',
                            transition: 'color 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = '#ff4d4f';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
                          }}
                        />
                      </Tooltip>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '16px', paddingLeft: '44px' }}>
                  <div>
                    <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px', display: 'block' }}>
                      Avg Duration
                    </Text>
                    <Text style={{ color: 'white', fontWeight: 600, fontSize: '13px' }}>
                      {formatDuration(avgDurationMs)}
                    </Text>
                  </div>
                  <div>
                    <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px', display: 'block' }}>
                      Calls/sec
                    </Text>
                    <Text style={{ color: 'white', fontWeight: 600, fontSize: '13px' }}>
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