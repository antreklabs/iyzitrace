import React, { useState } from 'react';
import { Button, Form, Select, Input, Space, Divider } from 'antd';
import { FilterOutlined, CloseOutlined, SearchOutlined } from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';

const { Option } = Select;


const FilterHeaderBar = () => {
  const [expanded, setExpanded] = useState(false);
  const [form] = Form.useForm();

  return (
    <motion.div
      initial={{ width: '160px' }}
      animate={{ width: expanded ? '100%' : '160px' }}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
      className="filter-header-bar"
    >
      {expanded && (
        <Form
          layout="vertical"
          form={form}
          onFinish={(values) => console.log('Form values', values)}
          style={{ display: 'flex', flexWrap: 'nowrap', alignItems: 'center', gap: 8,paddingTop:10 }}
          colon={false}
        >
          <AnimatePresence>
            <motion.div
              key="filter-fields"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              style={{ display: 'flex', gap: 8 }}
            >
              <Form.Item label="Service Name">
                <Space align="center">
                  <Select defaultValue="=" style={{ width: 60 }}>
                    <Option value="=">=</Option>
                    <Option value="!=">!=</Option>
                  </Select>

                  <Select placeholder="Select value" style={{ width: 200 }}>
                    <Option value="auth-service">auth-service</Option>
                    <Option value="payment-service">payment-service</Option>
                  </Select>
                </Space>
              </Form.Item>
      <Divider type="vertical" className='form-divider'  />
              <Form.Item name="spanOp" label="Span Name">
                <Space align="center">
                  <Select defaultValue="=" style={{ width: 60 }}>
                    <Option value="=">=</Option>
                    <Option value="!=">!=</Option>
                  </Select>

                  <Select placeholder="Select value" style={{ width: 200 }}>
                    <Option value="auth-service">auth-service</Option>
                    <Option value="payment-service">payment-service</Option>
                  </Select>
                </Space>
              </Form.Item>
              <Divider type="vertical" className='form-divider'  />
              <Form.Item name="statusOp" label="Status">
                <Space align="center">
              
                  <Select defaultValue="=" style={{ width: 60 }}>
                    <Option value="=">=</Option>
                    <Option value="!=">!=</Option>
                  </Select>

                  <Select placeholder="Select value" style={{ width: 200 }}>
                    <Option value="error">error</Option>
                    <Option value="unset">unset</Option>
                    <Option value="ok">ok</Option>
                  </Select>
                </Space>
              </Form.Item>
              <Divider type="vertical" className='form-divider'  />
              <Form.Item name="duration" label="Duration">
                <Space align="center">
                  <Select defaultValue="span" style={{ width: 60 }}>
                    <Option value="span">span</Option>
                    <Option value="trace">trace</Option>
                  </Select>
                  <Select defaultValue=">" style={{ width: 60 }}>
                    <Option value=">">{'>'}</Option>
                    <Option value="<">{'<'}</Option>
                  </Select>
                  <Input style={{ width: 100 }} placeholder="e.g 1000ms,1.2s" />
                  <Select defaultValue="<" style={{ width: 60 }}>
                     <Option value=">">{'>'}</Option>
                    <Option value="<">{'<'}</Option>
                  </Select>
                  <Input style={{ width: 100 }} placeholder="e.g 1000ms,1.2s" />
                </Space>
              </Form.Item>
              <Divider type="vertical" className='form-divider'  />
              <Form.Item name="duration" label="Tags">
                <Space align="center">
                  <Select defaultValue="span" style={{ width: 60 }}>
                    <Option value="span">span</Option>
                    <Option value="resources">resources</Option>
                    <Option value="unscoped">unscoped</Option>

                  </Select>
                  <Select defaultValue="span" style={{ width: 60 }}>
                    <Option value="span">span</Option>
                    <Option value="resources">resources</Option>
                    <Option value="unscoped">unscoped</Option>

                  </Select>
                  <Select defaultValue=">" style={{ width: 60 }}>
                    <Option value=">">{'>'}</Option>
                    <Option value="<">{'<'}</Option>
                  </Select>
                  <Input style={{ width: 100 }} placeholder="e.g 1000ms,1.2s" />
                </Space>
              </Form.Item>
               <Form.Item style={{marginTop:24}}>
                <Space>
                  <Button type="primary"  icon={<SearchOutlined />}>
                   </Button>
                  <Button danger icon={<CloseOutlined />} onClick={() => setExpanded(false)} />
                </Space>
              </Form.Item>
            </motion.div>
          </AnimatePresence>
        </Form>
      )}
      {!expanded && (
        <Button type="default" icon={<FilterOutlined />} onClick={() => setExpanded(true)}>
          Filters
        </Button>
      )}
    </motion.div>
  );
};

export default FilterHeaderBar;
