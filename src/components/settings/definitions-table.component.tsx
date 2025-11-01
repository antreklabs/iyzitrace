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
  status_label_name: 'status',
  exception_type_label_name: 'exception_type',
  region_label_name: 'region_name',
  infrastructure_label_name: 'infrastructure_name',
  request_count_metric_name: 'iyzitrace_span_metrics_calls_total',
  avg_latency_metric_name: 'http_client_duration_milliseconds_sum',
  min_latency_metric_name: 'http_client_duration_milliseconds_sum',
  max_latency_metric_name: 'http_client_duration_milliseconds_sum',
  error_percentage_metric_name: 'http_client_duration_milliseconds_sum',
  p50_duration_metric_name: 'http_client_duration_milliseconds_sum',
  p75_duration_metric_name: 'http_client_duration_milliseconds_sum',
  p90_duration_metric_name: 'http_client_duration_milliseconds_sum',
  p95_duration_metric_name: 'http_client_duration_milliseconds_sum',
  p99_duration_metric_name: 'http_client_duration_milliseconds_sum',
  avg_duration_metric_name: 'http_client_duration_milliseconds_sum',
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
        <InlineField label="avg_latency_metric_name">
          <Input
            value={definitions.avg_latency_metric_name}
            onChange={(e) => handleChange('avg_latency_metric_name', e.currentTarget.value)}
            width={40}
          />
        </InlineField>
        <InlineField label="min_latency_metric_name">
          <Input
            value={definitions.min_latency_metric_name}
            onChange={(e) => handleChange('min_latency_metric_name', e.currentTarget.value)}
            width={40}
          />
        </InlineField>
        <InlineField label="max_latency_metric_name">
          <Input
            value={definitions.max_latency_metric_name}
            onChange={(e) => handleChange('max_latency_metric_name', e.currentTarget.value)}
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

