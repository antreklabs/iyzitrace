import React from 'react';
import BaseFilter from '../base.filter';

interface LogFilterProps {
  onChange: (values: any) => void;
  collapsed?: boolean;
  columns?: any[];
}

const LogFilter: React.FC<LogFilterProps> = ({ onChange, collapsed, columns }) => {
  return (
    <BaseFilter 
      onChange={onChange} 
      collapsed={collapsed}
      columns={columns}
      hasServiceFilter={false}
      hasSpanFilter={false}
      hasStatusFilter={false}
      hasDurationFilter={false}
      hasTagsFilter={false}
      hasOptionsFilter={true}
    >
    </BaseFilter>
  );
};

export default LogFilter;