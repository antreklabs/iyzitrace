import React from 'react';
import BaseContainerComponent, { FilterParamsModel } from '../base.container';
import BaseFilter from '../base.filter';

const ServiceMapContainer: React.FC = () => {
  const columns = [
    {
      title: 'Service',
      dataIndex: 'service',
      key: 'service',
      width: 220
    },
    { title: 'Avg. Latency', dataIndex: 'avgLatency', key: 'avgLatency', width: 140, sorter: (a: any, b: any) => (a.avgLatency ?? 0) - (b.avgLatency ?? 0), render: (v: number) => `${(v ?? 0).toFixed(2)} ms` },
    { title: 'Min. Latency', dataIndex: 'minLatency', key: 'minLatency', width: 140, sorter: (a: any, b: any) => (a.minLatency ?? 0) - (b.minLatency ?? 0), render: (v: number) => `${(v ?? 0).toFixed(2)} ms` },
    { title: 'Max. Latency', dataIndex: 'maxLatency', key: 'maxLatency', width: 140, sorter: (a: any, b: any) => (a.maxLatency ?? 0) - (b.maxLatency ?? 0), render: (v: number) => `${(v ?? 0).toFixed(2)} ms` },
    { title: 'Count', dataIndex: 'count', key: 'count', width: 100, sorter: (a: any, b: any) => (a.count ?? 0) - (b.count ?? 0) },
  ];

  const mockData = [
    {
      service: 'Service 1',
      avgLatency: 1000,
      minLatency: 500,
      maxLatency: 1500,
      count: 100
    },
    {
      service: 'Service 2',
      avgLatency: 800,
      minLatency: 400,
      maxLatency: 1200,
      count: 150
    },
  ];
  const fetchModelData = async (filterModel: FilterParamsModel) => {
    console.log('ServiceMapContainer fetchModelData called with filterModel:', filterModel);
    return mockData;
  };

  return (
    <BaseContainerComponent
      title="Service Map"
      initialFilterCollapsed={false}
      onFetchData={fetchModelData}
      columns={columns}
      filterComponent={
        <BaseFilter 
          onApply={() => {
            // URL güncellendikten sonra fetchModelData otomatik tetiklenecek
            // Burada sadece console log yazdıralım
            // console.log('BaseFilter Apply button clicked');
          }}
          hasServiceFilter={true}
          hasOperationsFilter={true}
          hasStatusesFilter={true}
          hasDurationFilter={true}
          hasTagsFilter={true}
          hasOptionsFilter={true}
          hasLabelsFilter={true}
          hasFieldsFilter={true}
          hasTypesFilter={true}
          datasourceType="tempo"
          columns={columns}
          data={mockData}
        />
      }
    >
        
    </BaseContainerComponent>
  );
};


export default ServiceMapContainer;