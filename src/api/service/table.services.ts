import React from 'react';

export interface TableColumn {
  RootColumns: ColumnItem[];
  L1Columns?: ColumnItem[];
  L2Columns?: ColumnItem[];
  L3Columns?: ColumnItem[];
}

export interface ColumnItem {
  title: string;
  dataIndex: string;
  key: string;
  width?: number;
  align?: 'left' | 'right' | 'center';
  className?: string;
  onHeaderCell?: (column: any) => { className?: string } | undefined;
  onCell?: (record: any, rowIndex?: number) => { className?: string } | undefined;
  sorter?: (a: any, b: any) => number;
  render?: (value: any, record?: any) => any;
  filters?: { text: string; value: string }[];
  onFilter?: (value: any, record: any) => boolean;
  filterSearch?: boolean;
}

/**
 * Generates table columns based on the provided data structure
 * @param data - The service map data (any type)
 * @param L1ColumnProperty - Property name for L1 level (e.g., 'applications')
 * @param L2ColumnProperty - Property name for L2 level (e.g., 'services')
 * @param L3ColumnProperty - Property name for L3 level (e.g., 'operations')
 * @returns TableColumn object with columns for each level
 */
export const getTableColumns = (
  data: any,
  L1ColumnProperty?: string,
  L2ColumnProperty?: string,
  L3ColumnProperty?: string
): TableColumn => {
  const rootColumns: ColumnItem[] = [];
  const l1Columns: ColumnItem[] = L1ColumnProperty ? [] : undefined;
  const l2Columns: ColumnItem[] = L2ColumnProperty ? [] : undefined;
  const l3Columns: ColumnItem[] = L3ColumnProperty ? [] : undefined;

  // Helper function to get nested property value
  const getNestedValue = (obj: any, path: string): any => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };

  // Build filters from a data array for a given property (unique values, strings only)
  const buildFilters = (dataArray: any[], property: string): { text: string; value: string }[] => {
    if (!Array.isArray(dataArray) || dataArray.length === 0) return [];
    const set = new Set<string>();
    for (const row of dataArray) {
      const v = getNestedValue(row, property);
      if (v === undefined || v === null) continue;
      // Only add primitive string/number/boolean; convert to string for filter value
      if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
        set.add(String(v));
      }
      if (set.size >= 50) break; // safety cap
    }
    return Array.from(set).sort().map(v => ({ text: v, value: v }));
  };

  // Estimate text width and compute auto width
  const estimateTextWidth = (text: string): number => ((text?.length || 0) * 8);
  const measureTextWidth = (() => {
    let canvas: HTMLCanvasElement | null = null;
    let ctx: CanvasRenderingContext2D | null = null;
    return (text: string): number => {
      try {
        if (!canvas) {
          canvas = document.createElement('canvas');
          ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.font = '14px Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial';
          }
        }
        if (ctx) {
          return Math.ceil(ctx.measureText(text || '').width);
        }
      } catch {}
      return estimateTextWidth(text);
    };
  })();
  const computeAutoWidth = (rows: any[], property: string, title: string, isNumeric: boolean): number => {
    if (!Array.isArray(rows) || rows.length === 0) return isNumeric ? 120 : 160;
    let maxPx = measureTextWidth(String(title ?? ''));
    const limit = Math.min(rows.length, 200);
    for (let i = 0; i < limit; i++) {
      const v = getNestedValue(rows[i], property);
      const str = typeof v === 'number' ? (v as number).toFixed(2) : (v == null ? '' : String(v));
      const px = measureTextWidth(str);
      if (px > maxPx) maxPx = px;
    }
    const padding = 32; // padding + icons
    const minW = isNumeric ? 100 : 160;
    const maxW = property.toLowerCase().includes('name') ? 520 : 360;
    return Math.min(maxW, Math.max(minW, maxPx + padding));
  };

  // Pretty-print column titles like "cpu.usage" => "Cpu Usage"
  const formatColumnTitle = (raw: string): string => {
    if (!raw) return '';
    // split by dot or underscore
    const parts = raw.split(/[._]/g).filter(Boolean);
    return parts
      .map(p => p.charAt(0).toUpperCase() + p.slice(1))
      .join('');
  };

  // Helper function to create column item
  const createColumnItem = (property: string, title: string, _width: number, sourceData: any[] = []): ColumnItem => {
    const isNumericColumn = Array.isArray(sourceData) && sourceData.some(row => typeof getNestedValue(row, property) === 'number');
    const prettyTitle = formatColumnTitle(title || property);
    const propLc = property.toLowerCase();
    const isPercentage = propLc.includes('percentage');
    const isStatus = propLc.startsWith('status');
    const isStatusValue = isStatus && (propLc === 'status.value' || propLc.endsWith('.value'));
    const isImage = propLc.endsWith('imageurl') || propLc.includes('imageurl');
    const autoWidth = isImage ? 84 : computeAutoWidth(sourceData, property, prettyTitle, isNumericColumn);
    // Hardcoded StatusItem-related renames
    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
    const normProp = normalize(property);
    const statusRenameMap: Record<string, string> = {
      statusvalue: 'Status',
      statusmetricserrorpercentage: 'Error Ratio',
      statusmetricswarningpercentage: 'Warning Ratio',
      statusmetricsdegradedpercentage: 'Degraded Ratio',
    };
    const hardcodedTitle = statusRenameMap[normProp];
    return {
      title: isStatusValue ? 'Status' : (hardcodedTitle ?? prettyTitle),
      dataIndex: property,
      key: property,
      width: autoWidth,
      align: isImage ? 'left' : (isPercentage ? 'left' : (isNumericColumn ? 'right' : undefined)),
      className: isNumericColumn ? 'numeric-cell' : 'nowrap-cell',
      onHeaderCell: undefined,
      onCell: undefined,
      sorter: (a: any, b: any) => {
        const aVal = getNestedValue(a, property) ?? '';
        const bVal = getNestedValue(b, property) ?? '';
        
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return aVal - bVal;
        }
        
        return String(aVal).localeCompare(String(bVal));
      },
      render: (value: any, record: any) => {
        const actualValue = getNestedValue(record, property);
        if (isStatusValue) {
          const v = String(actualValue ?? '').toLowerCase();
          const cls = v === 'healthy' ? 'healthy' : (v === 'error' ? 'error' : 'warning');
          const text = (String(actualValue ?? '') || '').toUpperCase();
          return React.createElement('span', { className: `status-tag ${cls}` }, text);
        }
        if (isImage) {
          const url = String(actualValue ?? '');
          if (!url) return null;
          return React.createElement('img', { src: url, className: 'img-thumb', alt: 'image' });
        }
        if (isPercentage) {
          const raw = typeof actualValue === 'number' ? actualValue : Number(actualValue);
          if (!isNaN(raw)) {
            const pct = raw <= 1 ? raw * 100 : raw;
            const pctStr = `${Math.round(pct)}%`;
            return React.createElement(
              'div',
              { className: 'pct-pill' },
              React.createElement('div', { className: 'pct-pill-fill', style: { width: `${Math.max(0, Math.min(100, pct))}%` } }),
              React.createElement('span', { className: 'pct-pill-label' }, pctStr)
            );
          }
          return actualValue;
        }
        if (typeof actualValue === 'number') {
          return `${(actualValue ?? 0).toFixed(2)}`;
        }
        return actualValue;
      },
      // dynamic filters
      filters: buildFilters(sourceData, property),
      filterSearch: true,
      onFilter: (val: any, record: any) => String(getNestedValue(record, property)) === String(val)
    };
  };

  // Helper function to extract properties from data (including nested objects)
  const extractProperties = (dataArray: any[], level: number): string[] => {
    if (!Array.isArray(dataArray) || dataArray.length === 0) return [];
    
    const properties = new Set<string>();
    
    const extractNestedProperties = (obj: any, prefix: string = '') => {
      if (!obj || typeof obj !== 'object') return;
      
      Object.keys(obj).forEach(key => {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        const value = obj[key];
        
        if (Array.isArray(value)) {
          // Skip arrays
          return;
        } else if (value && typeof value === 'object') {
          // Recursively extract from nested objects
          extractNestedProperties(value, fullKey);
        } else {
          // Add primitive properties
          properties.add(fullKey);
        }
      });
    };
    
    dataArray.forEach(item => {
      if (item && typeof item === 'object') {
        extractNestedProperties(item);
      }
    });
    
    return Array.from(properties);
  };

  // Extract root level properties
  if (Array.isArray(data) && data.length > 0) {
    const rootProperties = extractProperties(data, 0);
    rootProperties.forEach(prop => {
      rootColumns.push(createColumnItem(prop, prop, 220, data));
    });
    // Default hide geometry-like columns
    rootColumns.splice(0, rootColumns.length, ...columns.applyDefaultHidden(rootColumns));
  }

  // Extract L1 level properties (applications)
  if (Array.isArray(data) && data.length > 0) {
    const l1Data: any[] = [];
    data.forEach(item => {
      if (item && item[L1ColumnProperty] && Array.isArray(item[L1ColumnProperty])) {
        l1Data.push(...item[L1ColumnProperty]);
      }
    });
    
    if(l1Columns) {
    const l1Properties = extractProperties(l1Data, 1);
    l1Properties.forEach(prop => {
        l1Columns.push(createColumnItem(prop, prop, 220, l1Data));
      });
      l1Columns.splice(0, l1Columns.length, ...columns.applyDefaultHidden(l1Columns));
    }
  }

  // Extract L2 level properties (services)
  if (Array.isArray(data) && data.length > 0) {
    const l2Data: any[] = [];
    data.forEach(item => {
      if (item && item[L1ColumnProperty] && Array.isArray(item[L1ColumnProperty])) {
        item[L1ColumnProperty].forEach((l1Item: any) => {
          if (l1Item && l1Item[L2ColumnProperty] && Array.isArray(l1Item[L2ColumnProperty])) {
            l2Data.push(...l1Item[L2ColumnProperty]);
          }
        });
      }
    });
    
    if(l2Columns) {
    const l2Properties = extractProperties(l2Data, 2);
    l2Properties.forEach(prop => {
      l2Columns.push(createColumnItem(prop, prop, 220, l2Data));
    });
    l2Columns.splice(0, l2Columns.length, ...columns.applyDefaultHidden(l2Columns));
    }
  }

  // Extract L3 level properties (operations)
  if (Array.isArray(data) && data.length > 0) {
    const l3Data: any[] = [];
    data.forEach(item => {
      if (item && item[L1ColumnProperty] && Array.isArray(item[L1ColumnProperty])) {
        item[L1ColumnProperty].forEach((l1Item: any) => {
          if (l1Item && l1Item[L2ColumnProperty] && Array.isArray(l1Item[L2ColumnProperty])) {
            l1Item[L2ColumnProperty].forEach((l2Item: any) => {
              if (l2Item && l2Item[L3ColumnProperty] && Array.isArray(l2Item[L3ColumnProperty])) {
                l3Data.push(...l2Item[L3ColumnProperty]);
              }
            });
          }
        });
      }
    });
    if(l3Columns) {
    const l3Properties = extractProperties(l3Data, 3);
    l3Properties.forEach(prop => {
      l3Columns.push(createColumnItem(prop, prop, 220, l3Data));
    });
    l3Columns.splice(0, l3Columns.length, ...columns.applyDefaultHidden(l3Columns));
    }
  }

  return {
    RootColumns: rootColumns,
    L1Columns: l1Columns,
    L2Columns: l2Columns,
    L3Columns: l3Columns
  };
};

/**
 * Helper function to create a specific column item with custom configuration
 * @param property - The property name
 * @param title - The column title
 * @param width - The column width
 * @param isNumber - Whether the column contains numeric data
 * @returns ColumnItem object
 */
export const createCustomColumn = (
  property: string, 
  title: string, 
  width: number, 
  isNumber: boolean = false
): ColumnItem => {
  // Helper function to get nested property value
  const getNestedValue = (obj: any, path: string): any => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };

  return {
    title,
    dataIndex: property,
    key: property,
    width,
    sorter: (a: any, b: any) => {
      const aVal = getNestedValue(a, property) ?? (isNumber ? 0 : '');
      const bVal = getNestedValue(b, property) ?? (isNumber ? 0 : '');
      
      if (isNumber) {
        return (aVal as number) - (bVal as number);
      }
      
      return String(aVal).localeCompare(String(bVal));
    },
    render: isNumber ? (value: any, record: any) => {
      const actualValue = getNestedValue(record, property);
      return `${(actualValue ?? 0).toFixed(2)}`;
    } : undefined
  };
};

/**
 * Utility helpers for column mutations without removing items from arrays
 */
export const columns = {
  /**
   * Marks provided columns as hidden in the table (kept in array, visually hidden)
   * Usage: columns.hideColumns(columns.RootColumns, ['id'])
   */
  hideColumns: (cols: ColumnItem[], keysToHide: string[]): ColumnItem[] => {
    if (!Array.isArray(cols) || !Array.isArray(keysToHide) || keysToHide.length === 0) {
      return cols;
    }
    const normalize = (s: any) => String(s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const hiddenSet = new Set(keysToHide.map(k => normalize(k)));

    const hiddenClass = 'column-hidden';
    const visible: ColumnItem[] = [];
    const hidden: ColumnItem[] = [];

    cols.forEach(col => {
      const dataIndexNorm = normalize(col.dataIndex);
      const keyNorm = normalize(col.key);
      const titleNorm = normalize((col as any).title);

      const shouldHide = hiddenSet.has(dataIndexNorm)
        || hiddenSet.has(keyNorm)
        || hiddenSet.has(titleNorm);

      if (shouldHide) {
        hidden.push({
          ...col,
          title: '',
          width: 0,
          className: [col.className, hiddenClass].filter(Boolean).join(' '),
          // Force zero-sized cells
          onHeaderCell: () => ({ className: hiddenClass, style: { width: 0, padding: 0 } }),
          onCell: () => ({ className: hiddenClass, style: { width: 0, padding: 0 } }),
          // Avoid content measuring increasing width
          render: () => null,
        });
      } else {
        visible.push(col);
      }
    });

    // Append hidden columns to the end to keep them out of the main flow
    return [...visible, ...hidden];
  },

  /**
   * Apply default hidden rules for technical geometry fields.
   * Hides: position.*, groupPosition.*, groupSize.*
   */
  applyDefaultHidden: (cols: ColumnItem[]): ColumnItem[] => {
    if (!Array.isArray(cols) || cols.length === 0) return cols;
    const normalize = (s: any) => String(s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const shouldDefaultHide = (dataIndex: string) => {
      const n = normalize(dataIndex);
      const isGeom = n.startsWith('position') || n.startsWith('groupposition') || n.startsWith('groupsize');
      const isStatus = n.startsWith('status');
      // Hide all status.* except status.value and any *percentage*
      const isStatusPercentage = isStatus && n.includes('percentage');
      const isStatusValue = isStatus && (n === 'statusvalue' || n.endsWith('.value'.replace(/[^a-z0-9]/g,'')));
      const hideStatus = isStatus && !isStatusPercentage && !isStatusValue;
      return isGeom || hideStatus;
    };
    const keysToHide = cols
      .filter(c => shouldDefaultHide(c.dataIndex))
      .map(c => c.dataIndex);
    return columns.hideColumns(cols, keysToHide);
  },

  /**
   * Rename column titles by dataIndex/key/title match. Only the visual title is changed.
   * Example: renameColumns(cols, { osversion: 'OS Version', ip: 'IP' })
   */
  renameColumns: (cols: ColumnItem[], renameMap: Record<string, string>): ColumnItem[] => {
    if (!Array.isArray(cols) || !renameMap) return cols;
    const normalize = (s: any) => String(s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
    return cols.map(col => {
      const nIdx = normalize(col.dataIndex);
      const nKey = normalize(col.key);
      const nTitle = normalize((col as any).title);
      const newTitle = renameMap[nIdx] ?? renameMap[nKey] ?? renameMap[nTitle];
      if (!newTitle) return col;
      return { ...col, title: newTitle };
    });
  },

  /**
   * Reorder columns based on provided dataIndex/key/title order.
   * Unknown columns are appended in their original order.
   */
  reorderColumns: (cols: ColumnItem[], order: string[]): ColumnItem[] => {
    if (!Array.isArray(cols) || !Array.isArray(order) || order.length === 0) return cols;
    const normalize = (s: any) => String(s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const indexMap = new Map<string, number>();
    order.forEach((k, i) => indexMap.set(normalize(k), i));

    const score = (c: ColumnItem): number => {
      const keys = [c.dataIndex, c.key, (c as any).title].map(x => normalize(x));
      const idxs = keys.map(k => indexMap.get(k)).filter(v => v !== undefined) as number[];
      return idxs.length ? Math.min(...idxs) : Number.MAX_SAFE_INTEGER;
    };

    return [...cols].sort((a, b) => {
      const sa = score(a);
      const sb = score(b);
      if (sa === sb) return 0;
      return sa - sb;
    });
  }
};
