import React from 'react';
import BaseContainerComponent from '../base.container';
import LogFilter from './log.filter';
import LogExpandedRowComponent from '../../components/log/log.container.expanded-row.component';
import { lokiReadApi } from '../../providers/api/loki/loki.api.read';
import { LogsRequestModel } from '../../interfaces/pages/logs/logs.request.interface';
import { getIntervalLabel } from '../../utils/extensions.utils';
import '../../assets/styles/pages/log/log.container.css';

const LogContainer: React.FC = () => {
  const fetchModelData = async () => {
    let expr = '{service_namespace="opentelemetry-demo"}';
    
    // console.log('[LogContainer] Using LogQL expression from pageState:', expr);
    
    const limit = 100;
    const intervalMs = 1000;
    const interval = getIntervalLabel(intervalMs);
    const orderBy = 'timestamp';
    const orderDirection = 'desc';
    const [rangeStart, rangeEnd] = [Date.now() - 15 * 60 * 1000, Date.now()];

    const requestModel: LogsRequestModel = {
      expr,
      start: rangeStart,
      end: rangeEnd,
      limit: limit,
      orderBy: orderBy,
      orderDirection: orderDirection,
      interval: interval,
      intervalMs: intervalMs,
      timezone: 'UTC',
      maxDataPoints: 1000,
    };

    try {
      const apiResult = await lokiReadApi.query({...requestModel});
      // console.log('[LogContainer] lokiReadApi.query result:', apiResult);

      return apiResult.list;
    } catch (e) {
      console.error('[LogContainer] lokiReadApi.query error:', e);
    }
    
    return [];
  };

  const expandedRowRender = (record: any) => {
    return <LogExpandedRowComponent record={record} />;
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
      title: 'Level',
      dataIndex: 'level',
      key: 'level',
      width: 80,
      render: (level: string) => (
        <span className={
          level === 'ERROR' ? 'log-container-level-error' : 
          level === 'WARN' ? 'log-container-level-warn' : 
          level === 'INFO' ? 'log-container-level-info' : 'log-container-level-debug'
        }>
          {level}
        </span>
      ),
      filters: [
        { text: 'ERROR', value: 'ERROR' },
        { text: 'WARN', value: 'WARN' },
        { text: 'INFO', value: 'INFO' },
        { text: 'DEBUG', value: 'DEBUG' },
      ],
      onFilter: (value: any, record: any) => record.level === value,
    },
    {
      title: 'Service',
      dataIndex: 'service',
      key: 'service',
      width: 150,
      render: (service: string) => (
        <span className="log-container-service">
          {service}
        </span>
      ),
    },
    {
      title: 'Message',
      dataIndex: 'message',
      key: 'message',
      ellipsis: true,
      render: (message: string) => (
        <span title={message} className="log-container-message">
          {message}
        </span>
      ),
    }
  ];

  return (
    <BaseContainerComponent
      title="Logs"
      initialFilterCollapsed={false}
      onFetchData={fetchModelData}
      onExpandedRowRender={expandedRowRender}
      columns={columns}
      filterComponent={<LogFilter onChange={fetchModelData} collapsed={false} columns={columns} />}
    />
  );
};

export default LogContainer;