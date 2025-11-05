import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BaseContainerComponent, { FetchedModel } from '../base.container';
import { ColumnItem, getTableColumns, TableColumn } from '../../api/service/table.services';
import { getServicesTableData } from '../../api/service/services.service';
import { FilterParamsModel } from '../../api/service/query.service';
import { columns as columnUtils } from '../../api/service/table.services';
import { Row, Tabs, Tag } from 'antd';
import { Service } from '../../api/service/interface.service';
import { getOperationTypeColor } from '../../api/service/services.service';
import CallMetrics from '../../components/service/service.detail.chart.container.component';
import BasicSummary from '../../components/service/service.detail.card.container.component';
import BaseTable from '../base.table';

interface ServiceDetailContainerProps {
  serviceName: string;
}

const ServiceDetailContainer: React.FC<ServiceDetailContainerProps> = ({ serviceName }) => {
  const navigate = useNavigate();
  const [data, setData] = useState<Service[]>();
  const [tableColumns, setTableColumns] = useState<TableColumn>();
  const [filter, setFilter] = useState<FilterParamsModel>();

  const fetchModelData = async (filterModel: FilterParamsModel): Promise<FetchedModel> => {
    filterModel.options.interval = `${Math.floor((filterModel.timeRange.to - filterModel.timeRange.from)/60/1000)}m`;
    filterModel.service.name = serviceName;
    console.log(filterModel);
    setFilter(filterModel);
    const data = await getServicesTableData(filterModel);
    setData(data);
    const builtColumns = buildColumns(data);
    setTableColumns(builtColumns);

    return { data: data, columns: tableColumns };
  };

  const buildColumns = (data: any): TableColumn => {
    const cols = getTableColumns(data, 'operations');
    const visibleColumns: TableColumn = {
      RootColumns: columnUtils.hideColumns(columnUtils.renameColumns(cols.RootColumns, {
        metricsavglatencyms: 'Avg Latency',
        metricsminlatencyms: 'Min Latency',
        metricsmaxlatencyms: 'Max Latency',
        metricsrequestcount: 'Request Count'
      }), ['id']),
      L1Columns: columnUtils.hideColumns(columnUtils.renameColumns(cols.L1Columns ?? [], {
        metricsp50durationms: 'P50 Duration',
        metricsp90durationms: 'P90 Duration',
        metricsp99durationms: 'P99 Duration',
        metricsavgdurationms: 'Avg Duration'
      }), ['id','serviceId'])
    };

    const typeColumn = visibleColumns.L1Columns.find((col: ColumnItem) => col.key === 'type');
    if (typeColumn) {
      typeColumn.render = (value: string) => {
        return <Tag color={getOperationTypeColor(value ?? '')}>{value}</Tag>;
      };
    }
    const serviceNameColumn = visibleColumns.RootColumns.find((col: ColumnItem) => col.key === 'name');
    if (serviceNameColumn) {
      serviceNameColumn.render = (value: string) => {
        return (
          <span 
            style={{ color: '#1890ff', cursor: 'pointer' }} 
            onClick={() => navigate(`/a/iyzitrace-app/services/${value}`)}>
            {value}
          </span>
        );
      };
    }

    return visibleColumns;
  };

  return (
    <BaseContainerComponent
      title="Service Detail"
      initialFilterCollapsed={true}
      onFetchData={fetchModelData}
    >
      <BasicSummary data={data} filterModel={filter} />
      {filter && (
      <Row gutter={[16, 16]}>
        <Tabs
          items={[
            {
              key: 'callmetric',
              label: 'Call Metrics',
              children: <CallMetrics data={data} serviceBased={true} />
            },
            {
              key: 'operations',
              label: 'Operations',
              children: <CallMetrics data={data} serviceBased={false} />
            }
            ]}
          />
        </Row>
      )}
      {tableColumns && tableColumns.RootColumns && tableColumns.RootColumns.length > 0 && (
        <BaseTable
        data={data}
        columns={tableColumns}
        title="Service Detail"
        showSearch={true}
        searchPlaceholder="Search..."
        l1Key="operations"
      />
    )}
    </BaseContainerComponent>
  );
};

export default ServiceDetailContainer;