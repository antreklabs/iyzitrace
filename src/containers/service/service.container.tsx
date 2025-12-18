import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BaseContainerComponent, { FetchedModel } from '../base.container';
import BaseFilter from '../base.filter';
import { ColumnItem, getTableColumns, TableColumn } from '../../api/service/table.services';
import { getOperationTypeColor, getServicesTableData } from '../../api/service/services.service';
import { FilterParamsModel } from '../../api/service/query.service';
import BaseTable from '../base.table';
import { columns as columnUtils } from '../../api/service/table.services';
import { Tag } from 'antd';
import { Service } from '../../api/service/interface.service';
import ServiceCardContainer from '../../components/service/service.card.container.component';
import ServiceChartContainer from '../../components/service/service.chart.container.component';

const ServiceContainer: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<Service[]>();
  const [tableColumns, setTableColumns] = useState<TableColumn>();

  const fetchModelData = async (filterModel: FilterParamsModel): Promise<FetchedModel> => {
    const data = await getServicesTableData(filterModel);
    setData(data);
    const builtColumns = buildColumns(data);
    setTableColumns(builtColumns);

    return { data: data, columns: tableColumns };
  };

  const buildColumns = (data: any): TableColumn => {
    const cols = getTableColumns(data, 'operations');

    let root = columnUtils.renameColumns(cols.RootColumns, {
      type: 'Type',
      metricsavgdurationms: 'Avg Latency',
      metricsmindurationms: 'Min Latency',
      metricsmaxdurationms: 'Max Latency',
      metricscallscount: 'Requests',
      metricscallspersecond: 'Calls Per Second',
      metricsoperationcounts: 'Operations'
    });
    root = columnUtils.reorderColumns(root, ['name', 'type', 'port', 'metricsavgdurationms', 'metricsmindurationms', 'metricsmaxdurationms', 'metricscallscount', 'metricscallspersecond']);

    let l1 = columnUtils.renameColumns(cols.L1Columns ?? [], {
      metricsp50durationms: 'P50',
      metricsp75durationms: 'P75',
      metricsp90durationms: 'P90',
      metricsp95durationms: 'P95',
      metricsp99durationms: 'P99',
      metricsavgdurationms: 'Avg',
      metricsmindurationms: 'Min',
      metricsmaxdurationms: 'Max',
      metricscallscount: 'Requests'
    })
    l1 = columnUtils.reorderColumns(l1, ['name', 'type', 'method', 'path', 'metricsavgdurationms', 'metricsmindurationms', 'metricsmaxdurationms', 'metricscallscount', 'metricsp50durationms', 'metricsp75durationms', 'metricsp90durationms', 'metricsp95durationms', 'metricsp99durationms']);

    const visibleColumns: TableColumn = {
      RootColumns: columnUtils.hideColumns(root, ['id', 'metricssumdurationms', 'metricsp50durationms', 'metricsp75durationms', 'metricsp90durationms', 'metricsp95durationms', 'metricsp99durationms']),
      L1Columns: columnUtils.hideColumns(l1, ['id','serviceId'])
    };

    const typeColumn = visibleColumns.L1Columns.find((col: ColumnItem) => col.key === 'type');
    if (typeColumn) {
      typeColumn.render = (value: string) => {
        return <Tag color={getOperationTypeColor(value)}>{value}</Tag>;
      };
    }

    const serviceTypeColumn = visibleColumns.RootColumns.find((col: ColumnItem) => col.key === 'type');
    if (serviceTypeColumn) {
      serviceTypeColumn.render = (value: string) => {
        return <Tag color={getOperationTypeColor(value)}>{value}</Tag>;
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
      title="Services"
      initialFilterCollapsed={true}
      onFetchData={fetchModelData}
      filterComponent={
        <BaseFilter 
          hasServiceFilter={true}
          hasOperationsFilter={true}
          hasStatusesFilter={true}
          hasDurationFilter={false}
          hasTagsFilter={false}
          hasOptionsFilter={true}
          hasLabelsFilter={true}
          hasFieldsFilter={true}
          hasTypesFilter={true}
          hasExceptionTypesFilter={true}
          columns={tableColumns?.RootColumns ?? []}
          data={data}
        />
      }
    >
      <ServiceCardContainer services={data} />
      <ServiceChartContainer services={data} />
      {tableColumns && tableColumns.RootColumns && tableColumns.RootColumns.length > 0 && (
        <BaseTable
        data={data}
        columns={tableColumns}
        title="Services"
        showSearch={true}
        searchPlaceholder="Search..."
        l1Key="operations"
        />
      )}
    </BaseContainerComponent>
  );
};

export default ServiceContainer;