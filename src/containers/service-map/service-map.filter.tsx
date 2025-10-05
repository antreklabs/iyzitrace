import React from 'react';
import BaseFilter from '../base.filter';

interface ServiceMapFilterProps {
  onChange: (values: any) => void;
  collapsed?: boolean;
  columns?: any[];
  data?: any[];
}

const ServiceMapFilter: React.FC<ServiceMapFilterProps> = ({ onChange, collapsed, columns, data }) => {


  return (
    <BaseFilter 
      onChange={onChange} 
      collapsed={collapsed}
      columns={columns}
      hasServiceFilter={true}
      hasDurationFilter={false}
      hasTagsFilter={false}
      hasLabelsFilter={false}
      hasFieldsFilter={false}
      hasOptionsFilter={false}
      datasourceType="tempo"
      data={data}
    >
      
    </BaseFilter>
  );
};

export default ServiceMapFilter;