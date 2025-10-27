import React from 'react';
import BaseFilter from '../base.filter';
import { Form, Select, Space } from 'antd';
import { EQUAL_OPERATOR_OPTIONS, Option } from '../base.filter';
import '../../assets/styles/pages/log/log.filter.css';

interface LogFilterProps {
  onChange: (values: any) => void;
  collapsed?: boolean;
  columns?: any[];
  data?: any[];
}

const LogFilter: React.FC<LogFilterProps> = ({ onChange, collapsed, columns, data }) => {
  const levels = ['ERROR', 'WARN', 'INFO', 'DEBUG'];

  const handleExpressionUpdate = (labelExpressionParts: string[], expression: string) => {
    return { labelExpressionParts, expression };
  };

  return (
    <BaseFilter 
      onApply={onChange} 
      columns={columns}
      hasServiceFilter={true}
      hasDurationFilter={false}
      hasTagsFilter={false}
      hasLabelsFilter={true}
      hasFieldsFilter={true}
      hasOptionsFilter={true}
      data={data}
      datasourceType="loki"
      onExpressionUpdate={handleExpressionUpdate}
    >
      {levels?.length > 0 && (
      <Form.Item label="Levels">
        {(
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