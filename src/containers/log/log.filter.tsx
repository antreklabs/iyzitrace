import React from 'react';
import BaseFilter from '../base.filter';

interface LogFilterProps {
  onChange: (values: any) => void;
  collapsed?: boolean;
}

const LogFilter: React.FC<LogFilterProps> = ({ onChange, collapsed }) => {
  return (
    <BaseFilter 
      onChange={onChange} 
      collapsed={collapsed}
      hasServiceFilter={true}
      hasSpanFilter={true}
      hasStatusFilter={true}
      hasDurationFilter={true}
      hasTagsFilter={true}
      hasOptionsFilter={true}
    >
      {/* Log-specific filters can be added here */}
    </BaseFilter>
  );
};

export default LogFilter;