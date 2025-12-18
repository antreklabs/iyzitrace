import React, { useState } from 'react';
import BaseContainerComponent, { FetchedModel } from '../base.container';
import { FilterParamsModel } from '../../api/service/query.service';
import BaseFilter from '../base.filter';
import { getRegions } from '../../api/service/service-map.service';
import { Infrastructure, Region, ServiceMapData } from '../../api/service/interface.service';
import { TableColumn, getTableColumns, columns as columnUtils } from '../../api/service/table.services';
import BaseTable from '../base.table';
import { InfrastructureMap } from '../../components/service-map/infrastructure-map.component';
import { Tag } from 'antd';
import { getOperationTypeColor } from '../../api/service/services.service';
import { ColumnItem } from '../../api/service/table.services';
import { useNavigate } from 'react-router-dom';

const ServiceMapContainer: React.FC = () => {
  const navigate = useNavigate();
  const [infraLevelData, setInfraLevelData] = useState<Infrastructure[]>([]);
  const [mapLevelData, setMapLevelData] = useState<ServiceMapData>({});
  const [columns, setColumns] = useState<TableColumn>();

  const fetchModelData = async (filterModel: FilterParamsModel): Promise<FetchedModel> => {
    const regions = await getRegions(filterModel);
    
    const infrastructures = (regions || []).flatMap((r: Region) => r.infrastructures || []);
    
    setMapLevelData({ regions: regions });
    setInfraLevelData(infrastructures);
    setColumnInDetail(infrastructures);

    return { data: infrastructures, columns: columns };
  };

  const setColumnInDetail = (data: Infrastructure[]) => {
    if(columns) {
      return;
    }
    const cols = getTableColumns(data, 'services', 'operations')
    let root = columnUtils.renameColumns(cols.RootColumns, {
      osversion: 'OS Version',
      ip: 'IP Address',
      cpupercentage: 'CPU Usage',
      memorypercentage: 'Memory Usage'
    });
    root = columnUtils.reorderColumns(root, ['region','name', 'osversion', 'ip', 'type', 'status.value']);
    let l1 = columnUtils.renameColumns(cols.L1Columns ?? [], {
      metricsavgdurationms: 'Avg',
      metricsmindurationms: 'Min',
      metricsmaxdurationms: 'Max',
      metricssumdurationms: 'Sum',
      metricsp50durationms: 'P50',
      metricsp75durationms: 'P75',
      metricsp90durationms: 'P90',
      metricsp95durationms: 'P95',
      metricsp99durationms: 'P99',
      metricscallscount: 'Calls',
      metricscallspersecond: 'Calls/s',
      metricsoperationcounts: 'Ops',
    });
    l1 = columnUtils.reorderColumns(l1, ['name', 'type', 'port']);
    const serviceTypeColumn = l1.find((col: ColumnItem) => col.key === 'type');
    if (serviceTypeColumn) {
      serviceTypeColumn.render = (value: string) => {
        return <Tag color={getOperationTypeColor(value)}>{value}</Tag>;
      };
    }
    const serviceNameColumn = l1.find((col: ColumnItem) => col.key === 'name');
    if (serviceNameColumn) {
      serviceNameColumn.render = (value: string) => {
        return <span style={{ color: '#1890ff', cursor: 'pointer' }} onClick={() => navigate(`/a/iyzitrace-app/services/${value}`)}>{value}</span>;
      };
    }

    let l2 = columnUtils.renameColumns(cols.L2Columns ?? [], {
      metricsavgdurationms: 'Avg',
      metricsmindurationms: 'Min',
      metricsmaxdurationms: 'Max',
      metricssumdurationms: 'Sum',
      metricsp50durationms: 'P50',
      metricsp75durationms: 'P75',
      metricsp90durationms: 'P90',
      metricsp95durationms: 'P95',
      metricsp99durationms: 'P99',
      metricscallscount: 'Calls',
      metricscallspersecond: 'Calls/s',
      metricsoperationcounts: 'Ops',
    });
    l2 = columnUtils.reorderColumns(l2, ['name', 'type', 'method', 'path']);
    const operationTypeColumn = l2.find((col: ColumnItem) => col.key === 'type');
    if (operationTypeColumn) {
      operationTypeColumn.render = (value: string) => {
        return <Tag color={getOperationTypeColor(value)}>{value}</Tag>;
      };
    }

    const hiddenCols: TableColumn = {
      RootColumns: columnUtils.hideColumns(root, ['id', 'cpu.usage', 'cpu.capacity', 'memory.usage', 'memory.capacity', 'regionId']),
      L1Columns: columnUtils.hideColumns(l1, ['id', 'infrastructureId']),
      L2Columns: columnUtils.hideColumns(l2, ['id', 'serviceId'])
    };

    setColumns(hiddenCols);
  };

  return (
    <BaseContainerComponent
      title="Service Map"
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
          columns={columns?.RootColumns ?? []}
          data={infraLevelData}
        />
      }
    >
      <InfrastructureMap data={mapLevelData} />
      {columns && columns.RootColumns && columns.RootColumns.length > 0 && (
        <BaseTable
        data={infraLevelData}
        columns={columns}
          title="Infrastructure Overview"
        showSearch={true}
        searchPlaceholder="Search..."
        l1Key="services"
        l2Key="operations"
        />
      )}
    </BaseContainerComponent>
  );
};

export default ServiceMapContainer;