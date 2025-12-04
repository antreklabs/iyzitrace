import React from 'react';
import { InlineField, Input } from '@grafana/ui';
import { Definitions } from '../../interfaces/options';

interface DefinitionsTableProps {
  value: Definitions;
  onChange: (definitions: Definitions) => void;
}

export const DEFAULT_DEFINITIONS: Definitions = {
  service_label_name: 'service_name',
  span_label_name: 'span_name',
  type_label_name: 'type',
  status_label_name: 'status_code',
  exception_type_label_name: 'exception_type',
  region_label_name: 'region_name',
  infrastructure_label_name: 'infrastructure_name',
  request_count_metric_name: 'iyzitrace_span_metrics_calls_total',
  sum_duration_ms_metric_name: 'iyzitrace_span_metrics_duration_milliseconds_sum',
  count_duration_ms_metric_name: 'iyzitrace_span_metrics_duration_milliseconds_count',
  bucket_duration_ms_metric_name: 'iyzitrace_span_metrics_duration_milliseconds_bucket',
  error_percentage_metric_name: 'http_client_duration_milliseconds_sum',
  p50_duration_metric_name: 'http_client_duration_milliseconds_sum',
  p75_duration_metric_name: 'http_client_duration_milliseconds_sum',
  p90_duration_metric_name: 'http_client_duration_milliseconds_sum',
  p95_duration_metric_name: 'http_client_duration_milliseconds_sum',
  p99_duration_metric_name: 'http_client_duration_milliseconds_sum',
  avg_duration_metric_name: 'http_client_duration_milliseconds_sum',
  
  duration_ms_label_name: 'duration_ms',
  http_method_label_name: 'http_method',
  http_url_label_name: 'http_url',
  net_host_port_label_name: 'net_host_port',
  client_label_name: 'client',
  client_operation_name_label_name: 'client_operation_name',
  server_label_name: 'server',
  server_operation_name_label_name: 'server_operation_name',
  service_graph_metric_name: 'iyzitrace_service_graph_request_total',

  apdex_min_threshold_seconds: '100',
  apdex_max_threshold_seconds: '400',
  error_status_code_value: 'STATUS_CODE_ERROR',
};

const DefinitionsTable: React.FC<DefinitionsTableProps> = ({ value, onChange }) => {
  const definitions = { ...DEFAULT_DEFINITIONS, ...(value || {}) };

  const handleChange = (key: keyof Definitions, newValue: string) => {
    onChange({
      ...definitions,
      [key]: newValue
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '200px 1fr',
        gap: '12px',
        padding: '12px',
        background: 'rgba(255,255,255,0.02)',
        borderRadius: 8,
        marginBottom: 8
      }}>
        <div style={{ fontWeight: 600, color: '#E5E7EB' }}>Label Names</div>
        <div style={{ fontWeight: 600, color: '#E5E7EB' }}>Value</div>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <InlineField label="service_label_name">
          <Input
            value={definitions.service_label_name}
            onChange={(e) => handleChange('service_label_name', e.currentTarget.value)}
            width={40}
          />
        </InlineField>
        <InlineField label="span_label_name">
          <Input
            value={definitions.span_label_name}
            onChange={(e) => handleChange('span_label_name', e.currentTarget.value)}
            width={40}
          />
        </InlineField>
        <InlineField label="type_label_name">
          <Input
            value={definitions.type_label_name}
            onChange={(e) => handleChange('type_label_name', e.currentTarget.value)}
            width={40}
          />
        </InlineField>
        <InlineField label="status_label_name">
          <Input
            value={definitions.status_label_name}
            onChange={(e) => handleChange('status_label_name', e.currentTarget.value)}
            width={40}
          />
        </InlineField>
        <InlineField label="exception_type_label_name">
          <Input
            value={definitions.exception_type_label_name}
            onChange={(e) => handleChange('exception_type_label_name', e.currentTarget.value)}
            width={40}
          />
        </InlineField>
        <InlineField label="region_label_name">
          <Input
            value={definitions.region_label_name}
            onChange={(e) => handleChange('region_label_name', e.currentTarget.value)}
            width={40}
          />
        </InlineField>
        <InlineField label="infrastructure_label_name">
          <Input
            value={definitions.infrastructure_label_name}
            onChange={(e) => handleChange('infrastructure_label_name', e.currentTarget.value)}
            width={40}
          />
        </InlineField>
        <InlineField label="duration_ms_label_name">
          <Input
            value={definitions.duration_ms_label_name}
            onChange={(e) => handleChange('duration_ms_label_name', e.currentTarget.value)}
            width={40}
          />
        </InlineField>
        <InlineField label="http_method_label_name">
          <Input
            value={definitions.http_method_label_name}
            onChange={(e) => handleChange('http_method_label_name', e.currentTarget.value)}
            width={40}
          />
        </InlineField>
        <InlineField label="http_url_label_name">
          <Input
            value={definitions.http_url_label_name}
            onChange={(e) => handleChange('http_url_label_name', e.currentTarget.value)}
            width={40}
          />
        </InlineField>
        <InlineField label="net_host_port_label_name">
          <Input
            value={definitions.net_host_port_label_name}
            onChange={(e) => handleChange('net_host_port_label_name', e.currentTarget.value)}
            width={40}
          />
        </InlineField>
        <InlineField label="client_label_name">
          <Input
            value={definitions.client_label_name}
            onChange={(e) => handleChange('client_label_name', e.currentTarget.value)}
            width={40}
          />
        </InlineField>
        <InlineField label="client_operation_name_label_name">
          <Input
            value={definitions.client_operation_name_label_name}
            onChange={(e) => handleChange('client_operation_name_label_name', e.currentTarget.value)}
            width={40}
          />
        </InlineField>
        <InlineField label="server_label_name">
          <Input
            value={definitions.server_label_name}
            onChange={(e) => handleChange('server_label_name', e.currentTarget.value)}
            width={40}
          />
        </InlineField>
        <InlineField label="server_operation_name_label_name">
          <Input
            value={definitions.server_operation_name_label_name}
            onChange={(e) => handleChange('server_operation_name_label_name', e.currentTarget.value)}
            width={40}
          />
        </InlineField>
        
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '200px 1fr',
        gap: '12px',
        padding: '12px',
        background: 'rgba(255,255,255,0.02)',
        borderRadius: 8,
        marginTop: 16,
        marginBottom: 8
      }}>
        <div style={{ fontWeight: 600, color: '#E5E7EB' }}>Metric Names</div>
        <div style={{ fontWeight: 600, color: '#E5E7EB' }}>Value</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <InlineField label="request_count_metric_name">
          <Input
            value={definitions.request_count_metric_name}
            onChange={(e) => handleChange('request_count_metric_name', e.currentTarget.value)}
            width={40}
          />
        </InlineField>
        <InlineField label="sum_duration_ms_metric_name">
          <Input
            value={definitions.sum_duration_ms_metric_name}
            onChange={(e) => handleChange('sum_duration_ms_metric_name', e.currentTarget.value)}
            width={40}
          />
        </InlineField>
        <InlineField label="count_duration_ms_metric_name">
          <Input
            value={definitions.count_duration_ms_metric_name}
            onChange={(e) => handleChange('count_duration_ms_metric_name', e.currentTarget.value)}
            width={40}
          />
        </InlineField>
        <InlineField label="bucket_duration_ms_metric_name">
          <Input
            value={definitions.bucket_duration_ms_metric_name}
            onChange={(e) => handleChange('bucket_duration_ms_metric_name', e.currentTarget.value)}
            width={40}
          />
        </InlineField>

        <InlineField label="service_graph_metric_name">
          <Input
            value={definitions.service_graph_metric_name}
            onChange={(e) => handleChange('service_graph_metric_name', e.currentTarget.value)}
            width={40}
          />
        </InlineField>
        <InlineField label="apdex_min_threshold_seconds">
          <Input
            value={definitions.apdex_min_threshold_seconds}
            onChange={(e) => handleChange('apdex_min_threshold_seconds', e.currentTarget.value)}
            width={40}
          />
        </InlineField>
        <InlineField label="apdex_max_threshold_seconds">
          <Input
            value={definitions.apdex_max_threshold_seconds}
            onChange={(e) => handleChange('apdex_max_threshold_seconds', e.currentTarget.value)}
            width={40}
          />
        </InlineField>
        <InlineField label="error_status_code_value">
          <Input
            value={definitions.error_status_code_value}
            onChange={(e) => handleChange('error_status_code_value', e.currentTarget.value)}
            width={40}
          />
        </InlineField>
        <InlineField label="error_percentage_metric_name">
          <Input
            value={definitions.error_percentage_metric_name}
            onChange={(e) => handleChange('error_percentage_metric_name', e.currentTarget.value)}
            width={40}
          />
        </InlineField>
        <InlineField label="p50_duration_metric_name">
          <Input
            value={definitions.p50_duration_metric_name}
            onChange={(e) => handleChange('p50_duration_metric_name', e.currentTarget.value)}
            width={40}
          />
        </InlineField>
        <InlineField label="p75_duration_metric_name">
          <Input
            value={definitions.p75_duration_metric_name}
            onChange={(e) => handleChange('p75_duration_metric_name', e.currentTarget.value)}
            width={40}
          />
        </InlineField>
        <InlineField label="p90_duration_metric_name">
          <Input
            value={definitions.p90_duration_metric_name}
            onChange={(e) => handleChange('p90_duration_metric_name', e.currentTarget.value)}
            width={40}
          />
        </InlineField>
        <InlineField label="p95_duration_metric_name">
          <Input
            value={definitions.p95_duration_metric_name}
            onChange={(e) => handleChange('p95_duration_metric_name', e.currentTarget.value)}
            width={40}
          />
        </InlineField>
        <InlineField label="p99_duration_metric_name">
          <Input
            value={definitions.p99_duration_metric_name}
            onChange={(e) => handleChange('p99_duration_metric_name', e.currentTarget.value)}
            width={40}
          />
        </InlineField>
        <InlineField label="avg_duration_metric_name">
          <Input
            value={definitions.avg_duration_metric_name}
            onChange={(e) => handleChange('avg_duration_metric_name', e.currentTarget.value)}
            width={40}
          />
        </InlineField>
      </div>
    </div>
  );
};

export default DefinitionsTable;

