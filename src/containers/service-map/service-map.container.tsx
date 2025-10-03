import React from 'react';
import BaseContainerComponent, { PageState } from '../base.container';
import ServiceMapFilter from './service-map.filter';
import ServiceMapExpandedRowComponent from '../../components/service-map/service-map.container.expanded-row.component';  

const ServiceMapContainer: React.FC = () => {
  const fetchModelData = async (pageState?: PageState | null): Promise<any[]> => {
    
    return [];
  };

  const expandedRowRender = (record: any) => {
    return <ServiceMapExpandedRowComponent record={record} />;
  };

  const columns = [
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 180,
      render: (timestamp: string) => new Date(timestamp).toLocaleString(),
      sorter: (a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    },
    {
      title: 'Service',
      dataIndex: 'service',
      key: 'service',
      width: 150,
      render: (service: string) => (
        <span>
          {service}
        </span>
      ),
    }
  ];

  return (
    <BaseContainerComponent
      title="Service Map"
      onFetchData={fetchModelData}
      onExpandedRowRender={expandedRowRender}
      columns={columns}
      filterComponent={<ServiceMapFilter onChange={fetchModelData} collapsed={false} columns={columns} />}
      datasourceType="tempo"
    />
  );
};

export default ServiceMapContainer;