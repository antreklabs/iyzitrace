import React from 'react';
import BaseFilter from '../base.filter';

interface TraceFilterProps {
  onChange: (values: any) => void;
  columns?: any[];
  data?: any[];
}

const TraceFilter: React.FC<TraceFilterProps> = ({ onChange, columns, data }) => {
  
  return (
    <BaseFilter 
      onChange={onChange} 
      columns={columns}
      hasServiceFilter={true}
      hasOperationsFilter={true}
      hasStatusesFilter={true}
      hasDurationFilter={true}
      hasTagsFilter={true}
      hasLabelsFilter={true}
      hasFieldsFilter={true}
      hasOptionsFilter={true}
      data={data}
      datasourceType="tempo"
    >
      
    </BaseFilter>
  );
};

export default TraceFilter;
