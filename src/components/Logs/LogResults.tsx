import React, { useState } from 'react';
import { Card, Table, Tag, Typography, Space, Button, Tooltip, Empty, Spin, Collapse } from 'antd';
import { EyeOutlined, CopyOutlined, LinkOutlined, ExpandOutlined } from '@ant-design/icons';
import { LogEntry } from '../../interfaces/logs.interface';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

const { Text } = Typography;
const { Panel } = Collapse;

interface LogResultsProps {
  logs: LogEntry[];
  loading: boolean;
  getLevelColor: (level: LogEntry['level']) => string;
}

const LogResults: React.FC<LogResultsProps> = ({ logs, loading, getLevelColor }) => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  const toggleRowExpansion = (logId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId);
    } else {
      newExpanded.add(logId);
    }
    setExpandedRows(newExpanded);
  };

  const expandAllRows = () => {
    const allLogIds = new Set(logs.map(log => log.id));
    setExpandedRows(allLogIds);
  };

  const collapseAllRows = () => {
    setExpandedRows(new Set());
  };

  const handleTraceClick = (traceId: string) => {
    // Grafana plugin URL yapısını kullan - trace ID'yi path'in sonuna ekle
    navigate(`/a/iyzitrace-app/traces/${traceId}`);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatTimestamp = (timestamp: string) => {
    return dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss.SSS');
  };

  const columns = [
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 180,
      render: (timestamp: string) => (
        <Text style={{ color: '#8c8c8c', fontSize: '12px' }}>
          {formatTimestamp(timestamp)}
        </Text>
      ),
    },
    {
      title: 'Level',
      dataIndex: 'level',
      key: 'level',
      width: 80,
      render: (level: LogEntry['level']) => (
        <Tag color={getLevelColor(level)} style={{ margin: 0 }}>
          {level}
        </Tag>
      ),
    },
    {
      title: 'Service',
      dataIndex: 'service',
      key: 'service',
      width: 120,
      render: (service: string) => (
        <Tag style={{ background: '#262626', color: 'white', margin: 0 }}>
          {service}
        </Tag>
      ),
    },
    {
      title: 'Message',
      dataIndex: 'message',
      key: 'message',
      ellipsis: true,
      render: (message: string, record: LogEntry) => (
        <div>
          <Text style={{ color: 'white' }}>
            {message}
          </Text>
          {record.traceId && (
            <div style={{ marginTop: '4px' }}>
              <Tag 
                style={{ 
                  background: '#1890ff', 
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
                onClick={() => handleTraceClick(record.traceId!)}
              >
                <LinkOutlined /> Trace: {record.traceId.substring(0, 8)}...
              </Tag>
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_: any, record: LogEntry) => (
        <Space>
          <Tooltip title="View Details">
            <Button
              type="text"
              icon={<EyeOutlined />}
              size="small"
              onClick={() => toggleRowExpansion(record.id)}
              style={{ color: '#1890ff' }}
            />
          </Tooltip>
          <Tooltip title="Copy Log">
            <Button
              type="text"
              icon={<CopyOutlined />}
              size="small"
              onClick={() => copyToClipboard(JSON.stringify(record, null, 2))}
              style={{ color: '#1890ff' }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const expandedRowRender = (record: LogEntry) => (
    <Card 
      size="small" 
      style={{ 
        background: '#1f1f1f', 
        border: '1px solid #262626',
        margin: '8px 0'
      }}
    >
      <Collapse ghost size="small">
        <Panel header="Attributes" key="attributes">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
            {Object.entries(record.attributes).map(([key, value]) => (
              <div key={key} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text style={{ color: '#8c8c8c', fontSize: '12px' }}>{key}:</Text>
                <Text style={{ color: 'white', fontSize: '12px' }}>{String(value)}</Text>
              </div>
            ))}
          </div>
        </Panel>
        
        <Panel header="Metadata" key="metadata">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
            {record.hostname && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text style={{ color: '#8c8c8c', fontSize: '12px' }}>Hostname:</Text>
                <Text style={{ color: 'white', fontSize: '12px' }}>{record.hostname}</Text>
              </div>
            )}
            {record.environment && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text style={{ color: '#8c8c8c', fontSize: '12px' }}>Environment:</Text>
                <Text style={{ color: 'white', fontSize: '12px' }}>{record.environment}</Text>
              </div>
            )}
            {record.namespace && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text style={{ color: '#8c8c8c', fontSize: '12px' }}>Namespace:</Text>
                <Text style={{ color: 'white', fontSize: '12px' }}>{record.namespace}</Text>
              </div>
            )}
            {record.pod && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text style={{ color: '#8c8c8c', fontSize: '12px' }}>Pod:</Text>
                <Text style={{ color: 'white', fontSize: '12px' }}>{record.pod}</Text>
              </div>
            )}
            {record.cluster && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text style={{ color: '#8c8c8c', fontSize: '12px' }}>Cluster:</Text>
                <Text style={{ color: 'white', fontSize: '12px' }}>{record.cluster}</Text>
              </div>
            )}
          </div>
        </Panel>

        <Panel header="Raw JSON" key="raw">
          <pre style={{ 
            background: '#0a0a0a', 
            padding: '12px', 
            borderRadius: '4px',
            color: '#8c8c8c',
            fontSize: '12px',
            overflow: 'auto',
            maxHeight: '200px'
          }}>
            {JSON.stringify(record, null, 2)}
          </pre>
        </Panel>
      </Collapse>
    </Card>
  );

  if (loading) {
    return (
      <Card style={{ background: '#1f1f1f', border: '1px solid #262626' }}>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin size="large" />
          <div style={{ marginTop: '16px' }}>
            <Text style={{ color: '#8c8c8c' }}>Searching logs...</Text>
          </div>
        </div>
      </Card>
    );
  }

  if (logs.length === 0) {
    return (
      <Card style={{ background: '#1f1f1f', border: '1px solid #262626' }}>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <div>
              <Text style={{ color: '#8c8c8c' }}>No logs found</Text>
              <div style={{ marginTop: '8px' }}>
                <Text style={{ color: '#8c8c8c', fontSize: '12px' }}>
                  Try adjusting your search criteria or time range
                </Text>
              </div>
            </div>
          }
        />
      </Card>
    );
  }

  return (
    <Card 
      style={{ 
        background: '#1f1f1f', 
        border: '1px solid #262626',
        overflow: 'auto'
      }}
    >
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ color: 'white' }}>
          Found {logs.length} logs
        </Text>
        <Space>
          <Button 
            type="primary" 
            icon={<ExpandOutlined />}
            size="small"
            onClick={expandedRows.size === logs.length ? collapseAllRows : expandAllRows}
          >
            {expandedRows.size === logs.length ? 'Collapse All' : 'Expand All'}
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={logs}
        rowKey="id"
        pagination={{
          pageSize: 50,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} logs`,
          style: { color: 'white' }
        }}
        expandable={{
          expandedRowRender,
          expandedRowKeys: Array.from(expandedRows),
          onExpandedRowsChange: (expandedKeys) => {
            setExpandedRows(new Set(expandedKeys as string[]));
          },
          rowExpandable: () => true,
        }}
        style={{ 
          background: '#1f1f1f',
          color: 'white'
        }}
        size="small"
        scroll={{ x: 'max-content', y: 400 }}
      />
    </Card>
  );
};

export default LogResults;
