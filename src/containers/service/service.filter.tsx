import React from 'react';
import BaseFilter from '../base.filter';

interface ServiceFilterProps {
  onChange: (values: any) => void;
  collapsed?: boolean;
  columns?: any[];
  data?: any[];
}

const ServiceFilter: React.FC<ServiceFilterProps> = ({ onChange, collapsed = true, columns, data }) => {
  
  return (
    <BaseFilter 
      onChange={onChange} 
      collapsed={collapsed}
      columns={columns}
      hasServiceFilter={false}
      hasDurationFilter={false}
      hasTagsFilter={false}
      hasLabelsFilter={false}
      hasFieldsFilter={false}
      hasOptionsFilter={false}
      data={data}
      datasourceType="tempo"
    >
      
    </BaseFilter>
  );
};

export default ServiceFilter;