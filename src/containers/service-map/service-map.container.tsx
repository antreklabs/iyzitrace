import React from 'react';
import BaseContainerComponent, { PageState } from '../base.container';
import ServiceMapFilter from './service-map.filter';
import ServiceMapExpandedRowComponent from '../../components/service-map/service-map.container.expanded-row.component';  
import { tempoReadApi } from '../../providers/api/tempo/tempo.api.read';
import { ServiceMapItem } from '../../interfaces/pages/service-map/service-map.response.interface';
import { getIntervalLabel } from '../../utils/extensions.utils';
import { ServiceMapRequestModel } from '@/interfaces/pages/service-map/service-map.request.interface';

const ServiceMapContainer: React.FC = () => {
  const fetchModelData = async (pageState?: PageState | null): Promise<ServiceMapItem[]> => {
    const selectedOptions = pageState?.filters?.options;
    const intervalMs = selectedOptions?.interval || 1000;
    const interval = getIntervalLabel(intervalMs);
    // Use 24 hours range to ensure we have data
    const [rangeStart, rangeEnd] = pageState?.range || [Date.now() - 24 * 60 * 60 * 1000, Date.now()];

    const requestModel: ServiceMapRequestModel = {
      start: rangeStart,
      end: rangeEnd,
      interval: interval,
      intervalMs: intervalMs,
      timezone: 'UTC'
    };

    try {
      const apiResult = await tempoReadApi.query({...requestModel});
      console.log('[ServiceMapContainer] tempoReadApi.query result:', apiResult);

      return apiResult.list;
    } catch (e) {
      console.error('[ServiceMapContainer] tempoReadApi.query error:', e);
    }
    
    return [];    
  };

  const expandedRowRender = (record: any) => {
    return <ServiceMapExpandedRowComponent record={record} />;
  };

  const columns = [
    {
      title: 'Service',
      dataIndex: 'service',
      key: 'service',
      width: 200,
      render: (service: string, record: ServiceMapItem) => (
        <div>
          <div style={{ fontWeight: 'bold', color: '#1890ff' }}>{service}</div>
          {record.operation && (
            <div style={{ fontSize: '12px', color: '#666' }}>{record.operation}</div>
          )}
        </div>
      ),
      sorter: (a: ServiceMapItem, b: ServiceMapItem) => a.service.localeCompare(b.service),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => (
        <span style={{
          backgroundColor: type === 'service' ? '#52c41a' : '#1890ff',
          color: 'white',
          padding: '2px 8px',
          borderRadius: '4px',
          fontSize: '12px'
        }}>
          {type.toUpperCase()}
        </span>
      ),
      filters: [
        { text: 'Service', value: 'service' },
        { text: 'Operation', value: 'operation' },
      ],
      onFilter: (value: any, record: ServiceMapItem) => record.type === value,
    },
    {
      title: 'Request Count',
      dataIndex: 'requestCount',
      key: 'requestCount',
      width: 120,
      render: (count: number) => count.toLocaleString(),
      sorter: (a: ServiceMapItem, b: ServiceMapItem) => a.requestCount - b.requestCount,
    },
    {
      title: 'Error Rate',
      dataIndex: 'errorRate',
      key: 'errorRate',
      width: 100,
      render: (rate: number) => (
        <span style={{
          color: rate > 5 ? '#ff4d4f' : rate > 1 ? '#faad14' : '#52c41a'
        }}>
          {rate.toFixed(2)}%
        </span>
      ),
      sorter: (a: ServiceMapItem, b: ServiceMapItem) => a.errorRate - b.errorRate,
    },
    {
      title: 'Avg Latency',
      dataIndex: 'avgLatency',
      key: 'avgLatency',
      width: 120,
      render: (latency: number) => `${latency.toFixed(2)}ms`,
      sorter: (a: ServiceMapItem, b: ServiceMapItem) => a.avgLatency - b.avgLatency,
    },
    {
      title: 'P95 Latency',
      dataIndex: 'p95Latency',
      key: 'p95Latency',
      width: 120,
      render: (latency: number) => `${latency.toFixed(2)}ms`,
      sorter: (a: ServiceMapItem, b: ServiceMapItem) => a.p95Latency - b.p95Latency,
    },
    {
      title: 'Last Seen',
      dataIndex: 'lastSeen',
      key: 'lastSeen',
      width: 150,
      render: (lastSeen: string) => new Date(lastSeen).toLocaleString(),
      sorter: (a: ServiceMapItem, b: ServiceMapItem) => new Date(a.lastSeen).getTime() - new Date(b.lastSeen).getTime(),
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