import React from 'react';
import BaseFilter from '../base.filter';

interface ServiceFilterProps {
  onChange: (values: any) => void;
  collapsed?: boolean;
  columns?: any[];
  data?: any[];
}

const ServiceFilter: React.FC<ServiceFilterProps> = ({ onChange, collapsed, columns, data }) => {
  
  return (
    <BaseFilter 
      onChange={onChange} 
      collapsed={collapsed}
      columns={columns}
      hasServiceFilter={true}
      hasDurationFilter={true}
      hasTagsFilter={true}
      hasLabelsFilter={true}
      hasFieldsFilter={false}
      hasOptionsFilter={true}
      data={data}
      datasourceType="tempo"
    >
      
    </BaseFilter>
  );
};

export default ServiceFilter;