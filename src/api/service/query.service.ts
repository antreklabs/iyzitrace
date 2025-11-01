import { getPluginSettings } from './settings.service';
import { Definitions } from '../../interfaces/options';
import { DEFAULT_DEFINITIONS } from '../../components/settings/definitions-table.component';

/**
 * Query type enum
 */
export enum QueryType {
  CALLS_BY_SERVICE = 'CALLS_BY_SERVICE',
  AVG_LATENCY_BY_SERVICE = 'AVG_LATENCY_BY_SERVICE',
  MIN_LATENCY_BY_SERVICE = 'MIN_LATENCY_BY_SERVICE',
  MAX_LATENCY_BY_SERVICE = 'MAX_LATENCY_BY_SERVICE',
  ERROR_PERCENTAGE_BY_SERVICE = 'ERROR_PERCENTAGE_BY_SERVICE',
  P50_BY_SERVICE_AND_SPAN = 'P50_BY_SERVICE_AND_SPAN',
  P75_BY_SERVICE_AND_SPAN = 'P75_BY_SERVICE_AND_SPAN',
  P90_BY_SERVICE_AND_SPAN = 'P90_BY_SERVICE_AND_SPAN',
  P95_BY_SERVICE_AND_SPAN = 'P95_BY_SERVICE_AND_SPAN',
  P99_BY_SERVICE_AND_SPAN = 'P99_BY_SERVICE_AND_SPAN',
  AVG_DURATION_BY_SERVICE_AND_SPAN = 'AVG_DURATION_BY_SERVICE_AND_SPAN',
  ERROR_PERCENTAGE_BY_SERVICE_AND_SPAN = 'ERROR_PERCENTAGE_BY_SERVICE_AND_SPAN'
}

// Helper function to get definitions from plugin settings
export const getDefinitions = async (): Promise<Definitions> => {
  try {
    const settings = await getPluginSettings();
    const definitions = settings.definitions || DEFAULT_DEFINITIONS;
    return { ...DEFAULT_DEFINITIONS, ...definitions };
  } catch (error) {
    console.error('Error getting definitions from plugin settings:', error);
    return DEFAULT_DEFINITIONS;
  }
};

// URL parametrelerini düzenli yapıya dönüştüren model sınıfı
export class FilterParamsModel {
  timeRange: {
    from: number;
    to: number;
    readonly datetime: {
      from: string;
      to: string;
    };
    readonly rangeText: string;
  };
  
  duration: {
    min: string;
    max: string;
  };
  
  fields: Array<{
    name: string;
    value: string[];
  }>;
  
  labels: Array<{
    name: string;
    value: string[];
  }>;
  
  operation: {
    name: string;
    operator: string;
  };
  
  service: {
    name: string;
    operator: string;
  };
  
  tag: {
    key: string;
    operator: string;
    value: string;
  };
  
  type: {
    name: string;
    operator: string;
  };
  
  status: {
    name: string;
    operator: string;
  };
  
  options: {
    interval: string;
    limit: string;
    orderBy: string;
    orderDirection: string;
    pageCount: string;
  };

  query: string;

  private _labelFiltersValue?: string;
  private _labelFiltersPromise?: Promise<string>;

  constructor(params: Record<string, string>) {
    // Time range - Default to last 15 minutes
    const now = Date.now();
    const fifteenMinutesAgo = now - (15 * 60 * 1000);
    
    this.timeRange = {
      from: params.from ? parseInt(params.from) : fifteenMinutesAgo,
      to: params.to ? parseInt(params.to) : now,
      get datetime() {
        return {
          from: this.from ? new Date(this.from).toISOString() : '',
          to: this.to ? new Date(this.to).toISOString() : ''
        };
      },
      get rangeText() {
        if (this.from && this.to) {
          const fromDate = new Date(this.from);
          const toDate = new Date(this.to);
          return `${fromDate.toLocaleString()} - ${toDate.toLocaleString()}`;
        }
        return '';
      }
    };

    // Duration
    this.duration = {
      min: params.duration_min || '',
      max: params.duration_max || ''
    };

    // Fields
    this.fields = [];
    Object.keys(params).forEach(key => {
      if (key.startsWith('field_')) {
        const fieldName = key.replace('field_', '');
        const fieldValue = params[key] ? params[key].split(',') : [];
        this.fields.push({ name: fieldName, value: fieldValue });
      }
    });

    // Labels
    this.labels = [];
    Object.keys(params).forEach(key => {
      if (key.startsWith('label_')) {
        const labelName = key.replace('label_', '');
        const labelValue = params[key] ? params[key].split(',') : [];
        this.labels.push({ name: labelName, value: labelValue });
      }
    });

    // Operation
    this.operation = {
      name: params.operationName || '',
      operator: params.operationOperator || '='
    };

    // Service
    this.service = {
      name: params.serviceName || '',
      operator: params.serviceOperator || '='
    };

    // Tag
    this.tag = {
      key: params.tagKey || '',
      operator: params.tagOperator || '=',
      value: params.tagValue || ''
    };

    // Type
    this.type = {
      name: params.type || '',
      operator: params.typeOperator || '='
    };

    // Status
    this.status = {
      name: params.status || '',
      operator: params.statusOperator || '='
    };

    // Options
    this.options = {
      interval: params.option_interval || '15s',
      limit: params.option_limit || '100',
      orderBy: params.option_orderBy,
      orderDirection: params.option_orderDirection,
      pageCount: params.option_pageCount || '20'
    };

    // Query
    this.query = params.q || '';
  }

  /**
   * Label filter string'ini async olarak hesaplar ve cache'ler
   */
  private async initializeLabelFilters(): Promise<void> {
    if (this._labelFiltersValue !== undefined) {
      return;
    }

    if (!this._labelFiltersPromise) {
      this._labelFiltersPromise = (async () => {
        const definitions = await getDefinitions();
        const service_label_name = definitions.service_label_name;
        const span_label_name = definitions.span_label_name;
        const type_label_name = definitions.type_label_name;
        const status_label_name = definitions.status_label_name;
        const exception_type_label_name = definitions.exception_type_label_name;

        const labelFilters: string[] = [];
        
        if (this.service.name) {
          labelFilters.push(`${service_label_name}="${this.service.name}"`);
        }
        if (this.type.name) {
          labelFilters.push(`${type_label_name}="${this.type.name}"`);
        }
        if (this.operation.name) {
          labelFilters.push(`${span_label_name}="${this.operation.name}"`);
        }
        if (this.status.name) {
          labelFilters.push(`${status_label_name}="${this.status.name}"`);
          labelFilters.push(`${exception_type_label_name}="${this.status.name}"`);
        }
        
        this.labels.forEach((label: { name: string; value: string[] }) => {
          label.value.forEach((value: string) => {
            labelFilters.push(`${label.name}="${value}"`);
          });
        });
        
        if (this.duration.min) {
          labelFilters.push(`duration_ms>${this.duration.min}`);
        }
        if (this.duration.max) {
          labelFilters.push(`duration_ms<${this.duration.max}`);
        }
        if (this.tag.key && this.tag.value) {
          labelFilters.push(`${this.tag.key}${this.tag.operator}${this.tag.value}`);
        }

        const labelFiltersString = labelFilters.join(',');
        if (labelFiltersString.length > 0 && labelFiltersString !== '""') {
          return `{${labelFiltersString}}`;
        }
        return '';
      })();
    }

    this._labelFiltersValue = await this._labelFiltersPromise;
  }

  /**
   * Label filter string'ini getter property olarak döndürür (sync, cached)
   * İlk çağrıda async olarak hesaplanır ve cache'lenir
   * @returns string - Label filter string (ilk çağrıda boş string dönebilir)
   */
  get labelFilters(): string {
    // İlk çağrıda async olarak hesaplamayı başlat (fire and forget)
    if (this._labelFiltersValue === undefined && !this._labelFiltersPromise) {
      this.initializeLabelFilters();
    }
    
    // Cache'lenmiş değer varsa döndür, yoksa boş string
    return this._labelFiltersValue || '';
  }

  /**
   * Label filter string'ini async olarak alır (await ile kullanılmalı)
   * @returns Promise<string> - Label filter string
   */
  async setLabelFiltersAsync(): Promise<string> {
    await this.initializeLabelFilters();
    return this._labelFiltersValue || '';
  }
}

/**
 * URL parametrelerini FilterParamsModel'e dönüştürür
 * @param urlSearch - URL search string (window.location.search)
 * @returns FilterParamsModel instance
 */
export const getFilterParams = (urlSearch: string = window.location.search): FilterParamsModel => {
  const urlParams = new URLSearchParams(urlSearch);
  const params = Object.fromEntries(urlParams.entries());
  return new FilterParamsModel(params);
};

/**
 * URL parametrelerini günceller
 * @param updates - Güncellenecek parametreler
 * @param currentSearch - Mevcut URL search string (opsiyonel)
 * @returns Güncellenmiş URL search string
 */
export const updateUrlParams = (updates: Record<string, string | null>, currentSearch: string = window.location.search): string => {
  const urlParams = new URLSearchParams(currentSearch);
  
  Object.entries(updates).forEach(([key, value]) => {
    if (value === null || value === '') {
      urlParams.delete(key);
    } else {
      urlParams.set(key, value);
    }
  });
  
  return urlParams.toString();
};

/**
 * Default URL parametrelerini döndürür
 * @returns Default URL parametreleri
 */
export const getDefaultSearchQuery = (): string => {
  const now = Date.now();
  const fifteenMinutesAgo = now - (15 * 60 * 1000);
  const defaultParams = {
    from: fifteenMinutesAgo.toString(),
    to: now.toString(),
    option_interval: '15s',
    option_limit: '100',
    option_pageCount: '20',
  };    

  const defaultSearchQuery = updateUrlParams(defaultParams);

  return defaultSearchQuery;
};

/**
 * Query type'a göre Prometheus query string'ini döndürür
 * @param queryType - Query tipi (enum)
 * @param filterParamsModel - Filter parametreleri
 * @param definitions - Label ve metric tanımları
 * @returns Prometheus query string
 */
export const getQueryByType = (
  queryType: QueryType,
  filterParamsModel: FilterParamsModel,
  definitions: Definitions
): string => {
  const labelFilters = filterParamsModel.labelFilters;
  const interval = filterParamsModel.options.interval;
  const service_label_name = definitions.service_label_name;
  const span_label_name = definitions.span_label_name;
  const type_label_name = definitions.type_label_name;

  switch (queryType) {
    case QueryType.CALLS_BY_SERVICE:
      return `sum by(${service_label_name}) (rate(${definitions.request_count_metric_name}${labelFilters}[${interval}]))`;
    
    case QueryType.AVG_LATENCY_BY_SERVICE:
      return `avg by(${service_label_name}) (rate(${definitions.avg_latency_metric_name}${labelFilters}[${interval}]))`;
    
    case QueryType.MIN_LATENCY_BY_SERVICE:
      return `min by(${service_label_name}) (rate(${definitions.min_latency_metric_name}${labelFilters}[${interval}]))`;
    
    case QueryType.MAX_LATENCY_BY_SERVICE:
      return `max by(${service_label_name}) (rate(${definitions.max_latency_metric_name}${labelFilters}[${interval}]))`;
    
    case QueryType.ERROR_PERCENTAGE_BY_SERVICE:
      return `max by(${service_label_name}) (rate(${definitions.error_percentage_metric_name}${labelFilters}[${interval}]))`;
    
    case QueryType.P50_BY_SERVICE_AND_SPAN:
      return `sum by(${service_label_name}, ${span_label_name}, ${type_label_name}) (rate(${definitions.p50_duration_metric_name}${labelFilters}[${interval}]))`;
    
    case QueryType.P75_BY_SERVICE_AND_SPAN:
      return `sum by(${service_label_name}, ${span_label_name}, ${type_label_name}) (rate(${definitions.p75_duration_metric_name}${labelFilters}[${interval}]))`;
    
    case QueryType.P90_BY_SERVICE_AND_SPAN:
      return `avg by(${service_label_name}, ${span_label_name}, ${type_label_name}) (rate(${definitions.p90_duration_metric_name}${labelFilters}[${interval}]))`;
    
    case QueryType.P95_BY_SERVICE_AND_SPAN:
      return `sum by(${service_label_name}, ${span_label_name}, ${type_label_name}) (rate(${definitions.p95_duration_metric_name}${labelFilters}[${interval}]))`;
    
    case QueryType.P99_BY_SERVICE_AND_SPAN:
      return `min by(${service_label_name}, ${span_label_name}, ${type_label_name}) (rate(${definitions.p99_duration_metric_name}${labelFilters}[${interval}]))`;
    
    case QueryType.AVG_DURATION_BY_SERVICE_AND_SPAN:
      return `max by(${service_label_name}, ${span_label_name}, ${type_label_name}) (rate(${definitions.avg_duration_metric_name}${labelFilters}[${interval}]))`;
    
    case QueryType.ERROR_PERCENTAGE_BY_SERVICE_AND_SPAN:
      return `max by(${service_label_name}, ${span_label_name}, ${type_label_name}) (rate(${definitions.error_percentage_metric_name}${labelFilters}[${interval}]))`;
    
    default:
      throw new Error(`Unknown query type: ${queryType}`);
  }
};
