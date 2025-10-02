import React, { useEffect, useState } from 'react';
import { Select, Input, Button, Divider, Form, Row, Col, InputNumber, Typography, Space } from 'antd';
import { lokiReadApi } from '../providers/api/loki/loki.api.read';
import { useAppSelector } from '../store/hooks';
import { MinusOutlined, PlusOutlined } from '@ant-design/icons';
import { getPageState } from '../utils/localstorage.util';
import { useLocation } from 'react-router-dom';

export const { Option } = Select;
export const OPERATOR_OPTIONS = ['=', '!=', '>', '<', 'contains', 'regex'];
export const EQUAL_OPERATOR_OPTIONS = ['=', '!='];

interface BaseFilterProps {
  onChange: (values: any) => void;
  collapsed?: boolean;
  children?: React.ReactNode;
  hasServiceFilter?: boolean;
  hasDurationFilter?: boolean;
  hasTagsFilter?: boolean;
  hasOptionsFilter?: boolean;
  hasLabelsFilter?: boolean;
  hasFieldsFilter?: boolean;
  columns?: any[];
}

const BaseFilter: React.FC<BaseFilterProps> = ({ 
  onChange, 
  collapsed, 
  children,
  hasServiceFilter = false,
  hasDurationFilter = false,
  hasTagsFilter = false,
  hasLabelsFilter = false,
  hasOptionsFilter = false,
  hasFieldsFilter = false,
  columns = []
}) => {
  const [services, setServices] = useState<string[]>([]);
  const [lokiLabels, setLokiLabels] = useState<string[]>([]);
  const [lokiFields, setLokiFields] = useState<string[]>([]);
  const [labelFilters, setLabelFilters] = useState<Array<{id: string, label: string, values: string[]}>>([]);
  const [fieldFilters, setFieldFilters] = useState<Array<{id: string, field: string, values: string[]}>>([]);
  const [form] = Form.useForm();
  const { selectedUid } = useAppSelector((state) => state.datasource);
  const location = useLocation();
  const pageName = location.pathname.split('/').filter(Boolean).join('_') || 'home';

  const fetchServices = async () => {
    const values = await lokiReadApi.getLabelValues('service_name');
    const serviceNames: string[] = Array.isArray(values) ? values : [];
    setServices(serviceNames);
  };

  const fetchLokiLabels = async () => {
    try {
      const labels = await lokiReadApi.getLabels();
      setLokiLabels(Array.isArray(labels) ? labels : []);
    } catch (error) {
      console.error('Error fetching Loki labels:', error);
      setLokiLabels([]);
    }
  };

  const fetchLokiFields = async () => {
    try {
      const fields = await lokiReadApi.getFields();
      setLokiFields(Array.isArray(fields) ? fields : []);
    } catch (error) {
      console.error('Error fetching Loki fields:', error);
      setLokiFields([]);
    }
  };

  useEffect(() => {
    if (hasServiceFilter) {
      fetchServices();
    }
    if (hasLabelsFilter) {
      fetchLokiLabels();
    }
    if (hasFieldsFilter) {
      fetchLokiFields();
    }
  }, [selectedUid, hasServiceFilter, hasLabelsFilter, hasFieldsFilter]);

  // Set initial form values from localStorage
  useEffect(() => {
    const pageState = getPageState(pageName);
    if (pageState && pageState.filters) {
      console.log('[BaseFilter] Setting initial form values from pageState:', pageState.filters);
      
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
                const values = await lokiReadApi.getLabelValues(filter.label);
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
        
        // Fetch values for each field that has a name
        const fetchFieldValues = async () => {
          for (const filter of fieldFiltersArray) {
            if (filter.field) {
              try {
                console.log(`[BaseFilter] Fetching values for initial field: ${filter.field}`);
                const values = await lokiReadApi.getFieldValue(filter.field);
                console.log(`[BaseFilter] Field values received for ${filter.field}:`, values);
                setFieldFilters(prev => prev.map(f => 
                  f.id === filter.id 
                    ? { ...f, values: Array.isArray(values) ? values : [] }
                    : f
                ));
              } catch (error) {
                console.error(`Error fetching field values for ${filter.field}:`, error);
              }
            }
          }
        };
        fetchFieldValues();
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
        const values = await lokiReadApi.getLabelValues(labelName);
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
  const handleFieldFilterChange = async (id: string, fieldName: string) => {
    setFieldFilters(fieldFilters.map(filter => 
      filter.id === id 
        ? { ...filter, field: fieldName, values: [] }
        : filter
    ));
    const currentFields = form.getFieldValue('fields') || {};
    currentFields[id] = { ...currentFields[id], value: undefined };
    form.setFieldsValue({ fields: currentFields });

    // Fetch values for the selected label
    if (fieldName) {
      try {
        const values = await lokiReadApi.getFieldValue(fieldName);
        setFieldFilters(fieldFilters.map(filter => 
          filter.id === id 
            ? { ...filter, field: fieldName, values: Array.isArray(values) ? values : [] }
            : filter
        ));
      } catch (error) {
        console.error(`Error fetching field values for ${fieldName}:`, error);
      }
    }
  };

  const handleApply = () => {
    const values = form.getFieldsValue();
    onChange(values);
  };

  return (
    <Form form={form} layout="vertical" onFinish={handleApply}>
      {hasServiceFilter && (
        <Form.Item label="Services">
        {collapsed ? (
          <Typography.Text type="secondary">
            
          </Typography.Text>
        ) : (
          <Space.Compact style={{ maxHeight: 32, width: '100%' }}>
            <Form.Item name={['filters', 'serviceNameOperator']} noStyle initialValue="=">
              <Select style={{ width: '25%' }}>
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
                style={{ width: '75%', maxHeight: 32 }}
              >
                {services.map((service) => (
                  <Option key={service} value={service}>
                    {service}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Space.Compact>
        )}
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
        <Row gutter={8} style={{ marginBottom: 16 }}>
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
                    loading={lokiLabels.length === 0}
                  >
                    {lokiLabels.map((label) => (
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
                    style={{ width: '100%', maxHeight: 16 }}
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
            style={{ width: '100%' }}
          >
            Add Label Filter
          </Button>
        </Col>
      </Row>
    )}

    {!collapsed && labelFilters.length > 0 && (
      <Row gutter={8} style={{ marginTop: 8 }}>
        <Col span={24}>
          <Button 
            type="dashed" 
            icon={<MinusOutlined />} 
            onClick={() => removeLabelFilter(labelFilters[labelFilters.length - 1].id)}
            danger
            style={{ width: '100%' }}
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
        <Row gutter={8} style={{ marginBottom: 16 }}>
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
                    loading={lokiFields.length === 0}
                  >
                    {lokiFields.map((field) => (
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
                    style={{ width: '100%', maxHeight: 16 }}
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
            style={{ width: '100%' }}
          >
            Add Field Filter
          </Button>
        </Col>
      </Row>
    )}

    {!collapsed && fieldFilters.length > 0 && (
      <Row gutter={8} style={{ marginTop: 8 }}>
        <Col span={24}>
          <Button 
            type="dashed" 
            icon={<MinusOutlined />} 
            onClick={() => removeFieldFilter(fieldFilters[fieldFilters.length - 1].id)}
            danger
            style={{ width: '100%' }}
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
                    <InputNumber min={0} style={{ width: '100%' }} />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item name={['options', 'interval']} label="Interval (ms)" initialValue={1000}>
                    <InputNumber min={0} style={{ width: '100%' }} />
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
                      <Select style={{ width: '100%' }}>
                        {columns.map((column) => (
                          <Option key={column.key} value={column.key}>
                            {column.title}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item name={['options', 'orderDirection']} label="Direction" initialValue={'desc'}>
                      <Select style={{ width: '100%' }}>
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

      <Form.Item style={{ marginTop: '16px' }}>
        <Button type="primary" htmlType="submit" block>
          Apply 
        </Button>
        <Button block style={{ marginTop: 8 }} onClick={() => form.resetFields()}>
          Reset
        </Button>
      </Form.Item>
    </Form>
  );
};

export default BaseFilter;
