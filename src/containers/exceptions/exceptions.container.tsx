import React, { useState } from 'react';
import BaseContainerComponent, { FetchedModel } from '../base.container';
import '../../assets/styles/pages/log/log.container.css';
import '../../assets/styles/global.css';
import { columns as columnUtils, getTableColumns, TableColumn, ColumnItem } from '../../api/service/table.services';
import { FilterParamsModel } from '../../api/service/query.service';
import BaseFilter from '../base.filter';
import BaseTable from '../base.table';
import { ExceptionGroup, getExceptions } from '../../api/service/exception.service';
import { useNavigate } from 'react-router-dom';
import { Tag } from 'antd';
import { getOperationTypeColor } from '../../api/service/services.service';

const ExceptionsContainer: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<ExceptionGroup[]>([]);
  const [tableColumns, setTableColumns] = useState<TableColumn>();

  const fetchModelData = async (filterModel: FilterParamsModel): Promise<FetchedModel> => {
    const data = await await getExceptions(filterModel);
    setData(data);
    const builtColumns = buildColumns(data);
    setTableColumns(builtColumns);
    return { data: data, columns: builtColumns };
  };

  const buildColumns = (data: any): TableColumn => {
    const cols = getTableColumns(data);

    let root = columnUtils.reorderColumns(cols.RootColumns, ['exceptiontype', 'count', 'service', 'operation', 'type', 'exceptionmessage']);
    const visibleColumns: TableColumn = {
      RootColumns: columnUtils.hideColumns(root, ['']),
    };

    const serviceTypeColumn = visibleColumns.RootColumns.find((col: ColumnItem) => col.key === 'type');
    if (serviceTypeColumn) {
      serviceTypeColumn.render = (value: string) => {
        return <Tag color={getOperationTypeColor(value)}>{value}</Tag>;
      };
    }
    const serviceNameColumn = visibleColumns.RootColumns.find((col: ColumnItem) => col.key === 'service');
    if (serviceNameColumn) {
      serviceNameColumn.render = (value: string) => {
        return (
          <span
            className="service-name-link"
            onClick={() => navigate(`/a/antreklabs-iyzitrace-app/services/${value}`)}>
            {value}
          </span>
        );
      };
    }
    const exceptionTypeColumn = visibleColumns.RootColumns.find((col: ColumnItem) => col.key === 'exceptionType');
    if (exceptionTypeColumn) {
      exceptionTypeColumn.render = (value: string) => {
        return <span
          className="service-name-link"
          onClick={() => navigate(`/a/antreklabs-iyzitrace-app/exceptions/${value}`)}>
          {value}
        </span>
      };
    }

    return visibleColumns;
  };

  return (
    <BaseContainerComponent
      title="Exceptions"
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
          hasExceptionTypesFilter={false}
          columns={tableColumns?.RootColumns ?? []}
          data={data}
        />
      }
    >
      {tableColumns && tableColumns.RootColumns && tableColumns.RootColumns.length > 0 && (
        <BaseTable
          title="Exceptions"
          showSearch={true}
          data={data}
          columns={tableColumns}
          searchPlaceholder="Search..."
        />
      )}
    </BaseContainerComponent>
  );
};

export default ExceptionsContainer;