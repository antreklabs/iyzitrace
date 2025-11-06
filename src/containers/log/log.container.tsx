import React, { useState } from 'react';
import BaseContainerComponent, { FetchedModel } from '../base.container';
import '../../assets/styles/pages/log/log.container.css';
import { TableColumn } from '../../api/service/table.services';
import { FilterParamsModel } from '../../api/service/query.service';
import BaseFilter from '../base.filter';
import BaseTable from '../base.table';
import { getLogsTableData } from '../../api/service/logs.service';
import { LogItem } from '../../interfaces/pages/logs/logs.response.interface';
import LogExpandedRowComponent from '../../components/log/log.container.expanded-row.component';

const LogContainer: React.FC = () => {
  const [data, setData] = useState<LogItem[]>([]);
  const [tableColumns, setTableColumns] = useState<TableColumn>();
  
  // const fetchModelData = async (filterModel: FilterParamsModel): Promise<FetchedModel> => {
  //   let expr = '{service_namespace="opentelemetry-demo"} |= ``';
    
  //   // console.log('[LogContainer] Using LogQL expression from pageState:', expr);
    
  //   const limit = 100;
  //   const intervalMs = 1000;
  //   const interval = getIntervalLabel(intervalMs);
  //   const orderBy = 'timestamp';
  //   const orderDirection = 'desc';
  //   const [rangeStart, rangeEnd] = [Date.now() - 15 * 60 * 1000, Date.now()];

  //   const requestModel: LogsRequestModel = {
  //     expr,
  //     start: rangeStart,
  //     end: rangeEnd,
  //     limit: limit,
  //     orderBy: orderBy,
  //     orderDirection: orderDirection,
  //     interval: interval,
  //     intervalMs: intervalMs,
  //     timezone: 'UTC',
  //     maxDataPoints: 1000,
  //   };

  //   try {
  //     console.log('[LogContainer] requestModel:', requestModel);
  //     const apiResult = await lokiReadApi.query({...requestModel});
  //     console.log('[LogContainer] lokiReadApi.query result:', apiResult);

  //     return { data: apiResult.list, columns: columns };
  //   } catch (e) {
  //     console.error('[LogContainer] lokiReadApi.query error:', e);
  //   }
    
  //   return { data: [], columns: { RootColumns: [] } };
  // };

  const fetchModelData = async (filterModel: FilterParamsModel): Promise<FetchedModel> => {
    const data = await getLogsTableData(filterModel);
    setData(data);
    const builtColumns = buildColumns(data);
    setTableColumns(builtColumns);

    return { data: data, columns: tableColumns };
  };

  const buildColumns = (data: LogItem[]): TableColumn => {
    // const cols = getTableColumns(data);

    return columns;
  };

  const expandedRowRender = (record: any) => {
    return <LogExpandedRowComponent record={record} />;
  };

  const columns: TableColumn = {
    RootColumns: [
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
      render: (message: string) => (
        <span title={message} className="log-container-message">
          {message}
        </span>
      ),
    }
  ]
};

return (
  <BaseContainerComponent
    title="Logs"
    initialFilterCollapsed={true}
    onFetchData={fetchModelData}
    filterComponent={
      <BaseFilter 
        hasServiceFilter={true}
        hasOperationsFilter={false}
        hasStatusesFilter={false}
        hasDurationFilter={false}
        hasTagsFilter={false}
        hasOptionsFilter={true}
        hasLabelsFilter={false}
        hasFieldsFilter={true}
        hasTypesFilter={false}
        hasLevelsFilter={false}
        columns={tableColumns?.RootColumns ?? []}
        data={data}
      />
    }
  >
    {tableColumns && tableColumns.RootColumns && tableColumns.RootColumns.length > 0 && (
      <BaseTable
        title="Logs"
        showSearch={true}
        data={data}
        columns={tableColumns}
        onExpandedRowRender={expandedRowRender}
        searchPlaceholder="Search..."
      />
    )}
  </BaseContainerComponent>
);
};

export default LogContainer;