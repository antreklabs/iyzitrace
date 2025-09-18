import React, { useState, useMemo, useEffect } from 'react';
import { Card, Input, Select, Button, Space, Typography, Collapse, Tag } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { LogFilter, LogEntry } from '../../interfaces/logs.interface';

const { Title, Text } = Typography;
const { Option } = Select;

interface LogFiltersProps {
  filters: LogFilter[];
  logs: LogEntry[];
  onFiltersChange: (filters: LogFilter[]) => void;
  onSearch: () => void;
}

const LogFilters: React.FC<LogFiltersProps> = ({ filters, logs, onFiltersChange, onSearch }) => {
  const [newFilter, setNewFilter] = useState<LogFilter>({
    key: '',
    value: '',
    operator: 'equals'
  });
  // Filtreler değiştiğinde arama işlemini tetikle
  useEffect(() => {
    // İlk render'da tetikleme (filters.length > 0)
    onSearch();
  }, [filters]); // onSearch dependency'sini kaldırdık

  const filterKeys = [
    'service',
    'level',
    'environment',
    'namespace',
    'cluster',
    'hostname',
    'pod',
    'deployment',
    'http.method',
    'http.status_code',
    'user.id',
    'request.duration_ms',
    'memory.usage_mb',
    'cpu.usage_percent'
  ];

  const operators = [
    { value: 'equals', label: 'Equals' },
    { value: 'contains', label: 'Contains' },
    { value: 'regex', label: 'Regex' },
    { value: 'exists', label: 'Exists' },
    { value: 'not_exists', label: 'Not Exists' }
  ];

  // Gerçek verilerden dinamik label'lar oluştur
  const dynamicLabels = useMemo(() => {
    const services = new Set<string>();
    const levels = new Set<string>();
    const environments = new Set<string>();

    logs.forEach(log => {
      if (log.service) services.add(log.service);
      if (log.level) levels.add(log.level);
      if (log.environment) environments.add(log.environment);
    });

    return {
      services: Array.from(services).sort(),
      levels: Array.from(levels).sort(),
      environments: Array.from(environments).sort()
    };
  }, [logs]);

  const addFilter = () => {
    if (newFilter.key && newFilter.value) {
      const newFilters = [...filters, newFilter];
      console.log('LogFilters - Adding filter:', newFilter);
      console.log('LogFilters - New filters array:', newFilters);
      onFiltersChange(newFilters);
      setNewFilter({ key: '', value: '', operator: 'equals' });
      // useEffect otomatik olarak arama işlemini tetikleyecek
    }
  };

  const removeFilter = (index: number) => {
    onFiltersChange(filters.filter((_, i) => i !== index));
    // useEffect otomatik olarak arama işlemini tetikleyecek
  };

  const getFilterLabel = (filter: LogFilter) => {
    return `${filter.key} ${filter.operator} ${filter.value}`;
  };

  return (
    <div>
      <Title level={5} style={{ color: 'white', marginBottom: '16px' }}>
        Filters
      </Title>

      {/* Active Filters */}
      {filters.length > 0 && (
        <Card 
          size="small" 
          style={{ 
            background: '#1f1f1f', 
            border: '1px solid #262626',
            marginBottom: '16px'
          }}
        >
          <Text style={{ color: '#8c8c8c', fontSize: '12px' }}>Active Filters</Text>
          <div style={{ marginTop: '8px' }}>
            {filters.map((filter, index) => (
              <Tag
                key={index}
                closable
                onClose={() => removeFilter(index)}
                style={{ margin: '2px', background: '#262626', color: 'white' }}
              >
                {getFilterLabel(filter)}
              </Tag>
            ))}
          </div>
        </Card>
      )}

      {/* Add New Filter */}
      <Card 
        size="small" 
        style={{ 
          background: '#1f1f1f', 
          border: '1px solid #262626'
        }}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Select
            placeholder="Select field"
            value={newFilter.key}
            onChange={(value) => setNewFilter({...newFilter, key: value})}
            style={{ width: '100%' }}
            size="small"
          >
            {filterKeys.map(key => (
              <Option key={key} value={key}>{key}</Option>
            ))}
          </Select>

          <Select
            placeholder="Select operator"
            value={newFilter.operator}
            onChange={(value) => setNewFilter({...newFilter, operator: value as any})}
            style={{ width: '100%' }}
            size="small"
          >
            {operators.map(op => (
              <Option key={op.value} value={op.value}>{op.label}</Option>
            ))}
          </Select>

          <Input
            placeholder="Enter value"
            value={newFilter.value}
            onChange={(e) => setNewFilter({...newFilter, value: e.target.value})}
            size="small"
            onPressEnter={addFilter}
          />

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={addFilter}
            size="small"
            style={{ width: '100%' }}
            disabled={!newFilter.key || !newFilter.value}
          >
            Add Filter
          </Button>
        </Space>
      </Card>

      {/* Quick Filters */}
      <div style={{ marginTop: '16px' }}>
        <Text style={{ color: '#8c8c8c', fontSize: '12px' }}>Quick Filters</Text>
        <Collapse
          ghost
          size="small"
          style={{ marginTop: '8px' }}
          items={[
            {
              key: 'service',
              label: `Service Name (${dynamicLabels.services.length})`,
              children: (
                <Space wrap>
                  {dynamicLabels.services.length > 0 ? (
                    dynamicLabels.services.map(service => (
                      <Tag
                        key={service}
                        style={{ cursor: 'pointer', background: '#262626', color: 'white' }}
                        onClick={() => {
                          const filter: LogFilter = {
                            key: 'service',
                            value: service,
                            operator: 'equals'
                          };
                          const newFilters = [...filters, filter];
                          console.log('LogFilters - Quick filter clicked:', filter);
                          console.log('LogFilters - New filters array:', newFilters);
                          onFiltersChange(newFilters);
                          // useEffect otomatik olarak arama işlemini tetikleyecek
                        }}
                      >
                        {service}
                      </Tag>
                    ))
                  ) : (
                    <Text style={{ color: '#8c8c8c', fontSize: '12px' }}>
                      No service data available
                    </Text>
                  )}
                </Space>
              )
            },
            {
              key: 'level',
              label: `Log Level (${dynamicLabels.levels.length})`,
              children: (
                <Space wrap>
                  {dynamicLabels.levels.length > 0 ? (
                    dynamicLabels.levels.map(level => (
                      <Tag
                        key={level}
                        color={level === 'ERROR' ? 'red' : level === 'WARN' ? 'orange' : level === 'INFO' ? 'green' : level === 'DEBUG' ? 'blue' : 'default'}
                        style={{ cursor: 'pointer' }}
                        onClick={() => {
                          const filter: LogFilter = {
                            key: 'level',
                            value: level,
                            operator: 'equals'
                          };
                          onFiltersChange([...filters, filter]);
                          // useEffect otomatik olarak arama işlemini tetikleyecek
                        }}
                      >
                        {level}
                      </Tag>
                    ))
                  ) : (
                    <Text style={{ color: '#8c8c8c', fontSize: '12px' }}>
                      No level data available
                    </Text>
                  )}
                </Space>
              )
            },
            {
              key: 'environment',
              label: `Environment (${dynamicLabels.environments.length})`,
              children: (
                <Space wrap>
                  {dynamicLabels.environments.length > 0 ? (
                    dynamicLabels.environments.map(env => (
                      <Tag
                        key={env}
                        style={{ cursor: 'pointer', background: '#262626', color: 'white' }}
                        onClick={() => {
                          const filter: LogFilter = {
                            key: 'environment',
                            value: env,
                            operator: 'equals'
                          };
                          onFiltersChange([...filters, filter]);
                          // useEffect otomatik olarak arama işlemini tetikleyecek
                        }}
                      >
                        {env}
                      </Tag>
                    ))
                  ) : (
                    <Text style={{ color: '#8c8c8c', fontSize: '12px' }}>
                      No environment data available
                    </Text>
                  )}
                </Space>
              )
            }
          ]}
        />
      </div>
    </div>
  );
};

export default LogFilters;
