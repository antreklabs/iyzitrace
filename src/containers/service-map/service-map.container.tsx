import React, { useState } from 'react';
import BaseContainerComponent, { FetchedModel } from '../base.container';
import { FilterParamsModel } from '../../api/service/query.service';
import BaseFilter from '../base.filter';
import { getServiceMapData } from '../../api/service/service-map.service';
import { Infrastructure, Region, ServiceMapData } from '../../api/service/interface.service';
import { TableColumn, getTableColumns, columns as columnUtils } from '../../api/service/table.services';
import BaseTable from '../base.table';
import ServiceMapComponent from '../../components/service-map/map.component';

const ServiceMapContainer: React.FC = () => {

  const [infraLevelData, setInfraLevelData] = useState<Infrastructure[]>([]);
  const [mapLevelData, setMapLevelData] = useState<ServiceMapData>({});
  const [columns, setColumns] = useState<TableColumn>();

  const fetchModelData = async (filterModel: FilterParamsModel): Promise<FetchedModel> => {
    const data = await getServiceMapData();
    const infrastructures = (data.regions || []).flatMap((r: Region) => r.infrastructures || []);
    setMapLevelData(data);
    setInfraLevelData(infrastructures);
    setColumnInDetail(infrastructures);

    // console.log('[ServiceMapContainer] data:', data);
    // console.log('[ServiceMapContainer] columns:', columns);
    // console.log('[ServiceMapContainer] filterModel:', filterModel);
    return { data: infrastructures, columns: columns };
  };

  const setColumnInDetail = (data: Infrastructure[]) => {
    if(columns) {
      return;
    }
    const cols = getTableColumns(data, 'applications', 'services', 'operations')
    // Example: rename and reorder Root columns before hiding
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
      L2Columns: columnUtils.hideColumns(cols.L2Columns ?? [], ['id', 'applicationId']),
      L3Columns: columnUtils.hideColumns(cols.L3Columns ?? [], ['id', 'serviceId'])
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
          hasDurationFilter={true}
          hasTagsFilter={true}
          hasOptionsFilter={true}
          hasLabelsFilter={true}
          hasFieldsFilter={true}
          hasTypesFilter={true}
          hasLevelsFilter={true}
          columns={columns?.RootColumns ?? []}
          data={infraLevelData}
        />
      }
    >
      <ServiceMapComponent data={mapLevelData}/>
      {columns && columns.RootColumns && columns.RootColumns.length > 0 && (
        <BaseTable
        data={infraLevelData}
        columns={columns}
        title="Service Map Overview"
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


export default ServiceMapContainer;