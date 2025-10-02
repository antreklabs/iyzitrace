import React from 'react';
import BaseFilter from '../base.filter';
import { Form, Select, Space } from 'antd';
import { EQUAL_OPERATOR_OPTIONS, Option } from '../base.filter';

interface LogFilterProps {
  onChange: (values: any) => void;
  collapsed?: boolean;
  columns?: any[];
  levels?: string[];
}

const LogFilter: React.FC<LogFilterProps> = ({ onChange, collapsed, columns, levels }) => {

  return (
    <BaseFilter 
      onChange={onChange} 
      collapsed={collapsed}
      columns={columns}
      hasServiceFilter={true}
      hasDurationFilter={false}
      hasTagsFilter={false}
      hasLabelsFilter={true}
      hasFieldsFilter={true}
      hasOptionsFilter={true}
    >
      {levels?.length > 0 && (
      <Form.Item label="Levels">
        {(
          <Space.Compact style={{ maxHeight: 32, width: '100%' }}>
            <Form.Item name={['filters', 'levelOperator']} noStyle initialValue="=">
              <Select style={{ width: '25%' }}>
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
                style={{ width: '75%', maxHeight: 32 }}
              >
                {levels.map((level) => (
                  <Option key={level} value={level}>
                    {level}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            </Space.Compact>
          )}
          </Form.Item>
        )}
    </BaseFilter>
  );
};

export default LogFilter;