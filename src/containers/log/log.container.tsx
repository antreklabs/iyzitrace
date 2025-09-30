import React from 'react';
import { LogsProps } from '../../interfaces/pages/logs/logs-props.interface';
import BaseContainerComponent from '../base.container';
import LogFilter from './log.filter';
import { lokiReadApi } from '../../providers/api/loki/loki.api.read';
import { LogsRequestModel } from '../../interfaces/pages/logs/logs.request.interface';

const LogContainer: React.FC<LogsProps> = (props) => {
  const { id, start, end } = props;

  // Loki'den veri çek, viewModelData'ya ekle
  const fetchModelData = async (params?: LogsProps & { filters?: any; range?: [number, number] }) => {
    // Console log incoming params and filters
    // Note: params can include runtime filters from the UI
    // eslint-disable-next-line no-console
    console.log('[LogContainer] fetchModelData params:', params);
    // eslint-disable-next-line no-console
    console.log('[LogContainer] fetchModelData filters:', params?.filters);

    const selectedService = params?.filters?.service;
    const selectedLevel = params?.filters?.level;

    // Use range from GrafanaLikeRangePicker if available, otherwise fallback to props or defaults
    const [rangeStart, rangeEnd] = params?.range || [start, end] || [Date.now() - 60 * 60 * 1000, Date.now()];

    // Basic Loki expr: constrain by service and level when available
    // Fallback to a generic selector if not provided
    const exprParts: string[] = [];
    if (selectedService) {
      exprParts.push(`service="${selectedService}"`);
    }
    const selector = `{${exprParts.join(',')}}`;

    const levelFilter = selectedLevel ? ` |= "${selectedLevel}"` : '';
    const expr = `${selector}${levelFilter}` || '{ }';

    const requestModel: LogsRequestModel = {
      datasourceUidOrName: 'loki',
      expr,
      start: rangeStart,
      end: rangeEnd,
      limit: 100,
      orderBy: 'timestamp',
      orderDirection: 'desc',
      interval: '1s',
      intervalMs: 1000,
      timezone: 'UTC',
      maxDataPoints: 1000,
    };

    try {
      // Call API with manual input (result is not yet wired to table data)
      const apiResult = await lokiReadApi.query(requestModel);
      // eslint-disable-next-line no-console
      console.log('[LogContainer] lokiReadApi.query result:', apiResult);

      return apiResult.logs;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('[LogContainer] lokiReadApi.query error:', e);
    }
    
    return [];
  };

  const expandedRowRender = (record: any) => {
    return (
      <div style={{ 
        padding: '16px', 
        backgroundColor: '#1f1f1f', 
        margin: '8px 0',
        border: '1px solid #434343',
        borderRadius: '6px'
      }}>
        <h4 style={{ marginBottom: '12px', color: '#1890ff', fontSize: '16px' }}>Log Details</h4>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <h5 style={{ color: '#fff', marginBottom: '8px', fontSize: '14px' }}>Basic Information</h5>
            <p style={{ color: '#d9d9d9', margin: '4px 0' }}><strong style={{ color: '#fff' }}>Log ID:</strong> {record.id}</p>
            <p style={{ color: '#d9d9d9', margin: '4px 0' }}><strong style={{ color: '#fff' }}>Timestamp:</strong> {new Date(record.timestamp).toLocaleString()}</p>
            <p style={{ color: '#d9d9d9', margin: '4px 0' }}><strong style={{ color: '#fff' }}>Level:</strong> 
              <span style={{ 
                color: record.level === 'ERROR' ? '#ff4d4f' : 
                       record.level === 'WARN' ? '#faad14' : 
                       record.level === 'INFO' ? '#52c41a' : '#1890ff',
                fontWeight: 'bold',
                marginLeft: '8px'
              }}>
                {record.level}
              </span>
            </p>
            <p style={{ color: '#d9d9d9', margin: '4px 0' }}><strong style={{ color: '#fff' }}>Service:</strong> {record.service}</p>
            <p style={{ color: '#d9d9d9', margin: '4px 0' }}><strong style={{ color: '#fff' }}>Duration:</strong> {record.duration}ms</p>
          </div>
          
          <div>
            <h5 style={{ color: '#fff', marginBottom: '8px', fontSize: '14px' }}>Trace Information</h5>
            <p style={{ color: '#d9d9d9', margin: '4px 0' }}><strong style={{ color: '#fff' }}>Trace ID:</strong> {record.traceId}</p>
            <p style={{ color: '#d9d9d9', margin: '4px 0' }}><strong style={{ color: '#fff' }}>Span ID:</strong> {record.spanId}</p>
            <p style={{ color: '#d9d9d9', margin: '4px 0' }}><strong style={{ color: '#fff' }}>Status:</strong> 
              <span style={{ 
                color: record.status === 'error' ? '#ff4d4f' : 
                       record.status === 'warning' ? '#faad14' : '#52c41a',
                fontWeight: 'bold',
                marginLeft: '8px'
              }}>
                {record.status}
              </span>
            </p>
          </div>
        </div>
        
        <div style={{ marginTop: '16px' }}>
          <h5 style={{ color: '#fff', marginBottom: '8px', fontSize: '14px' }}>Message</h5>
          <div style={{ 
            backgroundColor: '#262626', 
            padding: '12px', 
            border: '1px solid #434343', 
            borderRadius: '4px',
            fontFamily: 'monospace',
            fontSize: '14px',
            color: '#d9d9d9'
          }}>
            {record.message}
          </div>
        </div>
        
        <div style={{ marginTop: '16px' }}>
          <h5 style={{ color: '#fff', marginBottom: '8px', fontSize: '14px' }}>Tags</h5>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {Object.entries(record.tags).map(([key, value]) => (
              <span key={key} style={{
                backgroundColor: '#111b26',
                border: '1px solid #1890ff',
                borderRadius: '4px',
                padding: '4px 8px',
                fontSize: '12px',
                color: '#d9d9d9'
              }}>
                <strong style={{ color: '#1890ff' }}>{key}:</strong> {value as string}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const columns = [
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 180,
      render: (timestamp: string) => new Date(timestamp).toLocaleString(),
      sorter: (a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    },
    {
      title: 'Level',
      dataIndex: 'level',
      key: 'level',
      width: 80,
      render: (level: string) => (
        <span style={{
          color: level === 'ERROR' ? '#ff4d4f' : 
                 level === 'WARN' ? '#faad14' : 
                 level === 'INFO' ? '#52c41a' : '#1890ff',
          fontWeight: 'bold'
        }}>
          {level}
        </span>
      ),
      filters: [
        { text: 'ERROR', value: 'ERROR' },
        { text: 'WARN', value: 'WARN' },
        { text: 'INFO', value: 'INFO' },
        { text: 'DEBUG', value: 'DEBUG' },
      ],
      onFilter: (value: any, record: any) => record.level === value,
    },
    {
      title: 'Service',
      dataIndex: 'service',
      key: 'service',
      width: 150,
      render: (service: string) => (
        <span style={{ 
          backgroundColor: '#111b26', 
          color: '#1890ff',
          padding: '2px 8px', 
          borderRadius: '4px',
          fontSize: '12px',
          border: '1px solid #1890ff'
        }}>
          {service}
        </span>
      ),
    },
    {
      title: 'Message',
      dataIndex: 'message',
      key: 'message',
      ellipsis: true,
      render: (message: string) => (
        <span title={message} style={{ fontFamily: 'monospace', fontSize: '13px' }}>
          {message}
        </span>
      ),
    },
    {
      title: 'Duration',
      dataIndex: 'duration',
      key: 'duration',
      width: 100,
      render: (duration: number) => `${duration}ms`,
      sorter: (a: any, b: any) => a.duration - b.duration,
    },
    {
      title: 'Trace ID',
      dataIndex: 'traceId',
      key: 'traceId',
      width: 120,
      render: (traceId: string) => (
        <span style={{ 
          fontFamily: 'monospace', 
          fontSize: '12px',
          color: '#1890ff',
          cursor: 'pointer'
        }} title="Click to view trace">
          {traceId.substring(0, 12)}...
        </span>
      ),
    },
  ];

  return (
    <BaseContainerComponent
      title="Logs"
      id={id}
      start={start}
      end={end}
      onFetchData={fetchModelData}
      onExpandedRowRender={expandedRowRender}
      columns={columns}
      filterComponent={<LogFilter onChange={fetchModelData} collapsed={false} />}
      datasourceType="loki"
    />
  );
};

export default LogContainer;