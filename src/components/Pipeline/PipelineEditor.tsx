import React, { useEffect, useState } from 'react';
import { Form, Input, Button, Space, Card, Typography, Switch, Select, InputNumber } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { LogPipeline, PipelineFilter, PipelineProcessor } from '../../interfaces/pipeline.interface';

const { Text } = Typography;
const { Option } = Select;

interface PipelineEditorProps {
  pipeline?: LogPipeline | null;
  onSave: (pipeline: Omit<LogPipeline, 'id' | 'createdAt' | 'updatedAt' | 'version'>) => void;
  onCancel: () => void;
}

const PipelineEditor: React.FC<PipelineEditorProps> = ({ pipeline, onSave, onCancel }) => {
  const [form] = Form.useForm();
  const [filters, setFilters] = useState<PipelineFilter[]>(pipeline?.filters || []);
  const [processors, setProcessors] = useState<PipelineProcessor[]>(pipeline?.processors || []);

  // Sync incoming pipeline when popup opens or selected row changes
  useEffect(() => {
    form.resetFields();
    if (pipeline) {
      form.setFieldsValue({
        name: pipeline.name,
        description: pipeline.description,
        streamName: pipeline.output?.config?.stream || 'processed_logs'
      });
      setFilters(pipeline.filters || []);
      setProcessors(pipeline.processors || []);
    } else {
      form.setFieldsValue({ name: undefined, description: undefined, streamName: 'processed_logs' });
      setFilters([]);
      setProcessors([]);
    }
  }, [pipeline]);

  const handleSubmit = (values: any) => {
    const pipelineData = {
      ...values,
      filters,
      processors,
      enabled: true,
      output: {
        type: 'loki' as const,
        config: {
          stream: values.streamName || 'processed_logs',
          labels: {}
        }
      },
      createdBy: 'current-user'
    };
    onSave(pipelineData);
  };

  const addFilter = () => {
    const newFilter: PipelineFilter = {
      id: `filter_${Date.now()}`,
      type: 'label',
      field: '',
      operator: 'equals',
      value: '',
      enabled: true
    };
    setFilters([...filters, newFilter]);
  };

  const updateFilter = (index: number, updates: Partial<PipelineFilter>) => {
    const newFilters = [...filters];
    newFilters[index] = { ...newFilters[index], ...updates };
    setFilters(newFilters);
  };

  const removeFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  const addProcessor = () => {
    const newProcessor: PipelineProcessor = {
      id: `processor_${Date.now()}`,
      type: 'parse_attributes',
      config: {},
      enabled: true,
      order: processors.length
    };
    setProcessors([...processors, newProcessor]);
  };

  const updateProcessor = (index: number, updates: Partial<PipelineProcessor>) => {
    const newProcessors = [...processors];
    newProcessors[index] = { ...newProcessors[index], ...updates };
    setProcessors(newProcessors);
  };

  const removeProcessor = (index: number) => {
    setProcessors(processors.filter((_, i) => i !== index));
  };

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={pipeline}
      onFinish={handleSubmit}
    >
      <Form.Item
        name="name"
        label="Pipeline Name"
        rules={[{ required: true, message: 'Please enter pipeline name' }]}
      >
        <Input placeholder="e.g., Nginx Logs" />
      </Form.Item>

      <Form.Item
        name="description"
        label="Description"
      >
        <Input.TextArea placeholder="Describe what this pipeline does" />
      </Form.Item>

      <Form.Item
        name="streamName"
        label="Output Stream Name"
        rules={[{ required: true, message: 'Please enter stream name' }]}
      >
        <Input placeholder="processed_logs" />
      </Form.Item>

      {/* Filters Section */}
      <Card title="Filters" size="small" style={{ marginBottom: 16 }}>
        <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
          Define conditions to filter logs before processing
        </Text>
        
        {filters.map((filter, index) => (
          <Card key={filter.id} size="small" style={{ marginBottom: 8 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Space wrap>
                <Select
                  value={filter.field}
                  onChange={(value) => updateFilter(index, { field: value })}
                  placeholder="Field"
                  style={{ width: 120 }}
                >
                  <Option value="service">service</Option>
                  <Option value="level">level</Option>
                  <Option value="environment">environment</Option>
                  <Option value="message">message</Option>
                  <Option value="attributes.service">attributes.service</Option>
                  <Option value="attributes.level">attributes.level</Option>
                </Select>
                
                <Select
                  value={filter.operator}
                  onChange={(value) => updateFilter(index, { operator: value })}
                  style={{ width: 100 }}
                >
                  <Option value="equals">equals</Option>
                  <Option value="contains">contains</Option>
                  <Option value="regex">regex</Option>
                  <Option value="exists">exists</Option>
                  <Option value="not_exists">not_exists</Option>
                </Select>
                
                <Input
                  value={filter.value}
                  onChange={(e) => updateFilter(index, { value: e.target.value })}
                  placeholder="Value"
                  style={{ width: 150 }}
                />
                
                <Switch
                  checked={filter.enabled}
                  onChange={(checked) => updateFilter(index, { enabled: checked })}
                />
                
                <Button
                  type="text"
                  icon={<DeleteOutlined />}
                  onClick={() => removeFilter(index)}
                  danger
                />
              </Space>
            </Space>
          </Card>
        ))}
        
        <Button type="dashed" icon={<PlusOutlined />} onClick={addFilter} block>
          Add Filter
        </Button>
      </Card>

      {/* Processors Section */}
      <Card title="Processors" size="small" style={{ marginBottom: 16 }}>
        <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
          Define steps to process and transform logs
        </Text>
        
        {processors.map((processor, index) => (
          <Card key={processor.id} size="small" style={{ marginBottom: 8 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Space wrap>
                <Select
                  value={processor.type}
                  onChange={(value) => updateProcessor(index, { type: value })}
                  style={{ width: 150 }}
                >
                  <Option value="parse_attributes">Parse Attributes</Option>
                  <Option value="parse_json">Parse JSON</Option>
                  <Option value="remove_field">Remove Field</Option>
                  <Option value="add_field">Add Field</Option>
                  <Option value="transform">Transform</Option>
                </Select>
                
                <InputNumber
                  value={processor.order}
                  onChange={(value) => updateProcessor(index, { order: value || 0 })}
                  placeholder="Order"
                  style={{ width: 80 }}
                  min={0}
                />
                
                <Switch
                  checked={processor.enabled}
                  onChange={(checked) => updateProcessor(index, { enabled: checked })}
                />
                
                <Button
                  type="text"
                  icon={<DeleteOutlined />}
                  onClick={() => removeProcessor(index)}
                  danger
                />
              </Space>
              
              {/* Processor-specific config */}
              {processor.type === 'parse_attributes' && (
                <Space wrap>
                  <Input
                    placeholder="Field to parse"
                    value={processor.config.field || ''}
                    onChange={(e) => updateProcessor(index, { 
                      config: { ...processor.config, field: e.target.value }
                    })}
                    style={{ width: 150 }}
                  />
                  <Input
                    placeholder="Regex pattern"
                    value={processor.config.pattern || ''}
                    onChange={(e) => updateProcessor(index, { 
                      config: { ...processor.config, pattern: e.target.value }
                    })}
                    style={{ width: 200 }}
                  />
                </Space>
              )}
              
              {processor.type === 'parse_json' && (
                <Space wrap>
                  <Input
                    placeholder="Field to parse"
                    value={processor.config.field || ''}
                    onChange={(e) => updateProcessor(index, { 
                      config: { ...processor.config, field: e.target.value }
                    })}
                    style={{ width: 150 }}
                  />
                  <Input
                    placeholder="Target field name"
                    value={processor.config.targetField || ''}
                    onChange={(e) => updateProcessor(index, { 
                      config: { ...processor.config, targetField: e.target.value }
                    })}
                    style={{ width: 150 }}
                  />
                </Space>
              )}
              
              {processor.type === 'remove_field' && (
                <Input
                  placeholder="Field to remove"
                  value={processor.config.field || ''}
                  onChange={(e) => updateProcessor(index, { 
                    config: { ...processor.config, field: e.target.value }
                  })}
                  style={{ width: 200 }}
                />
              )}
              
              {processor.type === 'add_field' && (
                <Space wrap>
                  <Input
                    placeholder="Field name"
                    value={processor.config.field || ''}
                    onChange={(e) => updateProcessor(index, { 
                      config: { ...processor.config, field: e.target.value }
                    })}
                    style={{ width: 120 }}
                  />
                  <Input
                    placeholder="Field value"
                    value={processor.config.value || ''}
                    onChange={(e) => updateProcessor(index, { 
                      config: { ...processor.config, value: e.target.value }
                    })}
                    style={{ width: 150 }}
                  />
                </Space>
              )}
              
              {processor.type === 'transform' && (
                <Input.TextArea
                  placeholder="JavaScript expression (e.g., { ...log, newField: 'value' })"
                  value={processor.config.expression || ''}
                  onChange={(e) => updateProcessor(index, { 
                    config: { ...processor.config, expression: e.target.value }
                  })}
                  style={{ width: '100%' }}
                  rows={2}
                />
              )}
            </Space>
          </Card>
        ))}
        
        <Button type="dashed" icon={<PlusOutlined />} onClick={addProcessor} block>
          Add Processor
        </Button>
      </Card>

      <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
        <Button onClick={onCancel}>
          Cancel
        </Button>
        <Button type="primary" htmlType="submit">
          {pipeline ? 'Update' : 'Create'} Pipeline
        </Button>
      </Space>
    </Form>
  );
};

export default PipelineEditor;
