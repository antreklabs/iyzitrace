import React from 'react';
import BaseContainerComponent from '../base.container';
import BaseFilter from '../base.filter';

const ServiceMapContainer: React.FC = () => {
  return (
    <BaseContainerComponent
      datasourceType="tempo"
      title="Service Map"
      initialFilterCollapsed={true}
      filterComponent={
        <BaseFilter 
          onChange={() => {}} 
          hasServiceFilter={true}
          hasTypesFilter={true}
          hasTagsFilter={true}
          hasLabelsFilter={true}
          datasourceType="tempo"
        />
      }
    >
        
    </BaseContainerComponent>
  );
};


export default ServiceMapContainer;