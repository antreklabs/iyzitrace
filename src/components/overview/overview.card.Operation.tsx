import React, { useState, useMemo } from 'react';
import { Card, Badge, Typography, Avatar, Button } from 'antd';
import { 
  UnorderedListOutlined,
  UserOutlined,
  CheckCircleOutlined,
  EditOutlined,
  PlusOutlined,
  TruckOutlined
} from '@ant-design/icons';
import { Operation } from '../../api/service/interface.service';

const { Title, Text } = Typography;

interface OperationCardProps {
  operations: Operation[];
  title: string;
  onClick: (operation: Operation) => void;
  selectedOperationId?: string;
  searchQuery?: string;
}

const OperationCard: React.FC<OperationCardProps> = ({ 
  operations, 
  title, 
  onClick,
  selectedOperationId,
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

  const getOperationIcon = (operationName: string) => {
    const nameLower = operationName.toLowerCase();
    if (nameLower.includes('create') && nameLower.includes('user')) {
      return <UserOutlined style={{ fontSize: '18px', color: '#1890ff' }} />;
    }
    if (nameLower.includes('validate')) {
      return <CheckCircleOutlined style={{ fontSize: '18px', color: '#52c41a' }} />;
    }
    if (nameLower.includes('update') || nameLower.includes('profile')) {
      return <EditOutlined style={{ fontSize: '18px', color: '#722ed1' }} />;
    }
    if (nameLower.includes('create') && nameLower.includes('order')) {
      return <PlusOutlined style={{ fontSize: '18px', color: '#fa8c16' }} />;
    }
    if (nameLower.includes('ship')) {
      return <TruckOutlined style={{ fontSize: '18px', color: '#1890ff' }} />;
    }
    if (nameLower.includes('process') || nameLower.includes('payment')) {
      return <CheckCircleOutlined style={{ fontSize: '18px', color: '#f5222d' }} />;
    }
    return <UnorderedListOutlined style={{ fontSize: '18px', color: '#1890ff' }} />;
  };

  const sortedOperations = useMemo(() => {
    let filtered = operations;
    
    if (searchQuery && searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = operations.filter(operation => 
        operation.name.toLowerCase().includes(query) ||
        operation.type?.toLowerCase().includes(query)
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
  }, [operations, searchQuery]);

  const displayOperations = expanded ? sortedOperations : sortedOperations.slice(0, 2);
  const hasMore = sortedOperations.length > 2;

  if (sortedOperations.length === 0) {
    return null;
  }

  return (
    <Card
      style={{
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        border: '1px solid #333',
        background: '#1f1f1f',
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
            margin: 0,
            color: '#e8e8e8',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={title}
        >
        {title}
      </Title>
        {hasMore && (
          <Button
            type="default"
            onClick={() => setExpanded(!expanded)}
            style={{
              background: '#2a2a2a',
              borderColor: '#404040',
              color: '#b8b8b8',
              padding: '4px 12px',
              height: 'auto',
              fontWeight: 600,
              fontSize: '12px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#333';
              e.currentTarget.style.borderColor = '#555';
              e.currentTarget.style.color = '#e8e8e8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#2a2a2a';
              e.currentTarget.style.borderColor = '#404040';
              e.currentTarget.style.color = '#b8b8b8';
            }}
          >
            {expanded ? 'Less' : `More (+${sortedOperations.length - 2})`}
          </Button>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: expanded ? `repeat(${Math.ceil(sortedOperations.length / 2)}, 240px)` : '240px',
          gridTemplateRows: 'repeat(2, min-content)',
          gap: '8px',
          gridAutoFlow: 'column'
        }}>
          {displayOperations.map((operation) => {
          const status = operation.status?.value || 'unknown';
          const avgDurationMs = operation.metrics?.avgDurationMs || 0;
          const callsPerSecond = operation.metrics?.callsPerSecond || 0;
          const isSelected = operation.id === selectedOperationId;
          
          return (
            <div 
              key={operation.id}
              style={{ 
                border: 'none', 
                padding: '6px',
                cursor: 'pointer',
                backgroundColor: isSelected ? '#1890ff' : '#2a2a2a',
                borderRadius: '8px',
                transition: 'all 0.2s ease',
                overflow: 'hidden',
              }}
              onClick={() => onClick(operation)}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor = '#333';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor = '#2a2a2a';
                }
              }}
            >
              <div style={{ width: '100%', minWidth: 0, overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0, overflow: 'hidden' }}>
                    <Avatar icon={getOperationIcon(operation.name)} style={{ background: '#1f1f1f', border: '1px solid #404040', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                      <Text 
                        style={{ 
                          fontWeight: 600, 
                          display: 'block', 
                          color: isSelected ? 'white' : '#e8e8e8',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={operation.name}
                      >
                        {operation.name}
                      </Text>
                      <Text 
                        style={{ 
                          fontSize: '12px', 
                          color: isSelected ? 'rgba(255,255,255,0.7)' : '#8c8c8c',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          display: 'block',
                        }}
                        title={operation.type || 'Operation'}
                      >
                        {operation.type || 'Operation'}
                      </Text>
                    </div>
                  </div>
                  <Badge color={getStatusColor(status)} style={{ flexShrink: 0 }} />
                </div>
                <div style={{ display: 'flex', gap: '16px', paddingLeft: '44px' }}>
                  <div>
                    <Text style={{ fontSize: '11px', color: isSelected ? 'rgba(255,255,255,0.6)' : '#8c8c8c', display: 'block' }}>
                      Avg Duration
                    </Text>
                    <Text style={{ fontWeight: 600, fontSize: '13px', color: isSelected ? 'white' : '#b8b8b8' }}>
                      {formatDuration(avgDurationMs)}
                    </Text>
                  </div>
                  <div>
                    <Text style={{ fontSize: '11px', color: isSelected ? 'rgba(255,255,255,0.6)' : '#8c8c8c', display: 'block' }}>
                      Calls/sec
                    </Text>
                    <Text style={{ fontWeight: 600, fontSize: '13px', color: isSelected ? 'white' : '#b8b8b8' }}>
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

export default OperationCard;