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
      return <UserOutlined className="overview-operation-icon icon-color-blue" />;
    }
    if (nameLower.includes('validate')) {
      return <CheckCircleOutlined className="overview-operation-icon icon-color-green" />;
    }
    if (nameLower.includes('update') || nameLower.includes('profile')) {
      return <EditOutlined className="overview-operation-icon icon-color-purple" />;
    }
    if (nameLower.includes('create') && nameLower.includes('order')) {
      return <PlusOutlined className="overview-operation-icon icon-color-orange" />;
    }
    if (nameLower.includes('ship')) {
      return <TruckOutlined className="overview-operation-icon icon-color-blue" />;
    }
    if (nameLower.includes('process') || nameLower.includes('payment')) {
      return <CheckCircleOutlined className="overview-operation-icon icon-color-red" />;
    }
    return <UnorderedListOutlined className="overview-operation-icon icon-color-blue" />;
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
      className="overview-operation-card"
      bodyStyle={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1, overflow: 'visible' }}
    >
      <div className="overview-operation-card-header">
        <Title
          level={4}
          className="overview-operation-card-title"
          title={title}
        >
          {title}
        </Title>
        {hasMore && (
          <Button
            type="default"
            onClick={() => setExpanded(!expanded)}
            className="overview-operation-expand-btn"
          >
            {expanded ? 'Less' : `More (+${sortedOperations.length - 2})`}
          </Button>
        )}
      </div>
      <div className="overview-operation-body">
        <div className="overview-card-grid" style={{
          gridTemplateColumns: expanded ? `repeat(${Math.ceil(sortedOperations.length / 2)}, 240px)` : '240px',
        }}>
          {displayOperations.map((operation) => {
            const status = operation.status?.value || 'unknown';
            const avgDurationMs = operation.metrics?.avgDurationMs || 0;
            const callsPerSecond = operation.metrics?.callsPerSecond || 0;
            const isSelected = operation.id === selectedOperationId;

            return (
              <div
                key={operation.id}
                className={`overview-operation-item ${isSelected ? 'overview-operation-item--selected' : 'overview-operation-item--default'}`}
                onClick={() => onClick(operation)}
              >
                <div className="overview-operation-item-content">
                  <div className="overview-operation-item-header">
                    <div className="overview-operation-item-info">
                      <Avatar icon={getOperationIcon(operation.name)} className="overview-operation-avatar" />
                      <div className="overview-operation-item-text">
                        <Text
                          className={`overview-operation-item-name ${isSelected ? 'overview-card-text-selected' : 'overview-card-text-unselected'}`}
                          title={operation.name}
                        >
                          {operation.name}
                        </Text>
                        <Text
                          className={`overview-operation-item-type ${isSelected ? 'overview-card-subtext-selected' : 'overview-card-subtext-unselected'}`}
                          title={operation.type || 'Operation'}
                        >
                          {operation.type || 'Operation'}
                        </Text>
                      </div>
                    </div>
                    <Badge color={getStatusColor(status)} className="badge-no-shrink" />
                  </div>
                  <div className="overview-operation-metrics">
                    <div>
                      <Text className={`overview-operation-metric-subtitle ${isSelected ? 'overview-card-metric-subtitle-selected' : 'overview-card-metric-subtitle-unselected'}`}>
                        Avg Duration
                      </Text>
                      <Text className={`overview-operation-metric-val ${isSelected ? 'overview-card-metric-val-selected' : 'overview-card-metric-val-unselected'}`}>
                        {formatDuration(avgDurationMs)}
                      </Text>
                    </div>
                    <div>
                      <Text className={`overview-operation-metric-subtitle ${isSelected ? 'overview-card-metric-subtitle-selected' : 'overview-card-metric-subtitle-unselected'}`}>
                        Calls/sec
                      </Text>
                      <Text className={`overview-operation-metric-val ${isSelected ? 'overview-card-metric-val-selected' : 'overview-card-metric-val-unselected'}`}>
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