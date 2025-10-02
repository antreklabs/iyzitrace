import React from 'react';
import { LogsProps } from '../../interfaces/pages/logs/logs-props.interface';
import BaseContainerComponent from '../base.container';
import LogFilter from './log.filter';
import { lokiReadApi } from '../../providers/api/loki/loki.api.read';
import { LogsRequestModel } from '../../interfaces/pages/logs/logs.request.interface';
import { getPageState } from '../../utils';
import { useLocation } from 'react-router-dom';

const LogContainer: React.FC<LogsProps> = (props) => {
  const getIntervalLabel = (intervalMs: number): string => {
    if (!intervalMs) return '1s';
    
    if (intervalMs >= 86400000) { // 24 saat
      return `${intervalMs / 86400000}d`;
    }
    if (intervalMs >= 3600000) { // 1 saat
      return `${intervalMs / 3600000}h`;
    }
    if (intervalMs >= 60000) { // 1 dakika
      return `${intervalMs / 60000}m`;
    }
    if (intervalMs >= 1000) { // 1 saniye
      return `${intervalMs / 1000}s`;
    }
    return `${intervalMs}ms`;
  };
  const { id } = props;
  const location = useLocation();
  const pageName = location.pathname.split('/').filter(Boolean).join('_') || 'home';

  // Loki'den veri çek, viewModelData'ya ekle
  const fetchModelData = async () => {
    // Get state from localStorage
    const pageState = getPageState(pageName);
    console.log('[LogContainer] pageState:', pageState);
    const selectedDataSourceUid = pageState?.selectedDataSourceUid;
    if (!selectedDataSourceUid) {
      console.warn('No datasource selected');
      return [];
    }
    const selectedFilters = pageState.filters.filters;
    const exprParts: string[] = [];
    exprParts.push(`service_namespace="opentelemetry-demo"`);

    const selectedService = selectedFilters?.serviceName;
    const selectedServiceNameOperator = selectedFilters?.serviceNameOperator;
    if (selectedService) {
      exprParts.push(`service_name${selectedServiceNameOperator}"${selectedService}"`);
    }
    // Apply level filter as a label selector instead of body search
    const selectedLevel = selectedFilters?.level;
    const levelOperator = selectedFilters?.levelOperator;
    if (selectedLevel) {
      exprParts.push(`level${levelOperator}"${selectedLevel}"`);
    }
    
    // Apply dynamic label filters
    const labelFilters = pageState.filters.labels || {};
    Object.values(labelFilters).forEach((labelFilter: any) => {
      if (labelFilter && labelFilter.name && labelFilter.value) {
        const labelName = labelFilter.name;
        const labelValues = Array.isArray(labelFilter.value) ? labelFilter.value : [labelFilter.value];
        
        if (labelValues.length > 0) {
          // For multiple values, use regex pattern
          if (labelValues.length === 1) {
            exprParts.push(`${labelName}="${labelValues[0]}"`);
          } else {
            const regexPattern = labelValues.map((val: string) => val.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
            exprParts.push(`${labelName}=~"${regexPattern}"`);
          }
        }
      }
    });
    
    const fieldExprParts: string[] = [];
    const selectedFields = pageState.filters.fields || {};
    Object.values(selectedFields).forEach((fieldFilter: any) => {
      if (fieldFilter && fieldFilter.name && fieldFilter.value) {
        const fieldName = fieldFilter.name;
        const fieldValues = Array.isArray(fieldFilter.value) ? fieldFilter.value : [fieldFilter.value];
        
        if (fieldValues.length > 0) {
          if (fieldValues.length === 1) {
            fieldExprParts.push(`${fieldName}="${fieldValues[0]}"`);
          } else {
            const regexPattern = fieldValues.map((val: string) => val.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
            fieldExprParts.push(`${fieldName}=~"${regexPattern}"`);
          }
        }
      }
    });

    const expr = `{${exprParts.join(',')}}${fieldExprParts.length > 0 ? ' | ' : ''}${fieldExprParts.join(' |')}`;
    console.log('[LogContainer] Final LogQL expression:', expr);
    
    // Build the final LogQL expression
    
    const selectedOptions = pageState.filters.options;
    const limit = selectedOptions.limit;
    const intervalMs = selectedOptions.interval;
    const interval = getIntervalLabel(intervalMs);
    const orderBy = selectedOptions.orderBy;
    const orderDirection = selectedOptions.orderDirection;
    const [rangeStart, rangeEnd] = pageState.range;

    const requestModel: LogsRequestModel = {
      expr,
      start: rangeStart,
      end: rangeEnd,
      limit: limit,
      orderBy: orderBy,
      orderDirection: orderDirection,
      interval: interval,
      intervalMs: intervalMs,
      timezone: 'UTC',
      maxDataPoints: 1000,
    };

    try {
      // Call API with manual input (result is not yet wired to table data)
      const apiResult = await lokiReadApi.query({...requestModel});
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
    // Extract attributes from record
    const attributes = record.attributes || {};

    // Basic fields with null checks
    const basicFields = [
      { label: 'Log ID', value: record.id },
      { label: 'Timestamp', value: record.timestamp ? new Date(record.timestamp).toLocaleString() : null },
      { label: 'Level', value: record.level || attributes.detected_level },
      { label: 'Service', value: record.service || attributes.service_name },
      { label: 'Service Instance ID', value: attributes.service_instance_id },
      { label: 'Service Namespace', value: attributes.service_namespace },
      { label: 'Service Version', value: attributes.service_version },
      { label: 'Process ID', value: attributes.process_pid },
      { label: 'Host Name', value: attributes.host_name },
      { label: 'Container ID', value: attributes.container_id?.substring(0, 12) }
    ].filter(field => field.value != null);

    // Runtime fields with null checks
    const runtimeFields = [
      { label: 'Runtime Name', value: attributes.process_runtime_name },
      { label: 'Runtime Version', value: attributes.process_runtime_version },
      { label: 'Runtime Description', value: attributes.process_runtime_description },
      { label: 'OS Type', value: attributes.os_type },
      { label: 'OS Description', value: attributes.os_description },
      { label: 'Architecture', value: attributes.host_arch }
    ].filter(field => field.value != null);

    // Telemetry fields with null checks
    const telemetryFields = [
      { label: 'Telemetry SDK', value: attributes.telemetry_sdk_name },
      { label: 'SDK Version', value: attributes.telemetry_sdk_version },
      { label: 'SDK Language', value: attributes.telemetry_sdk_language },
      { label: 'Distro Name', value: attributes.telemetry_distro_name },
      { label: 'Distro Version', value: attributes.telemetry_distro_version }
    ].filter(field => field.value != null);

    return (
      <div style={{ 
        padding: '16px', 
        backgroundColor: '#1f1f1f', 
        margin: '8px 0',
        border: '1px solid #434343',
        borderRadius: '6px'
      }}>
        {/* Message Section */}
        {record.message && (
          <div>
            <h5 style={{ color: '#fff', marginBottom: '8px', fontSize: '14px' }}>Message</h5>
            <div style={{ 
              backgroundColor: '#262626', 
              padding: '12px', 
              border: '1px solid #434343', 
              borderRadius: '4px',
              fontFamily: 'monospace',
              fontSize: '14px',
              color: '#d9d9d9',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}>
              {record.message}
            </div>
          </div>
        )}

        {/* Telemetry Information */}
        {telemetryFields.length > 0 && (
          <div style={{ marginTop: '16px' }}>
            <h5 style={{ color: '#fff', marginBottom: '8px', fontSize: '14px' }}>Telemetry Information</h5>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {telemetryFields.map(field => (
                <span key={field.label} style={{
                  backgroundColor: '#111b26',
                  border: '1px solid #1890ff',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  fontSize: '12px',
                  color: '#d9d9d9'
                }}>
                  <strong style={{ color: '#1890ff' }}>{field.label}:</strong> {field.value}
                </span>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '400px minmax(500px, 1fr)', gap: '16px', marginTop: '16px' }}>
          {/* Left Column: Basic Information and Runtime Information */}
          <div style={{ minWidth: '400px' }}>
            {/* Basic Information */}
            <div>
              <h5 style={{ color: '#fff', marginBottom: '8px', fontSize: '14px' }}>Basic Information</h5>
              {basicFields.map(field => (
                <p key={field.label} style={{ color: '#d9d9d9', margin: '4px 0' }}>
                  <strong style={{ color: '#fff' }}>{field.label}:</strong>
                  {field.label === 'Level' ? (
                    <span style={{ 
                      color: field.value === 'ERROR' ? '#ff4d4f' : 
                             field.value === 'WARN' ? '#faad14' : 
                             field.value === 'INFO' ? '#52c41a' : '#1890ff',
                      fontWeight: 'bold',
                      marginLeft: '8px'
                    }}>
                      {field.value}
                    </span>
                  ) : (
                    <span style={{ marginLeft: '8px' }}>{field.value}</span>
                  )}
                </p>
              ))}
            </div>

            {/* Runtime Information */}
            {runtimeFields.length > 0 && (
              <div style={{ marginTop: '16px' }}>
                <h5 style={{ color: '#fff', marginBottom: '8px', fontSize: '14px' }}>Runtime Information</h5>
                {runtimeFields.map(field => (
                  <p key={field.label} style={{ color: '#d9d9d9', margin: '4px 0' }}>
                    <strong style={{ color: '#fff' }}>{field.label}:</strong>
                    <span style={{ marginLeft: '8px' }}>{field.value}</span>
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Additional Attributes */}
          {Object.keys(attributes).length > 0 && (
            <div style={{ minWidth: '400px', maxWidth: '600px' }}>
              <h5 style={{ color: '#fff', marginBottom: '8px', fontSize: '14px' }}>Additional Attributes</h5>
              <div style={{ 
                backgroundColor: '#262626',
                border: '1px solid #434343',
                borderRadius: '4px',
                padding: '12px',
                maxHeight: '400px',
                overflowY: 'auto'
              }}>
                {Object.entries(attributes)
                  .filter(([key]) => !basicFields.some(f => f.value === attributes[key]) && 
                                   !runtimeFields.some(f => f.value === attributes[key]) && 
                                   !telemetryFields.some(f => f.value === attributes[key]))
                  .map(([key, value], index, array) => (
                    <div key={key} style={{
                      padding: '8px 0',
                      borderBottom: index < array.length - 1 ? '1px solid #434343' : 'none',
                      color: '#d9d9d9',
                      fontSize: '12px'
                    }}>
                      <div style={{ color: '#1890ff', marginBottom: '4px' }}>{key}</div>
                      <div style={{ 
                        wordBreak: 'break-all',
                        fontFamily: 'monospace'
                      }}>{value as string}</div>
                    </div>
                  ))}
              </div>
            </div>
          )}
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
    }
  ];

  const levels = ['ERROR', 'WARN', 'INFO', 'DEBUG'];

  return (
    <BaseContainerComponent
      title="Logs"
      id={id}
      onFetchData={fetchModelData}
      onExpandedRowRender={expandedRowRender}
      columns={columns}
      filterComponent={<LogFilter onChange={fetchModelData} collapsed={false} columns={columns} levels={levels} />}
      datasourceType="loki"
    />
  );
};

export default LogContainer;