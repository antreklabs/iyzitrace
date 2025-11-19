import React, { useEffect, useState, useCallback } from 'react';
import { Select, Input, Button, Divider, Form, Row, Col, Space } from 'antd';
import { MinusOutlined, PlusOutlined } from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import '../assets/styles/base/base.filter.css';
import { DropdownOption, getPrometheusLabels, getPrometheusLabelValues, getPrometheusLokiLevels, getPrometheusOperations, getPrometheusOperationTypes, getPrometheusServices, getPrometheusTraceStatuses } from '../api/service/list.service';

export const { Option } = Select;
export const OPERATOR_OPTIONS = ['=', '!=', '>', '<', 'contains', 'regex'];
export const EQUAL_OPERATOR_OPTIONS = ['=', '!='];

interface BaseFilterProps {
  children?: React.ReactNode;
  hasServiceFilter?: boolean;
  hasOperationsFilter?: boolean;
  hasStatusesFilter?: boolean;
  hasDurationFilter?: boolean;
  hasTagsFilter?: boolean;
  hasOptionsFilter?: boolean;
  hasLabelsFilter?: boolean;
  hasFieldsFilter?: boolean;
  hasTypesFilter?: boolean;
  hasLevelsFilter?: boolean;
  columns?: any[];
  data?: any[];
}

const BaseFilter: React.FC<BaseFilterProps> = ({ 
  children,
  hasServiceFilter = false,
  hasOperationsFilter = false,
  hasStatusesFilter = false,
  hasDurationFilter = false,
  hasTagsFilter = false,
  hasLabelsFilter = false,
  hasOptionsFilter = false,
  hasFieldsFilter = false,
  hasTypesFilter = false,
  hasLevelsFilter = false,
  columns,
  data
}) => {
  const [services, setServices] = useState<DropdownOption[]>([]);
  const [types, setTypes] = useState<DropdownOption[]>([]);
  const [labels, setLabels] = useState<DropdownOption[]>([]);
  const [operations, setOperations] = useState<DropdownOption[]>([]);
  const [statuses, setStatuses] = useState<DropdownOption[]>([]);
  const [levels, setLevels] = useState<DropdownOption[]>([]);
  const [fields, setFields] = useState<DropdownOption[]>([]);
  const [labelFilters, setLabelFilters] = useState<Array<{id: string, label: string, values: string[]}>>([]);
  const [fieldFilters, setFieldFilters] = useState<Array<{id: string, field: string, values: string[]}>>([]);
  const [form] = Form.useForm();
  const location = useLocation();
  const navigate = useNavigate();

  const fetchLists = useCallback(async () => {
    if (hasServiceFilter) {
      const services = await getPrometheusServices();
      setServices(services);
    }
    if (hasTypesFilter) {
      const types = await getPrometheusOperationTypes();
      setTypes(types);
    }
    if (hasLabelsFilter) {
      const labels = await getPrometheusLabels();
      setLabels(labels);
    }
    if (hasOperationsFilter) {
      const operations = await getPrometheusOperations();
      setOperations(operations);
    }
    if (hasStatusesFilter) {
      const statuses = await getPrometheusTraceStatuses();
      setStatuses(statuses);
    }
    if (hasLevelsFilter) {
      const levels = await getPrometheusLokiLevels();
      setLevels(levels);
    }
  }, [hasServiceFilter, hasLabelsFilter, hasOperationsFilter, hasStatusesFilter, hasTypesFilter, hasLevelsFilter]);

  const extractFieldsFromData = (data: any[]) => {
    if (!data || data.length === 0) {
      return;
    }
    
    const fieldNames = new Set<string>();
    data.forEach(item => {
      // Check both attributes and direct properties
      if (item.attributes) {
        Object.keys(item.attributes).forEach(key => fieldNames.add(key));
      } else {
        // Extract from direct properties (for service map data)
        Object.keys(item).forEach(key => {
            fieldNames.add(key);
        });
      }
    });
    
    const extractedFields = Array.from(fieldNames);
    if (extractedFields.length > 0) {
      setFields(extractedFields.map(field => new DropdownOption(field)));
    }
  };

  // Function to extract field values from grid data
  const extractFieldValuesFromData = (data: any[], fieldName: string) => {
    if (!data || data.length === 0) {
      return [];
    }
    
    const fieldValues = new Set<string>();
    data.forEach(item => {
      let value = null;
      
      // Check both attributes and direct properties
      if (item.attributes && item.attributes[fieldName]) {
        value = item.attributes[fieldName];
      } else if (item[fieldName] !== undefined) {
        value = item[fieldName];
      }
      
      if (value !== null && (typeof value === 'string' || typeof value === 'number')) {
          fieldValues.add(String(value));
      }
    });
    
    return Array.from(fieldValues);
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      // timeSrv/DS sync için 1 frame beklet
      await new Promise(r => requestAnimationFrame(() => r(null)));
  
      if (alive && (hasServiceFilter || hasTypesFilter || hasLabelsFilter || hasOperationsFilter || hasStatusesFilter || hasLevelsFilter)) {
        await fetchLists();
      }
    })();
    return () => { alive = false; };
  }, [fetchLists, hasServiceFilter, hasLabelsFilter, hasOperationsFilter, hasStatusesFilter, hasTypesFilter, hasLevelsFilter]);

  // Extract fields from grid data when data changes
  useEffect(() => {
    if (hasFieldsFilter && data && Array.isArray(data) && data.length > 0) {
      extractFieldsFromData(data);
      
      // Also update field values for existing field filters
      fieldFilters.forEach(filter => {
        if (filter.field) {
          const values = extractFieldValuesFromData(data, filter.field);
          setFieldFilters(prev => prev.map(f => 
            f.id === filter.id 
              ? { ...f, values: values }
              : f
          ));
        }
      });
    }
  }, [data, hasFieldsFilter, fieldFilters]);

  // Load filters from URL on mount and clear when URL changes
  useEffect(() => {
    const loadFiltersFromURL = () => {
      const searchParams = new URLSearchParams(location.search);
      const filters: any = {};
      
      // Load time range
      const fromParam = searchParams.get('from');
      const toParam = searchParams.get('to');
      if (fromParam && toParam) {
        // Convert long format (timestamp) to readable format
        const fromTimestamp = parseInt(fromParam);
        const toTimestamp = parseInt(toParam);
        
        filters.timeRange = {
          from: fromTimestamp,
          to: toTimestamp
        };
      }
      
      // Initialize filters object
      filters.filters = {};
      
      // Load basic filters - only if they exist in URL
      if (searchParams.get('serviceName')) {
        const serviceName = searchParams.get('serviceName');
        filters.filters.serviceName = serviceName;
        filters.filters.serviceNameOperator = searchParams.get('serviceNameOperator') || '=';
        
        // URL'den gelen service name'i services listesine ekle (eğer yoksa)
        if (serviceName && !services.some(item => item.value === serviceName)) {
          setServices(prev => [...prev, new DropdownOption(serviceName)]);
        }
      }
      else {
        filters.filters.serviceName = undefined;
      }
      
      if (searchParams.get('type')) {
        const type = searchParams.get('type');
        filters.filters.type = type;
        filters.filters.typeOperator = searchParams.get('typeOperator') || '=';
        
        // URL'den gelen type'ı types listesine ekle (eğer yoksa)
        if (type && !types.some(item => item.value === type)) {
          setTypes(prev => [...prev, new DropdownOption(type)]);
        }
      }
      else {
        filters.filters.type = undefined;
      }
      
      if (searchParams.get('operationName')) {
        const operationName = searchParams.get('operationName');
        filters.filters.operationName = operationName;
        filters.filters.operationNameOperator = searchParams.get('operationNameOperator') || '=';
        
        // URL'den gelen operation name'i operations listesine ekle (eğer yoksa)
        if (operationName && !operations.some(item => item.value === operationName)) {
          setOperations(prev => [...prev, new DropdownOption(operationName)]);
        }
      }
      else {
        filters.filters.operationName = undefined;
      }

      if (searchParams.get('status')) {
        const status = searchParams.get('status');
        filters.filters.status = status;
        filters.filters.statusOperator = searchParams.get('statusOperator') || '=';
        
        // URL'den gelen status'u statuses listesine ekle (eğer yoksa)
        if (status && !statuses.some(item => item.value === status)) {
          setStatuses(prev => [...prev, new DropdownOption(status)]);
        }
      }
      else {
        filters.filters.status = undefined;
      }

      if (searchParams.get('level')) {
        const level = searchParams.get('level');
        filters.filters.level = level;
        filters.filters.levelOperator = searchParams.get('levelOperator') || '=';
        
        // URL'den gelen level'ı levels listesine ekle (eğer yoksa)
        if (level && !levels.some(item => item.value === level)) {
          setLevels(prev => [...prev, new DropdownOption(level)]);
        }
      }
      else {
        filters.filters.level = undefined;
      }

      if (searchParams.get('durationMin')) {
        filters.filters.durationMin = searchParams.get('durationMin');
      }
      else {
        filters.filters.durationMin = undefined;
      }
      
      if (searchParams.get('durationMax')) {
        filters.filters.durationMax = searchParams.get('durationMax');
      }
      else {
        filters.filters.durationMax = undefined;
      }

      if (searchParams.get('tagKey')) {
        filters.filters.tagKey = searchParams.get('tagKey');
        filters.filters.tagOperator = searchParams.get('tagOperator') || '=';
        filters.filters.tagValue = searchParams.get('tagValue');
      }
      else {
        filters.filters.tagKey = undefined;
        filters.filters.tagValue = undefined;
      }
      
      // Load label filters
      const labelFilters: any = {};
      const labelFiltersArray: Array<{id: string, label: string, values: string[]}> = [];
      
      searchParams.forEach((value, key) => {
        if (key.startsWith('label_') && key.endsWith('_name')) {
          const id = key.replace('label_', '').replace('_name', '');
          const valueKey = `label_${id}_value`;
          const labelValue = searchParams.get(valueKey);
          
          labelFilters[id] = {
            name: value,
            value: labelValue ? (labelValue.includes(',') ? labelValue.split(',') : labelValue) : undefined
          };
          
          // Add to labelFiltersArray for state
          labelFiltersArray.push({
            id,
            label: value,
            values: labelValue ? (labelValue.includes(',') ? labelValue.split(',') : [labelValue]) : []
          });
        }
      });
      
      if (Object.keys(labelFilters).length > 0) {
        filters.labels = labelFilters;
        setLabelFilters(labelFiltersArray);
      } else {
        // Clear label filters if no URL params
        setLabelFilters([]);
      }
      
      // Load field filters
      const fieldFilters: any = {};
      const fieldFiltersArray: Array<{id: string, field: string, values: string[]}> = [];
      
      searchParams.forEach((value, key) => {
        if (key.startsWith('field_') && key.endsWith('_name')) {
          const id = key.replace('field_', '').replace('_name', '');
          const valueKey = `field_${id}_value`;
          const fieldValue = searchParams.get(valueKey);
          
          fieldFilters[id] = {
            name: value,
            value: fieldValue ? (fieldValue.includes(',') ? fieldValue.split(',') : fieldValue) : undefined
          };
          
          // Add to fieldFiltersArray for state
          fieldFiltersArray.push({
            id,
            field: value,
            values: fieldValue ? (fieldValue.includes(',') ? fieldValue.split(',') : [fieldValue]) : []
          });
        }
      });
      
      if (Object.keys(fieldFilters).length > 0) {
        filters.fields = fieldFilters;
        setFieldFilters(fieldFiltersArray);
      } else {
        // Clear field filters if no URL params
        setFieldFilters([]);
      }
      
      // Load options - only if they exist in URL
      const options: any = {};
      searchParams.forEach((value, key) => {
        if (key.startsWith('option_')) {
          const optionKey = key.replace('option_', '');
          options[optionKey] = value;
        }
      });
      
      if (Object.keys(options).length > 0) {
        filters.options = options;
      }
      
      // Always set form values - this will clear fields not in URL
      form.setFieldsValue(filters);
    };
    
    loadFiltersFromURL();
  }, [location.search, form]);

  // localStorage kaldırıldı - sadece URL'den okuma

  const addLabelFilter = useCallback(() => {
    const newFilter = {
      id: `label_${Date.now()}`,
      label: '',
      values: [] as string[]
    };
    setLabelFilters(prev => [...prev, newFilter]);
  }, []);

  const addFieldFilter = useCallback(() => {
    const newFilter = {
      id: `field_${Date.now()}`,
      field: '',
      values: [] as string[]
    };
    setFieldFilters(prev => [...prev, newFilter]);
  }, []);

  const removeLabelFilter = useCallback((id: string) => {
    setLabelFilters(prev => prev.filter(filter => filter.id !== id));
    // Remove from form values
    const currentLabels = form.getFieldValue('labels') || {};
    delete currentLabels[id];
    form.setFieldsValue({ labels: currentLabels });
  }, [form]);

  const removeFieldFilter = useCallback((id: string) => {
    setFieldFilters(prev => prev.filter(filter => filter.id !== id));
    // Remove from form values
    const currentFields = form.getFieldValue('fields') || {};
    delete currentFields[id];
    form.setFieldsValue({ fields: currentFields });
  }, [form]);

  const handleLabelFilterChange = useCallback(async (id: string, labelName: string) => {
    setLabelFilters(prev => prev.map(filter => 
      filter.id === id 
        ? { ...filter, label: labelName, values: [] }
        : filter
    ));
    // Reset values for this filter
    const currentLabels = form.getFieldValue('labels') || {};
    currentLabels[id] = { ...currentLabels[id], value: undefined };
    form.setFieldsValue({ labels: currentLabels });

    // Fetch values for the selected label
    if (labelName) {
      try {
        const values = await getPrometheusLabelValues(labelName);
        setLabelFilters(prev => prev.map(filter => 
          filter.label === labelName 
            ? { ...filter, label: labelName, values: values.map(item => item.value) }
            : filter
        ));
      } catch (error) {
        console.error(`Error fetching label values for ${labelName}:`, error);
      }
    }
  }, [form]);

  const handleFieldFilterChange = useCallback((id: string, fieldName: string) => {
    setFieldFilters(prev => prev.map(filter => 
      filter.id === id 
        ? { ...filter, field: fieldName, values: [] }
        : filter
    ));
    const currentFields = form.getFieldValue('fields') || {};
    currentFields[id] = { ...currentFields[id], value: undefined };
    form.setFieldsValue({ fields: currentFields });

    // Field values will be populated when grid data is available
    // No API call needed here
  }, [form]);

  const handleApply = () => {
    const values = form.getFieldsValue();
    updateURLWithFilters(values);
  };

  const updateURLWithFilters = (filters: any) => {
    const searchParams = new URLSearchParams();
    
    // Add timeRange
    if (filters.timeRange) {
      // Convert to long format (timestamp)
      const fromTimestamp = typeof filters.timeRange.from === 'string' 
        ? new Date(filters.timeRange.from).getTime() 
        : filters.timeRange.from;
      const toTimestamp = typeof filters.timeRange.to === 'string' 
        ? new Date(filters.timeRange.to).getTime() 
        : filters.timeRange.to;
      
      searchParams.set('from', fromTimestamp.toString());
      searchParams.set('to', toTimestamp.toString());
      
      // Console'a normal okunabilir format yazdır
      // console.log('Time Range:', {
      //   from: new Date(fromTimestamp).toISOString(),
      //   to: new Date(toTimestamp).toISOString(),
      //   fromTimestamp,
      //   toTimestamp
      // });
    }
    
    // Add service filter
    if (filters.filters?.serviceName) {
      searchParams.set('serviceName', filters.filters.serviceName);
      if (filters.filters.serviceNameOperator) {
        searchParams.set('serviceNameOperator', filters.filters.serviceNameOperator);
      }
    }
    
    // Add type filter
    if (filters.filters?.type) {
      searchParams.set('type', filters.filters.type);
      if (filters.filters.typeOperator) {
        searchParams.set('typeOperator', filters.filters.typeOperator);
      }
    }
    
    // Add operation filter
    if (filters.filters?.operationName) {
      searchParams.set('operationName', filters.filters.operationName);
      if (filters.filters.operationNameOperator) {
        searchParams.set('operationNameOperator', filters.filters.operationNameOperator);
      }
    }
    
    // Add status filter
    if (filters.filters?.status) {
      searchParams.set('status', filters.filters.status);
      if (filters.filters.statusOperator) {
        searchParams.set('statusOperator', filters.filters.statusOperator);
      }
    }

    // Add level filter
    if (filters.filters?.level) {
      searchParams.set('level', filters.filters.level);
      if (filters.filters.levelOperator) {
        searchParams.set('levelOperator', filters.filters.levelOperator);
      }
    }
    
    // Add duration filters
    if (filters.filters?.durationMin) {
      searchParams.set('durationMin', filters.filters.durationMin);
    }
    if (filters.filters?.durationMax) {
      searchParams.set('durationMax', filters.filters.durationMax);
    }
    
    // Add tag filters
    if (filters.filters?.tagKey) {
      searchParams.set('tagKey', filters.filters.tagKey);
      if (filters.filters.tagOperator) {
        searchParams.set('tagOperator', filters.filters.tagOperator);
      }
      if (filters.filters.tagValue) {
        searchParams.set('tagValue', filters.filters.tagValue);
      }
    }
    
    // Add label filters
    if (filters.labels) {
      Object.entries(filters.labels).forEach(([id, labelFilter]: [string, any]) => {
        if (labelFilter && labelFilter.name && labelFilter.value) {
          searchParams.set(`label_${id}_name`, labelFilter.name);
          if (Array.isArray(labelFilter.value)) {
            searchParams.set(`label_${id}_value`, labelFilter.value.join(','));
          } else {
            searchParams.set(`label_${id}_value`, labelFilter.value);
          }
        }
      });
    }
    
    // Add field filters
    if (filters.fields) {
      Object.entries(filters.fields).forEach(([id, fieldFilter]: [string, any]) => {
        if (fieldFilter && fieldFilter.name && fieldFilter.value) {
          searchParams.set(`field_${id}_name`, fieldFilter.name);
          if (Array.isArray(fieldFilter.value)) {
            searchParams.set(`field_${id}_value`, fieldFilter.value.join(','));
          } else {
            searchParams.set(`field_${id}_value`, fieldFilter.value);
          }
        }
      });
    }
    
    // Add options
    if (filters.options) {
      Object.entries(filters.options).forEach(([key, value]: [string, any]) => {
        if (value !== undefined && value !== null) {
          searchParams.set(`option_${key}`, String(value));
        }
      });
    }
    
    // Update URL without page reload
    const newURL = `${location.pathname}?${searchParams.toString()}`;
    // console.log('Navigating to new URL:', newURL);
    navigate(newURL, { replace: true });
  };

  return (
    <Form form={form} layout="vertical" onFinish={handleApply}>
      {hasServiceFilter && (
        <Form.Item label="Service">
          <Space.Compact className="filter-compact-space">
            <Form.Item name={['filters', 'serviceNameOperator']} noStyle initialValue="=">
              <Select className="filter-operator-select">
                {EQUAL_OPERATOR_OPTIONS.map((op) => (
                  <Option key={op} value={op}>
                    {op}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name={['filters', 'serviceName']} noStyle>
              <Select
                showSearch
                allowClear
                placeholder="Select service"
                className="filter-value-select"
                notFoundContent="No services found"
              >
                {services.map((service) => {
                  return (
                    <Option key={service.key} value={service.value}>
                      {service.name}
                    </Option>
                  );
                })}
              </Select>
            </Form.Item>
          </Space.Compact>
        
        </Form.Item>
      )}
      {hasTypesFilter && (
        <Form.Item label="Type">
          <Space.Compact className="filter-compact-space">
            <Form.Item name={['filters', 'typeOperator']} noStyle initialValue="=">
              <Select className="filter-operator-select">
                {EQUAL_OPERATOR_OPTIONS.map((op) => (
                  <Option key={op} value={op}>
                    {op}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name={['filters', 'type']} noStyle>
              <Select
                showSearch
                allowClear
                placeholder="Select type"
                className="filter-value-select"
              >
                {types.map((type) => {
                  return (
                    <Option key={type.key} value={type.value}>
                      {type.name}
                    </Option>
                  );
                })}
              </Select>
            </Form.Item>
          </Space.Compact>
        
        </Form.Item>
      )}
      {hasOperationsFilter && (
        <Form.Item label="Operation">
          <Space.Compact className="filter-compact-space">
            <Form.Item name={['filters', 'operationNameOperator']} noStyle initialValue="=">
              <Select className="filter-operator-select">
                {EQUAL_OPERATOR_OPTIONS.map((op) => (
                  <Option key={op} value={op}>
                    {op}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name={['filters', 'operationName']} noStyle>
              <Select
                showSearch
                allowClear
                placeholder="Select operation"
                className="filter-value-select"
              >
                {operations.map((operation) => {
                  return (
                    <Option key={operation.key} value={operation.value}>
                      {operation.name}
                    </Option>
                  );
                })}
              </Select>
            </Form.Item>
          </Space.Compact>
        
        </Form.Item>
      )}
      {hasStatusesFilter && (
        <Form.Item label="Status">
          <Space.Compact className="filter-compact-space">
            <Form.Item name={['filters', 'statusOperator']} noStyle initialValue="=">
              <Select className="filter-operator-select">
                {EQUAL_OPERATOR_OPTIONS.map((op) => (
                  <Option key={op} value={op}>
                    {op}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name={['filters', 'status']} noStyle>
              <Select
                showSearch
                allowClear
                placeholder="Select status"
                className="filter-value-select"
              >
                {statuses.map((status) => {
                  return (
                    <Option key={status.key} value={status.value}>
                      {status.name}
                    </Option>
                  );
                })}
              </Select>
            </Form.Item>
          </Space.Compact>
        
        </Form.Item>
      )}
      {hasLevelsFilter && (
        <Form.Item label="Level">
          <Space.Compact className="filter-compact-space">
            <Form.Item name={['filters', 'levelOperator']} noStyle initialValue="=">
              <Select className="filter-operator-select">
                {EQUAL_OPERATOR_OPTIONS.map((op) => (
                  <Option key={op} value={op}>
                    {op}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name={['filters', 'level']} noStyle>
              <Select
                showSearch
                allowClear
                placeholder="Select level"
                className="filter-value-select"
              >
                {levels.map((level) => {
                  return (
                    <Option key={level.key} value={level.value}>
                      {level.name}
                    </Option>
                  );
                })}
              </Select>
            </Form.Item>
          </Space.Compact>
        
        </Form.Item>
      )}
      {hasDurationFilter && (
        <Form.Item label="Duration (ms)">
          <Row gutter={8}>
            <Col span={12}>
              <Form.Item name={['filters', 'durationMin']} noStyle>
                <Input placeholder="> Min" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name={['filters', 'durationMax']} noStyle>
                <Input placeholder="< Max" />
              </Form.Item>
            </Col>
          </Row>
        </Form.Item>
      )}
      {hasTagsFilter && (
        <>
          <Divider orientation={'center'}>Tags</Divider>

      <Row gutter={8}>
          <>
            <Col span={10}>
              <Form.Item name={['filters', 'tagKey']} noStyle>
                <Input placeholder="Tag key" />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item name={['filters', 'tagOperator']} noStyle initialValue="=">
                <Select>
                  {EQUAL_OPERATOR_OPTIONS.map((op) => (
                    <Option key={op} value={op}>
                      {op}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item name={['filters', 'tagValue']} noStyle>
                <Input placeholder="Tag value" />
              </Form.Item>
            </Col>
          </>
      </Row>
        </>
      )}

      {children}

      {hasLabelsFilter && (
        <>
          <Divider orientation={'center'}>Labels</Divider>

          {labelFilters.map((filter, index) => (
            <React.Fragment key={filter.id}>
              <Row gutter={8} className="base-filter-label-filter-row">
                  <>
                    <Col span={24}>
                      <Form.Item name={['labels', filter.id, 'name']} label="" initialValue={''}>
                        <Select
                          showSearch
                          allowClear
                          placeholder="Select label"
                          onChange={(value) => handleLabelFilterChange(filter.id, value)}
                          loading={labels.length === 0}
                        >
                          {labels.map((label) => (
                            <Option key={label.key} value={label.value}>
                              {label.name}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={24}>
                      <Form.Item name={['labels', filter.id, 'value']} noStyle>
                        <Select
                          showSearch
                          allowClear
                          placeholder="Select value"
                          className="base-filter-label-select"
                          disabled={!filter.label}
                          loading={filter.values.length === 0 && filter.label !== ''}
                          mode="multiple"
                          maxTagCount={2}
                          maxTagTextLength={500}
                        >
                          {filter.values.map((value) => (
                            <Option key={value} value={value}>
                              {value}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                  </>
              </Row>
              {index < labelFilters.length - 1 && (
                <Divider orientation={'center'} />
              )}
            </React.Fragment>
          ))}

            <Row gutter={8}>
              <Col span={24}>
                <Button 
                  type="dashed" 
                  icon={<PlusOutlined />} 
                  onClick={addLabelFilter}
                  className="base-filter-add-button"
                >
                  Add Label Filter
                </Button>
              </Col>
            </Row>
          

          {labelFilters.length > 0 && (
            <Row gutter={8} className="base-filter-remove-button-row">
              <Col span={24}>
                <Button 
                  type="dashed" 
                  icon={<MinusOutlined />} 
                  onClick={() => removeLabelFilter(labelFilters[labelFilters.length - 1].id)}
                  danger
                  className="base-filter-add-button"
                >
                  Remove Last Label Filter
                </Button>
              </Col>
            </Row>
          )}

        </>
      )}
      {hasFieldsFilter && data && Array.isArray(data) && data.length > 0 && (
        <>
          <Divider orientation={'center'}>Fields</Divider>

          {fieldFilters.map((filter, index) => (
            <React.Fragment key={filter.id}>
              <Row gutter={8} className="base-filter-field-filter-row">
                  <>
                    <Col span={24}>
                      <Form.Item name={['fields', filter.id, 'name']} label="" initialValue={''}>
                        <Select
                          showSearch
                          allowClear
                          placeholder="Select field"
                          onChange={(value) => handleFieldFilterChange(filter.id, value)}
                          loading={fields.length === 0}
                        >
                          {fields.map((field) => (
                            <Option key={field.key} value={field.value}>
                              {field.name}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={24}>
                      <Form.Item name={['fields', filter.id, 'value']} noStyle>
                        <Select
                          showSearch
                          allowClear
                          placeholder="Select value"
                          className="base-filter-label-select"
                          disabled={!filter.field}
                          loading={filter.values.length === 0 && filter.field !== ''}
                          mode="multiple"
                          maxTagCount={2}
                          maxTagTextLength={500}
                        >
                          {filter.values.map((value) => (
                            <Option key={value} value={value}>
                              {value}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                  </>
              </Row>
              {index < fieldFilters.length - 1 && (
                <Divider orientation={'center'} />
              )}
            </React.Fragment>
          ))}

            <Row gutter={8}>
              <Col span={24}>
                <Button 
                  type="dashed" 
                  icon={<PlusOutlined />} 
                  onClick={addFieldFilter}
                  className="base-filter-add-button"
                >
                  Add Field Filter
                </Button>
              </Col>
            </Row>

          {fieldFilters.length > 0 && (
            <Row gutter={8} className="base-filter-remove-button-row">
              <Col span={24}>
                <Button 
                  type="dashed" 
                  icon={<MinusOutlined />} 
                  onClick={() => removeFieldFilter(fieldFilters[fieldFilters.length - 1].id)}
                  danger
                  className="base-filter-add-button"
                >
                  Remove Last Field Filter
                </Button>
              </Col>
            </Row>
          )}

        </>
      )}
      {hasOptionsFilter && (
        <>
          <Divider orientation={'center'}>Options</Divider>

      <Row gutter={8}>
        {
            <>
                <Col span={6}>
                    <Form.Item name={['options', 'limit']} label="Limit" initialValue="100">
                    <Select className="base-filter-select">
                      <Select.Option value="100">100</Select.Option>
                      <Select.Option value="200">200</Select.Option>
                      <Select.Option value="500">500</Select.Option>
                      <Select.Option value="1000">1000</Select.Option>
                    </Select>
                    </Form.Item>
                </Col>
                <Col span={10}>
                    <Form.Item name={['options', 'interval']} label="Interval" initialValue="5m">
                    <Select className="base-filter-select">
                      <Select.Option value="$__rate_interval">Optimum</Select.Option>
                      <Select.Option value="30s">30s</Select.Option>
                      <Select.Option value="1m">1m</Select.Option>
                      <Select.Option value="5m">5m</Select.Option>
                      <Select.Option value="15m">15m</Select.Option>
                      <Select.Option value="30m">30m</Select.Option>
                      <Select.Option value="1h">1h</Select.Option>
                      <Select.Option value="2h">2h</Select.Option>
                      <Select.Option value="4h">4h</Select.Option>
                      <Select.Option value="8h">8h</Select.Option>
                      <Select.Option value="12h">12h</Select.Option>
                    </Select>
                    </Form.Item>
                </Col>
                <Col span={8}>
                    <Form.Item name={['options', 'pageCount']} label="Page Count" initialValue="20">
                    <Select className="base-filter-select">
                      <Select.Option value="10">10</Select.Option>
                      <Select.Option value="20">20</Select.Option>
                      <Select.Option value="50">50</Select.Option>
                      <Select.Option value="100">100</Select.Option>
                    </Select>
                    </Form.Item>
                </Col>
                </>
        }
      </Row>

        {columns && Array.isArray(columns) && columns.length > 0 && (
      <Row gutter={8}>
        {
            <>
                <Col span={12}>
                    <Form.Item name={['options', 'orderBy']} label="Order By" initialValue={columns && Array.isArray(columns) ? columns[0].key || columns[0].dataIndex : ''}>
                      <Select className="base-filter-order-select">
                        {columns && Array.isArray(columns) ? columns.map((column) => (
                          <Option key={column.key || column.dataIndex} value={column.key || column.dataIndex}>
                            {column.title || column.key || column.dataIndex}
                          </Option>
                        )) : null}
                      </Select>
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item name={['options', 'orderDirection']} label="Direction" initialValue={'desc'}>
                      <Select className="base-filter-order-select">
                        <Option value="asc">Ascending</Option>
                        <Option value="desc">Descending</Option>
                      </Select>
                    </Form.Item>
                </Col>
                </>
        }
      </Row>
        )}
        </>
      )}

      <Form.Item className="base-filter-apply-form-item">
        <Button type="primary" htmlType="submit" block>
          Apply 
        </Button>
        <Button block className="base-filter-reset-button" onClick={() => {
          form.resetFields();
          // Clear all filter states
          setLabelFilters([]);
          setFieldFilters([]);
          // Clear URL parameters
          navigate(location.pathname, { replace: true });
        }}>
          Reset
        </Button>
      </Form.Item>
    </Form>
  );
};

export default BaseFilter;
