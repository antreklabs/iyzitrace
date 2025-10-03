import React from 'react';
import BaseFilter from '../base.filter';
import { Form, Select, Space } from 'antd';
import { EQUAL_OPERATOR_OPTIONS, Option } from '../base.filter';
import { getPageState } from '../base.container';
import { useLocation } from 'react-router-dom';
import '../../assets/styles/pages/log/log.filter.css';

interface LogFilterProps {
  onChange: (values: any) => void;
  collapsed?: boolean;
  columns?: any[];
  data?: any[];
}

const LogFilter: React.FC<LogFilterProps> = ({ onChange, collapsed, columns, data }) => {
  const location = useLocation();
  const pageName = location.pathname.split('/').filter(Boolean).join('_') || 'home';
  const levels = ['ERROR', 'WARN', 'INFO', 'DEBUG'];

  // Simple function to add level filter to expression
  const handleExpressionUpdate = (labelExpressionParts: string[], expression: string) => {
    const pageState = getPageState(pageName);
    const selectedLevel = pageState?.filters?.filters?.level;
    const levelOperator = pageState?.filters?.filters?.levelOperator || '=';
    
    if (selectedLevel) {
      // Add level filter to parts
      const updatedParts = [...labelExpressionParts, `level${levelOperator}"${selectedLevel}"`];
      const updatedExpression = `{${updatedParts.join(',')}}`;
      
      // Call the callback with updated values
      return { labelExpressionParts: updatedParts, expression: updatedExpression };
    }
    
    return { labelExpressionParts, expression };
  };

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
      data={data}
      onExpressionUpdate={handleExpressionUpdate}
    >
      {levels?.length > 0 && (
      <Form.Item label="Levels">
        {(
          <Space.Compact className="log-filter-level-compact-space">
            <Form.Item name={['filters', 'levelOperator']} noStyle initialValue="=">
              <Select className="log-filter-level-operator-select">
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
                className="log-filter-level-value-select"
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