import React, { useState } from 'react';
import BaseContainerComponent, { FetchedModel } from '../base.container';
import { FilterParamsModel } from '../../api/service/query.service';
import BaseFilter from '../base.filter';
import { getRegions } from '../../api/service/service-map.service';
import { Infrastructure, Region, ServiceMapData } from '../../api/service/interface.service';
import { TableColumn, getTableColumns, columns as columnUtils } from '../../api/service/table.services';
import BaseTable from '../base.table';
import { InfrastructureMap } from '../../components/service-map-v2/infrastructure-map.component';

const ServiceMapV2Container: React.FC = () => {
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
    const cols = getTableColumns(data, 'applications', 'services', 'operations')
    let root = columnUtils.renameColumns(cols.RootColumns, {
      osversion: 'OS Version',
      ip: 'IP Address',
      cpupercentage: 'CPU Usage',
      memorypercentage: 'Memory Usage'
    });
    root = columnUtils.reorderColumns(root, ['region','name', 'osversion', 'ip', 'type']);

    const hiddenCols: TableColumn = {
      RootColumns: columnUtils.hideColumns(root, ['id', 'cpu.usage', 'cpu.capacity', 'memory.usage', 'memory.capacity']),
      L1Columns: columnUtils.hideColumns(cols.L1Columns ?? [], ['id', 'infrastructureId']),
      L2Columns: columnUtils.hideColumns(cols.L2Columns ?? [], ['id', 'infrastructureId']),
      L3Columns: columnUtils.hideColumns(cols.L3Columns ?? [], ['id', 'serviceId'])
    };

    setColumns(hiddenCols);
  };

  return (
    <BaseContainerComponent
      title="Service Map V2"
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
        l1Key="applications"
        l2Key="services"
        l3Key="operations"
        />
      )}
    </BaseContainerComponent>
  );
};

export default ServiceMapV2Container;