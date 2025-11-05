import React from 'react';
import BaseFilter from '../../containers/base.filter';

interface ServiceFilterProps {
  onChange: (values: any) => void;
  columns?: any[];
  data?: any[];
}

const ServiceFilter: React.FC<ServiceFilterProps> = ({ onChange, columns, data }) => {
  
  return (
    <BaseFilter 
      columns={columns}
      hasServiceFilter={true}
      hasTypesFilter={true}
      hasDurationFilter={false}
      hasTagsFilter={false}
      hasLabelsFilter={false}
      hasFieldsFilter={false}
      hasOptionsFilter={false}
      data={data}
    >
      
    </BaseFilter>
  );
};

export default ServiceFilter;