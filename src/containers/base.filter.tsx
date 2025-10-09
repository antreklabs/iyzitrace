import React, { useEffect, useState } from 'react';
import { Select, Input, Button, Divider, Form, Row, Col, InputNumber, Typography, Space } from 'antd';
import { lokiReadApi } from '../providers/api/loki/loki.api.read';
import { tempoReadApi } from '../providers/api/tempo/tempo.api.read';
import { useAppSelector } from '../store/hooks';
import { MinusOutlined, PlusOutlined } from '@ant-design/icons';
import { getPageState, updatePageState, getDefaultPageState } from './base.container';
import { useLocation } from 'react-router-dom';
import '../assets/styles/base/base.filter.css';

export const { Option } = Select;
export const OPERATOR_OPTIONS = ['=', '!=', '>', '<', 'contains', 'regex'];
export const EQUAL_OPERATOR_OPTIONS = ['=', '!='];

interface BaseFilterProps {
  onChange: (values: any) => void;
  collapsed?: boolean;
  children?: React.ReactNode;
  hasServiceFilter?: boolean;
  hasOperationsFilter?: boolean;
  hasStatusesFilter?: boolean;
  hasDurationFilter?: boolean;
  hasTagsFilter?: boolean;
  hasOptionsFilter?: boolean;
  hasLabelsFilter?: boolean;
  hasFieldsFilter?: boolean;
  columns?: any[];
  data?: any[]; // Grid data to extract fields from
  datasourceType?: 'tempo' | 'loki';
  onExpressionUpdate?: (labelExpressionParts: string[], expression: string) => { labelExpressionParts: string[], expression: string } | void; // Callback for expression updates
}

const BaseFilter: React.FC<BaseFilterProps> = ({ 
  onChange, 
  collapsed, 
  children,
  hasServiceFilter = false,
  hasOperationsFilter = false,
  hasStatusesFilter = false,
  hasDurationFilter = false,
  hasTagsFilter = false,
  hasLabelsFilter = false,
  hasOptionsFilter = false,
  hasFieldsFilter = false,
  columns = [],
  data = [],
  datasourceType = 'tempo',
  onExpressionUpdate
}) => {
  const [services, setServices] = useState<string[]>([]);
  const [labels, setLabels] = useState<string[]>([]);
  const [operations, setOperations] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [fields, setFields] = useState<string[]>([]);
  const [labelFilters, setLabelFilters] = useState<Array<{id: string, label: string, values: string[]}>>([]);
  const [fieldFilters, setFieldFilters] = useState<Array<{id: string, field: string, values: string[]}>>([]);
  const [form] = Form.useForm();
  const { selectedUid } = useAppSelector((state) => state.datasource);
  const location = useLocation();
  const pageName = location.pathname.split('/').filter(Boolean).join('_') || 'home';

  const fetchServices = async () => {
    const values = datasourceType === 'loki' ? await lokiReadApi.getLabelValues('service_name') 
      : await tempoReadApi.getLabelValues('service.name');
    const serviceNames: string[] = Array.isArray(values) ? values : [];
    setServices(serviceNames);
  };
  
  const fetchOperations = async () => {
    const values = await tempoReadApi.getLabelValues('operation.name');
    const operations: string[] = Array.isArray(values) ? values : [];
    setOperations(operations);
  };
  
  const fetchStatuses = async () => {
    const values = await tempoReadApi.getLabelValues('status');
    const statuses: string[] = Array.isArray(values) ? values : [];
    setStatuses(statuses);
  };

  const fetchLabels = async () => {
    try {
      const labels = datasourceType === 'loki' ? await lokiReadApi.getLabels() 
        : await tempoReadApi.getLabels();
      setLabels(Array.isArray(labels) ? labels : []);
    } catch (error) {
      console.error('Error fetching labels:', error);
      setLabels([]);
    }
  };

  // Function to extract fields from grid data
  const extractFieldsFromData = (data: any[]) => {
    if (!data || data.length === 0) return;
    
    const fieldNames = new Set<string>();
    data.forEach(item => {
      if (item.attributes) {
        Object.keys(item.attributes).forEach(key => fieldNames.add(key));
      }
    });
    
    const extractedFields = Array.from(fieldNames);
    if (extractedFields.length > 0) {
      setFields(extractedFields);
    }
  };

  // Function to extract field values from grid data
  const extractFieldValuesFromData = (data: any[], fieldName: string) => {
    if (!data || data.length === 0) return [];
    
    const fieldValues = new Set<string>();
    data.forEach(item => {
      if (item.attributes && item.attributes[fieldName]) {
        const value = item.attributes[fieldName];
        if (typeof value === 'string' || typeof value === 'number') {
          fieldValues.add(String(value));
        }
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
      if (hasServiceFilter) await fetchServices();
      if (hasLabelsFilter)  await fetchLabels();
      if (hasOperationsFilter) await fetchOperations();
  
      // timeSrv/DS sync için 1 frame beklet
      await new Promise(r => requestAnimationFrame(() => r(null)));
  
      if (alive && hasStatusesFilter) await fetchStatuses();
    })();
    return () => { alive = false; };
  }, [selectedUid, hasServiceFilter, hasLabelsFilter, hasOperationsFilter, hasStatusesFilter]);

  // Extract fields from grid data when data changes
  useEffect(() => {
    if (hasFieldsFilter && data && data.length > 0) {
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

  // Set initial form values from localStorage
  useEffect(() => {
    const pageState = getPageState(pageName);
    if (pageState && pageState.filters) {
      // Set form values
      form.setFieldsValue(pageState.filters);
      
      // Set label filters state if exists
      if (pageState.filters.labels) {
        const labelFiltersArray = Object.entries(pageState.filters.labels).map(([id, filter]: [string, any]) => ({
          id,
          label: filter.name || '',
          values: [] as string[]
        }));
        setLabelFilters(labelFiltersArray);
        
        // Fetch values for each label that has a name
        const fetchLabelValues = async () => {
          for (const filter of labelFiltersArray) {
            if (filter.label) {
              try {
                console.log(`[BaseFilter] Fetching values for initial label: ${filter.label}`);
                const values = datasourceType === 'loki' ? await lokiReadApi.getLabelValues(filter.label) 
                  : await tempoReadApi.getLabelValues(filter.label);
                console.log(`[BaseFilter] Label values received for ${filter.label}:`, values);
                setLabelFilters(prev => prev.map(f => 
                  f.id === filter.id 
                    ? { ...f, values: Array.isArray(values) ? values : [] }
                    : f
                ));
              } catch (error) {
                console.error(`Error fetching label values for ${filter.label}:`, error);
              }
            }
          }
        };
        fetchLabelValues();
      }
      
      // Set field filters state if exists
      if (pageState.filters.fields) {
        const fieldFiltersArray = Object.entries(pageState.filters.fields).map(([id, filter]: [string, any]) => ({
          id,
          field: filter.name || '',
          values: [] as string[]
        }));
        setFieldFilters(fieldFiltersArray);
        
        // Field values will be populated from grid data when available
        // No initial API calls needed
      }
    }
  }, [pageName, form]);

  const addLabelFilter = () => {
    const newFilter = {
      id: `label_${Date.now()}`,
      label: '',
      values: [] as string[]
    };
    setLabelFilters([...labelFilters, newFilter]);
  };
  const addFieldFilter = () => {
    const newFilter = {
      id: `field_${Date.now()}`,
      field: '',
      values: [] as string[]
    };
    setFieldFilters([...fieldFilters, newFilter]);
  };

  const removeLabelFilter = (id: string) => {
    setLabelFilters(labelFilters.filter(filter => filter.id !== id));
    // Remove from form values
    const currentLabels = form.getFieldValue('labels') || {};
    delete currentLabels[id];
    form.setFieldsValue({ labels: currentLabels });
  };

  const removeFieldFilter = (id: string) => {
    setFieldFilters(fieldFilters.filter(filter => filter.id !== id));
    // Remove from form values
    const currentFields = form.getFieldValue('fields') || {};
    delete currentFields[id];
    form.setFieldsValue({ fields: currentFields });
  };

  const handleLabelFilterChange = async (id: string, labelName: string) => {
    setLabelFilters(labelFilters.map(filter => 
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
        setLabelFilters(labelFilters.map(filter => 
          filter.id === id 
            ? { ...filter, label: labelName, values: Array.isArray(values) ? values : [] }
            : filter
        ));
      } catch (error) {
        console.error(`Error fetching label values for ${labelName}:`, error);
      }
    }
  };
  const handleFieldFilterChange = (id: string, fieldName: string) => {
    setFieldFilters(fieldFilters.map(filter => 
      filter.id === id 
        ? { ...filter, field: fieldName, values: [] }
        : filter
    ));
    const currentFields = form.getFieldValue('fields') || {};
    currentFields[id] = { ...currentFields[id], value: undefined };
    form.setFieldsValue({ fields: currentFields });

    // Field values will be populated when grid data is available
    // No API call needed here
  };

  const handleApply = () => {
    const values = form.getFieldsValue();
    
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
      expression: finalExpression
    };
    
    // Save to pageState
    const pageState = getPageState(pageName) || getDefaultPageState();
    updatePageState(pageName, {
      ...pageState,
      filters: {
        ...pageState.filters,
        ...valuesWithExpression
      }
    });
    
    onChange(valuesWithExpression);
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
        {collapsed ? (
          <Typography.Text type="secondary">
            {form.getFieldValue('durationMin')?.length > 0
              ? form.getFieldValue('durationMin').length + ' Select'
              : 'All'}
          </Typography.Text>
        ) : (
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
        )}
        </Form.Item>
      )}

      {hasTagsFilter && (
        <>
          <Divider orientation={collapsed ? 'left':'center'}>Tags</Divider>

      <Row gutter={8}>
        {collapsed ? (
          <Typography.Text type="secondary">
            {form.getFieldValue('tags')?.length > 0 ? form.getFieldValue('tags').length + ' Select' : 'All'}
          </Typography.Text>
        ) : (
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
        )}
      </Row>
        </>
      )}

      {children}

      {hasLabelsFilter && (
        <>
          <Divider orientation={collapsed ? 'left':'center'}>Labels</Divider>

          {labelFilters.map((filter, index) => (
            <React.Fragment key={filter.id}>
              <Row gutter={8} className="base-filter-label-filter-row">
                {collapsed ? (
                  <Typography.Text type="secondary">
                    {filter.label ? `${filter.label} = ${form.getFieldValue(['labels', filter.id, 'value']) || 'any'}` : 'All'}
                  </Typography.Text>
                ) : (
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
                )}
              </Row>
              {index < labelFilters.length - 1 && (
                <Divider orientation={collapsed ? 'left':'center'} />
              )}
            </React.Fragment>
          ))}

          {!collapsed && (
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
          )}

          {!collapsed && labelFilters.length > 0 && (
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

      {hasFieldsFilter && (
        <>
          <Divider orientation={collapsed ? 'left':'center'}>Fields</Divider>

          {fieldFilters.map((filter, index) => (
            <React.Fragment key={filter.id}>
              <Row gutter={8} className="base-filter-field-filter-row">
                {collapsed ? (
                  <Typography.Text type="secondary">
                    {filter.field ? `${filter.field} = ${form.getFieldValue(['fields', filter.id, 'value']) || 'any'}` : 'All'}
                  </Typography.Text>
                ) : (
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
                )}
              </Row>
              {index < fieldFilters.length - 1 && (
                <Divider orientation={collapsed ? 'left':'center'} />
              )}
            </React.Fragment>
          ))}

          {!collapsed && (
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
          )}

          {!collapsed && fieldFilters.length > 0 && (
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
          <Divider orientation={collapsed ? 'left':'center'}>Options</Divider>

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

      <Row gutter={8}>
        {
            <>
                <Col span={12}>
                    <Form.Item name={['options', 'orderBy']} label="Order By" initialValue={'timestamp'}>
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
