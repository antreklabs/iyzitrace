import React, { useEffect, useState } from 'react';
import { Select, Input, Button, Divider, Form, Row, Col, InputNumber, Switch, Typography } from 'antd';
import { TempoApi } from '../../providers';
import { useAppSelector } from '../../store/hooks';

const { Option } = Select;

const OPERATOR_OPTIONS = ['=', '!=', '>', '<', 'contains', 'regex'];

interface TraceFiltersProps {
  onChange: (values: any) => void;
  collapsed?: boolean;
}




const TraceFilters: React.FC<TraceFiltersProps> = ({ onChange, collapsed }) => {
  
  const [services, setServices] = useState<string[]>([]);
  const [spanNames, setSpanNames] = useState<string[]>([]);
  const [status, setStatus] = useState<string[]>([]);
  const [form] = Form.useForm();
  const [selectedService, setSelectedService] = useState<string[]>([]);
  const { selectedTempoUid } = useAppSelector((state) => state.tempo);

  const fetchServices = async () => {
    console.log('Fetching services...');
    const res = await TempoApi.getServiceNames();
    console.log('Services:', res);
    const values = res.values;
    const serviceNames: string[] = Array.isArray(values) ? values : [];
    setServices(serviceNames);
  };

  const fetchSpanNames = async (services: string[]) => {
    if (!services) {
      return;
    }
    const [operations, status] = await Promise.all([
      TempoApi.getOperationNames(services),
      TempoApi.getStatusByServiceName(services),
    ]);
    const operationsValues = operations.values;
    const statusValues = status.values;
    const spanNames: any[] = Array.isArray(operationsValues) ? operationsValues : [];
    const statusArray: any[] = Array.isArray(statusValues) ? statusValues : [];
    setSpanNames(Array.from(new Set(spanNames)));
    setStatus(Array.from(new Set(statusArray)));
  };

  useEffect(() => {
    fetchServices();
  }, [selectedTempoUid]);

  const handleServiceChange = (value: string[]) => {
    console.log('Selected service:', value);
    setSelectedService(value);
    fetchSpanNames(value);
    form.setFieldsValue({ spanName: undefined });
  };

  const handleApply = () => {
    const values = form.getFieldsValue();
    onChange(values);
  };

  return (
    <Form form={form} layout="vertical" onFinish={handleApply}>
      <Form.Item label="Services">
        {collapsed ? (
          <Typography.Text type="secondary">
            {selectedService.length > 0 ? selectedService.length + ' Select' : 'All'}
          </Typography.Text>
        ) : (
          <Input.Group compact style={{ maxHeight: 32 }}>
            <Form.Item name={['filters', 'serviceNameOperator']} noStyle initialValue="=">
              <Select style={{ width: '25%' }}>
                {OPERATOR_OPTIONS.map((op) => (
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
                onChange={handleServiceChange}
                mode="multiple"
                maxTagCount={1}
                maxTagTextLength={10}
              >
                {services.map((service) => (
                  <Option key={service} value={service}>
                    {service}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Input.Group>
        )}
      </Form.Item>

      <Form.Item label="Spans">
        {collapsed ? (
          <Typography.Text type="secondary">
            {form.getFieldValue('spanName')?.length > 0 ? form.getFieldValue('spanName').length + ' Select' : 'All'}
          </Typography.Text>
        ) : (
          <Input.Group compact>
            <Form.Item name={['filters', 'spanNameOperator']} noStyle initialValue="=">
              <Select style={{ width: '25%' }}>
                {OPERATOR_OPTIONS.map((op) => (
                  <Option key={op} value={op}>
                    {op}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name={['filters', 'spanName']} noStyle>
              <Select
                allowClear
                placeholder="Select span"
                style={{ width: '75%' }}
                mode="multiple"
                maxTagCount={1}
                maxTagTextLength={10}
              >
                {spanNames.map((span) => (
                  <Option key={span} value={span}>
                    {span}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Input.Group>
        )}
      </Form.Item>

      <Form.Item label="Status">
        {collapsed ? (
          <Typography.Text type="secondary">
            {form.getFieldValue('status')?.length > 0 ? form.getFieldValue('status').length + ' Select' : 'All'}
          </Typography.Text>
        ) : (
          <Input.Group compact>
            <Form.Item name={['filters', 'statusOperator']} noStyle initialValue="=">
              <Select style={{ width: '25%' }}>
                {['=', '!='].map((op) => (
                  <Option key={op} value={op}>
                    {op}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name={['filters', 'status']} noStyle>
              <Select placeholder="Select status" allowClear style={{ width: '75%' }}>
                {status.map((state) => (
                  <Option key={state} value={state}>
                    {state}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Input.Group>
        )}
      </Form.Item>

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
                  {['=', '!='].map((op) => (
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

      <Divider orientation={collapsed ? 'left':'center'}>Options</Divider>

      <Row gutter={8}>
        {
            collapsed ? (
                <Typography.Text type="secondary">
                {form.getFieldValue('options')?.length > 0
                    ? form.getFieldValue('options').length + ' Select'
                    : 'All'}
                </Typography.Text>
            ) : (
                <>
                <Col span={12}>
                    <Form.Item name={['options', 'start']} label="Start" initialValue={0}>
                    <InputNumber min={0} style={{ width: '100%' }} />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item name={['options', 'end']} label="End" initialValue={0}>
                    <InputNumber min={0} style={{ width: '100%' }} />
                    </Form.Item>
                </Col>
                </>
            )
        }
      </Row>

      <Form.Item name={['options', 'step']} label="Step (sec)" initialValue={60}>
        {
            collapsed ? (
                <Typography.Text type="secondary">
                {form.getFieldValue('step')?.length > 0 ? form.getFieldValue('step').length + ' Select' : 'All'}
                </Typography.Text>
            ) : (
                <InputNumber min={1} style={{ width: '100%' }} />
            )
        }
      </Form.Item>

      <Form.Item name={['options', 'streaming']} label="Streaming" valuePropName="checked" initialValue={false}>
        <Switch />
      </Form.Item>

      <Form.Item>
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

export default TraceFilters;
