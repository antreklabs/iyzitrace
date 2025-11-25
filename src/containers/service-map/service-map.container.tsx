import React, { useState } from 'react';
import BaseContainerComponent, { FetchedModel } from '../base.container';
import { FilterParamsModel } from '../../api/service/query.service';
import BaseFilter from '../base.filter';
import { getRegions } from '../../api/service/service-map.service';
import { Application, Infrastructure, PositionItem, Region, Service, ServiceMapData, SizeItem } from '../../api/service/interface.service';
import { TableColumn, getTableColumns, columns as columnUtils } from '../../api/service/table.services';
import BaseTable from '../base.table';
import ServiceMapComponent from '../../components/service-map/map.component';
import { getPluginSettings, savePluginSettings } from '../../api/service/settings.service';

const NODE_WIDTH = 140;
const NODE_HEIGHT = 1800;
const SERVICE_NODE_WIDTH = 180; // Services layer için daha geniş ISO
const ITEM_GAP_X = 32;
const SERVICE_ITEM_GAP_X = 48;
const GROUP_PADDING_X = 40;
const GROUP_PADDING_Y = 60;
const GROUP_MARGIN_LEFT = 24;
const GROUP_MARGIN_TOP = 24;
const GROUP_VERTICAL_GAP = 80;
const DEFAULT_GROUP_HEIGHT = NODE_HEIGHT + GROUP_PADDING_Y * 2;

interface LayoutItemEntry {
  id: string;
  type: 'region' | 'infrastructure' | 'application' | 'service';
  position?: PositionItem;
  groupPosition?: PositionItem;
  groupSize?: SizeItem;
}

const ServiceMapContainer: React.FC = () => {

  const [infraLevelData, setInfraLevelData] = useState<Infrastructure[]>([]);
  const [mapLevelData, setMapLevelData] = useState<ServiceMapData>({});
  const [columns, setColumns] = useState<TableColumn>();

  const fetchModelData = async (filterModel: FilterParamsModel): Promise<FetchedModel> => {
    const regions = await getRegions(filterModel);
    await ensureLayoutForServiceMap(regions);
    const infrastructures = (regions || []).flatMap((r: Region) => r.infrastructures || []);
    setMapLevelData({ regions: regions });
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

const ensureLayoutForServiceMap = async (regions: Region[]): Promise<void> => {
  if (!Array.isArray(regions) || regions.length === 0) {
    return;
  }

  let layoutChanged = false;

  const applyLayer = (
    groups: any[] = [],
    childKey: 'infrastructures' | 'applications' | 'services',
    forceLayout: boolean
  ) => {
    if (!groups || groups.length === 0) {
      return;
    }

    // Services layer için özel genişlik kullan
    const isServicesLayer = childKey === 'services';
    const nodeWidth = isServicesLayer ? SERVICE_NODE_WIDTH : NODE_WIDTH;
    const gapX = isServicesLayer ? SERVICE_ITEM_GAP_X : ITEM_GAP_X;

    const desiredSizes = new Map<string, { width: number; height: number }>();

    groups.forEach((group) => {
      const items = (group?.[childKey] || []) as any[];
      const itemsWidth =
        (items.length > 0 ? items.length : 1) * nodeWidth + Math.max(0, items.length - 1) * gapX;
      const width = itemsWidth + GROUP_PADDING_X * 2;
      const height = NODE_HEIGHT + GROUP_PADDING_Y * 2;
      desiredSizes.set(group.id, { width, height });

      if (forceLayout || !group.groupSize || !isFinite(group.groupSize?.width) || !isFinite(group.groupSize?.height)) {
        group.groupSize = { width, height };
        layoutChanged = true;
      } else {
        const mergedWidth = Math.max(group.groupSize.width, width);
        const mergedHeight = Math.max(group.groupSize.height, height);
        if (mergedWidth !== group.groupSize.width || mergedHeight !== group.groupSize.height) {
          group.groupSize = { width: mergedWidth, height: mergedHeight };
          layoutChanged = true;
        }
      }
    });

    // Group position'larını hesapla
    let nextAutoY = GROUP_MARGIN_TOP;
    if (!forceLayout) {
      const existingExtents = groups
        .map((group) => {
          if (typeof group?.groupPosition?.y === 'number') {
            const height = group.groupSize?.height ?? desiredSizes.get(group.id)?.height ?? DEFAULT_GROUP_HEIGHT;
            return group.groupPosition.y + height;
          }
          return null;
        })
        .filter((val): val is number => typeof val === 'number');
      if (existingExtents.length > 0) {
        nextAutoY = Math.max(...existingExtents) + GROUP_VERTICAL_GAP;
      }
    }

    // Services layer için özel çakışma kontrolü
    if (isServicesLayer) {
      // Services layer'ında her zaman sıralı yerleştir
      groups.forEach((group) => {
        const height = group.groupSize?.height ?? desiredSizes.get(group.id)?.height ?? DEFAULT_GROUP_HEIGHT;
        group.groupPosition = { x: GROUP_MARGIN_LEFT, y: nextAutoY };
        nextAutoY += height + GROUP_VERTICAL_GAP;
        layoutChanged = true;
      });
    } else {
      // Diğer layer'lar için mevcut mantık
      groups.forEach((group) => {
        const height = group.groupSize?.height ?? desiredSizes.get(group.id)?.height ?? DEFAULT_GROUP_HEIGHT;
        if (forceLayout || !group.groupPosition || !isFinite(group.groupPosition?.x) || !isFinite(group.groupPosition?.y)) {
          group.groupPosition = { x: GROUP_MARGIN_LEFT, y: nextAutoY };
          nextAutoY += height + GROUP_VERTICAL_GAP;
          layoutChanged = true;
        } else {
          // Mevcut pozisyonu kontrol et, çakışma varsa düzelt
          const existingY = group.groupPosition.y;
          if (nextAutoY > existingY) {
            // Eğer hesaplanan Y mevcut Y'den büyükse, mevcut pozisyonu koru
            // Ama sonraki group için nextAutoY'yi güncelle
            nextAutoY = Math.max(nextAutoY, existingY + height + GROUP_VERTICAL_GAP);
          } else {
            // Çakışma varsa pozisyonu güncelle
            group.groupPosition.y = nextAutoY;
            nextAutoY += height + GROUP_VERTICAL_GAP;
            layoutChanged = true;
          }
        }
      });
    }

    // Item position'larını hesapla
    groups.forEach((group) => {
      const items = (group?.[childKey] || []) as any[];
      let cursorX = GROUP_PADDING_X;
      const cursorY = GROUP_PADDING_Y;
      items.forEach((item) => {
        if (
          forceLayout ||
          !item.position ||
          !Number.isFinite(item.position?.x) ||
          !Number.isFinite(item.position?.y)
        ) {
          item.position = { x: cursorX, y: cursorY };
          layoutChanged = true;
        }
        cursorX += nodeWidth + gapX;
      });
    });
  };

  const needsRegionLayout = regions.some((region) => needsLayoutForGroup(region, 'infrastructures'));
  applyLayer(regions, 'infrastructures', needsRegionLayout);
  const infrastructures = regions.flatMap((region) => region.infrastructures || []);
  const needsInfraLayout = infrastructures.some((infra) => needsLayoutForGroup(infra, 'applications'));
  applyLayer(infrastructures, 'applications', needsInfraLayout);
  const applications = infrastructures.flatMap((infra) => infra.applications || []);
  const needsAppLayout = applications.some((app) => needsLayoutForGroup(app, 'services'));
  applyLayer(applications, 'services', needsAppLayout);

  if (!layoutChanged) {
    return;
  }

  const layoutItems: LayoutItemEntry[] = [];
  regions.forEach((region) => {
    layoutItems.push({
      id: region.id,
      type: 'region',
      position: region.position,
      groupPosition: region.groupPosition,
      groupSize: region.groupSize,
    });
    (region.infrastructures || []).forEach((infra: Infrastructure) => {
      layoutItems.push({
        id: infra.id,
        type: 'infrastructure',
        position: infra.position,
        groupPosition: infra.groupPosition,
        groupSize: infra.groupSize,
      });
      (infra.applications || []).forEach((app: Application) => {
        layoutItems.push({
          id: app.id,
          type: 'application',
          position: app.position,
          groupPosition: app.groupPosition,
          groupSize: app.groupSize,
        });
        (app.services || []).forEach((service: Service) => {
          layoutItems.push({
            id: service.id,
            type: 'service',
            position: service.position,
            groupPosition: service.groupPosition,
            groupSize: service.groupSize,
          });
        });
      });
    });
  });

  await persistLayoutData('service-map', layoutItems);
};

const persistLayoutData = async (pageName: string, items: LayoutItemEntry[]) => {
  if (!items || items.length === 0) {
    return;
  }

  const payload = { items };
  let viewId: string | undefined;
  try {
    const raw = localStorage.getItem(`lastSelectedPageView_${pageName}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      viewId = parsed?.viewId;
    }
  } catch {}

  let saved = false;
  try {
    const settings = await getPluginSettings();
    const pageViews = settings.pageViews || [];
    let updated = false;
    const updatedViews = pageViews.map((view: any) => {
      if (view.page === pageName && (!viewId || view.id === viewId)) {
        updated = true;
        return { ...view, data: payload };
      }
      return view;
    });
    if (updated) {
      await savePluginSettings({ ...settings, pageViews: updatedViews });
      saved = true;
    }
  } catch (error) {
    console.error('Error saving layout to plugin settings:', error);
  }

  if (saved) {
    return;
  }

  try {
    const key = `iyzitrace-views-${pageName}`;
    const localViews = JSON.parse(localStorage.getItem(key) || '[]');
    const updatedLocal = (localViews || []).map((view: any) =>
      view.page === pageName && (!viewId || view.id === viewId) ? { ...view, data: payload } : view
    );
    localStorage.setItem(key, JSON.stringify(updatedLocal));
  } catch (error) {
    console.error('Error saving layout to local storage:', error);
  }
};

const needsLayoutForGroup = (group: any, childKey: 'infrastructure' | 'infrastructures' | 'applications' | 'services') => {
  if (!group) return true;

  const groupPosMissing =
    !group.groupPosition ||
    !Number.isFinite(group.groupPosition?.x) ||
    !Number.isFinite(group.groupPosition?.y);
  const groupSizeMissing =
    !group.groupSize ||
    !Number.isFinite(group.groupSize?.width) ||
    !Number.isFinite(group.groupSize?.height);
  const items = (group?.[childKey] || []) as any[];
  const itemsMissing =
    items.length > 0 &&
    items.some(
      (item) => !item.position || !Number.isFinite(item.position?.x) || !Number.isFinite(item.position?.y)
    );
  const duplicatePositions = hasDuplicatePositions(items);
  return groupPosMissing || groupSizeMissing || itemsMissing || duplicatePositions;
};

const hasDuplicatePositions = (items: any[]): boolean => {
  if (!Array.isArray(items) || items.length === 0) return false;
  const seen = new Set<string>();
  for (const item of items) {
    const x = Number.isFinite(item?.position?.x) ? Math.round(item.position.x) : null;
    const y = Number.isFinite(item?.position?.y) ? Math.round(item.position.y) : null;
    const key = `${x ?? 'null'}-${y ?? 'null'}`;
    if (seen.has(key)) {
      return true;
    }
    seen.add(key);
  }
  return false;
};