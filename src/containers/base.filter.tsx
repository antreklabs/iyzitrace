import React, { useEffect, useState, useCallback } from 'react';
import { Select, Input, Button, Divider, Form, Row, Col, InputNumber, Space } from 'antd';
import { lokiReadApi } from '../providers/api/loki/loki.api.read';
import { tempoReadApi } from '../providers/api/tempo/tempo.api.read';
import { useAppSelector } from '../store/hooks';
import { MinusOutlined, PlusOutlined } from '@ant-design/icons';
// localStorage kaldırıldı - sadece URL'den okuma
import { useLocation, useNavigate } from 'react-router-dom';
import '../assets/styles/base/base.filter.css';

export const { Option } = Select;
export const OPERATOR_OPTIONS = ['=', '!=', '>', '<', 'contains', 'regex'];
export const EQUAL_OPERATOR_OPTIONS = ['=', '!='];

interface BaseFilterProps {
  onApply?: (values: any) => void;
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
  columns?: any[];
  data?: any[]; // Grid data to extract fields from
  datasourceType?: 'tempo' | 'loki';
  onExpressionUpdate?: (labelExpressionParts: string[], expression: string) => { labelExpressionParts: string[], expression: string } | void; // Callback for expression updates
}

const BaseFilter: React.FC<BaseFilterProps> = ({ 
  onApply, 
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
  columns,
  data,
  datasourceType = 'tempo',
  onExpressionUpdate
}) => {
  const [services, setServices] = useState<string[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [labels, setLabels] = useState<string[]>([]);
  const [operations, setOperations] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [fields, setFields] = useState<string[]>([]);
  const [labelFilters, setLabelFilters] = useState<Array<{id: string, label: string, values: string[]}>>([]);
  const [fieldFilters, setFieldFilters] = useState<Array<{id: string, field: string, values: string[]}>>([]);
  const [form] = Form.useForm();
  const { selectedUid } = useAppSelector((state) => state.datasource);
  const location = useLocation();
  const navigate = useNavigate();

  const fetchServices = useCallback(async () => {
    const values = datasourceType === 'loki' ? await lokiReadApi.getLabelValues('service_name') 
      : await tempoReadApi.getLabelValues('service.name');
    const serviceNames: string[] = Array.isArray(values) ? values : [];
    setServices(serviceNames);
  }, [datasourceType]);
  
  const fetchOperations = useCallback(async () => {
    const values = await tempoReadApi.getLabelValues('operation.name');
    const operations: string[] = Array.isArray(values) ? values : [];
    setOperations(operations);
  }, []);
  
  const fetchStatuses = useCallback(async () => {
    const values = await tempoReadApi.getLabelValues('status');
    const statuses: string[] = Array.isArray(values) ? values : [];
    setStatuses(statuses);
  }, []);

  const fetchTypes = useCallback(async () => {
    const values = await tempoReadApi.getLabelValues('type');
    const types: string[] = Array.isArray(values) ? values : [];
    setTypes(types);
  }, []);

  const fetchLabels = useCallback(async () => {
    try {
      const labels = datasourceType === 'loki' ? await lokiReadApi.getLabels() 
        : await tempoReadApi.getLabels();
      setLabels(Array.isArray(labels) ? labels : []);
    } catch (error) {
      console.error('Error fetching labels:', error);
      setLabels([]);
    }
  }, [datasourceType]);

  // Function to extract fields from grid data
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
      setFields(extractedFields);
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

  // Function to build LogQL expression
  const buildLogQLExpression = (formValues: any) => {
    const parts: string[] = [];
    
    // Add default service namespace
    parts.push(`service_namespace="opentelemetry-demo"`);
    
    // Add service filter
    const selectedService = formValues?.filters?.serviceName;
    const selectedServiceNameOperator = formValues?.filters?.serviceNameOperator || '=';
    if (selectedService) {
      parts.push(`service_name${selectedServiceNameOperator}"${selectedService}"`);
    }
    const selectedType = formValues?.filters?.type;
    const selectedTypeOperator = formValues?.filters?.typeOperator || '=';
    if (selectedType) {
      parts.push(`type${selectedTypeOperator}"${selectedType}"`);
    }
    
    // Add dynamic label filters
    const labelFilters = formValues?.labels || {};
    Object.values(labelFilters).forEach((labelFilter: any) => {
      if (labelFilter && labelFilter.name && labelFilter.value) {
        const labelName = labelFilter.name;
        const labelValues = Array.isArray(labelFilter.value) ? labelFilter.value : [labelFilter.value];
        
        if (labelValues.length > 0) {
          if (labelValues.length === 1) {
            parts.push(`${labelName}="${labelValues[0]}"`);
          } else {
            const regexPattern = labelValues.map((val: string) => val.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
            parts.push(`${labelName}=~"${regexPattern}"`);
          }
        }
      }
    });
    
    const baseExpression = `{${parts.join(',')}}`;
    
    return {
      labelExpressionParts: parts,
      expression: baseExpression
    };
  };

  // useEffect(() => {
  //   if (hasServiceFilter) {
  //     fetchServices();
  //   }
  //   if (hasLabelsFilter) {
  //     fetchLabels();
  //   }
  //   if (hasOperationsFilter) {
  //     fetchOperations();
  //   }
  //   if (hasStatusesFilter) {
  //     fetchStatuses();
  //   }
  // }, [selectedUid, hasServiceFilter, hasLabelsFilter, hasOperationsFilter, hasStatusesFilter]);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (hasServiceFilter) {
        await fetchServices();
      }
      if (hasLabelsFilter) {
        await fetchLabels();
      }
      if (hasOperationsFilter) {
        await fetchOperations();
      }
      if (hasTypesFilter) {
        await fetchTypes();
      }
      // timeSrv/DS sync için 1 frame beklet
      await new Promise(r => requestAnimationFrame(() => r(null)));
  
      if (alive && hasStatusesFilter) {
        await fetchStatuses();
      }
    })();
    return () => { alive = false; };
  }, [selectedUid, hasServiceFilter, hasLabelsFilter, hasOperationsFilter, hasStatusesFilter, hasTypesFilter, fetchServices, fetchLabels, fetchOperations, fetchTypes, fetchStatuses]);

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

  // Load filters from URL on mount
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
        
        // Console'a normal okunabilir format yazdır
        // console.log('Loaded Time Range from URL:', {
        //   from: new Date(fromTimestamp).toISOString(),
        //   to: new Date(toTimestamp).toISOString(),
        //   fromTimestamp,
        //   toTimestamp
        // });
      }
      
      // Load basic filters
      if (searchParams.get('serviceName')) {
        const serviceName = searchParams.get('serviceName');
        filters.filters = {
          ...filters.filters,
          serviceName: serviceName,
          serviceNameOperator: searchParams.get('serviceNameOperator') || '='
        };
        
        // URL'den gelen service name'i services listesine ekle (eğer yoksa)
        if (serviceName && !services.includes(serviceName)) {
          setServices(prev => [...prev, serviceName]);
        }
      }
      
      if (searchParams.get('type')) {
        const type = searchParams.get('type');
        filters.filters = {
          ...filters.filters,
          type: type,
          typeOperator: searchParams.get('typeOperator') || '='
        };
        
        // URL'den gelen type'ı types listesine ekle (eğer yoksa)
        if (type && !types.includes(type)) {
          setTypes(prev => [...prev, type]);
        }
      }
      
      if (searchParams.get('operationName')) {
        const operationName = searchParams.get('operationName');
        filters.filters = {
          ...filters.filters,
          operationName: operationName,
          operationNameOperator: searchParams.get('operationNameOperator') || '='
        };
        
        // URL'den gelen operation name'i operations listesine ekle (eğer yoksa)
        if (operationName && !operations.includes(operationName)) {
          setOperations(prev => [...prev, operationName]);
        }
      }
      
      if (searchParams.get('status')) {
        const status = searchParams.get('status');
        filters.filters = {
          ...filters.filters,
          status: status,
          statusOperator: searchParams.get('statusOperator') || '='
        };
        
        // URL'den gelen status'u statuses listesine ekle (eğer yoksa)
        if (status && !statuses.includes(status)) {
          setStatuses(prev => [...prev, status]);
        }
      }
      
      if (searchParams.get('durationMin')) {
        filters.filters = {
          ...filters.filters,
          durationMin: searchParams.get('durationMin')
        };
      }
      
      if (searchParams.get('durationMax')) {
        filters.filters = {
          ...filters.filters,
          durationMax: searchParams.get('durationMax')
        };
      }
      
      if (searchParams.get('tagKey')) {
        filters.filters = {
          ...filters.filters,
          tagKey: searchParams.get('tagKey'),
          tagOperator: searchParams.get('tagOperator') || '=',
          tagValue: searchParams.get('tagValue')
        };
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
      }
      
      // Load options
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
      
      // Set form values if any filters found
      if (Object.keys(filters).length > 0) {
        form.setFieldsValue(filters);
      }
    };
    
    loadFiltersFromURL();
  }, [location.search, form, datasourceType]);

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
        const values = datasourceType === 'loki' ? await lokiReadApi.getLabelValues(labelName) 
          : await tempoReadApi.getLabelValues(labelName);
        setLabelFilters(prev => prev.map(filter => 
          filter.id === id 
            ? { ...filter, label: labelName, values: Array.isArray(values) ? values : [] }
            : filter
        ));
      } catch (error) {
        console.error(`Error fetching label values for ${labelName}:`, error);
      }
    }
  }, [datasourceType, form]);

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
    // console.log('BaseFilter handleApply called');
    const values = form.getFieldsValue();
    // console.log('Form values:', values);
    
    // Build LogQL expression
    const { labelExpressionParts, expression } = buildLogQLExpression(values);
    
    // Call callback if provided and get updated values
    let finalLabelExpressionParts = labelExpressionParts;
    let finalExpression = expression;
    
    if (onExpressionUpdate) {
      const updated = onExpressionUpdate(labelExpressionParts, expression);
      if (updated && typeof updated === 'object') {
        finalLabelExpressionParts = updated.labelExpressionParts;
        finalExpression = updated.expression;
      }
    }
    
    // Add expression data to values
    const valuesWithExpression = {
      ...values,
      labelExpressionParts: finalLabelExpressionParts,
      expression: finalExpression,
      selectedTempoUid: selectedUid,
      timeRange: {
        from: Date.now() - 15 * 60 * 1000, // 15 minutes ago (timestamp)
        to: Date.now() // now (timestamp)
      }
    };
    
    // Update URL with filters (localStorage kaldırıldı)
    // console.log('Updating URL with filters:', valuesWithExpression);
    updateURLWithFilters(valuesWithExpression);
    
    // Call onApply callback
    // console.log('Calling onApply callback');
    onApply(valuesWithExpression);
  };

  const updateURLWithFilters = (filters: any) => {
    const searchParams = new URLSearchParams();
    
    // Add selectedTempoUid
    if (filters.selectedTempoUid) {
      searchParams.set('selectedTempoUid', filters.selectedTempoUid);
    }
    
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
                  const serviceValue = typeof service === 'string' ? service : (service as any)?.text || (service as any)?.value || String(service);
                  const serviceKey = typeof service === 'string' ? service : (service as any)?.text || (service as any)?.value || String(service);
                  return (
                    <Option key={serviceKey} value={serviceValue}>
                      {serviceValue}
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
                  const typeValue = typeof type === 'string' ? type : (type as any)?.text || (type as any)?.value || String(type);
                  const typeKey = typeof type === 'string' ? type : (type as any)?.text || (type as any)?.value || String(type);
                  return (
                    <Option key={typeKey} value={typeValue}>
                      {typeValue}
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
                  const operationValue = typeof operation === 'string' ? operation : (operation as any)?.text || (operation as any)?.value || String(operation);
                  const operationKey = typeof operation === 'string' ? operation : (operation as any)?.text || (operation as any)?.value || String(operation);
                  return (
                    <Option key={operationKey} value={operationValue}>
                      {operationValue}
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
                  const statusValue = typeof status === 'string' ? status : (status as any)?.text || (status as any)?.value || String(status);
                  const statusKey = typeof status === 'string' ? status : (status as any)?.text || (status as any)?.value || String(status);
                  return (
                    <Option key={statusKey} value={statusValue}>
                      {statusValue}
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
                            <Option key={label} value={label}>
                              {label}
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
                            <Option key={field} value={field}>
                              {field}
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
                <Col span={12}>
                    <Form.Item name={['options', 'limit']} label="Limit" initialValue={100}>
                    <InputNumber min={0} className="base-filter-input-number" />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item name={['options', 'interval']} label="Interval (ms)" initialValue={1000}>
                    <InputNumber min={0} className="base-filter-input-number" />
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
        <Button block className="base-filter-reset-button" onClick={() => form.resetFields()}>
          Reset
        </Button>
      </Form.Item>
    </Form>
  );
};

export default BaseFilter;
