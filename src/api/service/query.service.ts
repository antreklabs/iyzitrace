import { getPluginSettings } from './settings.service';
import { Definitions } from '../../interfaces/options';
import { DEFAULT_DEFINITIONS } from '../../components/settings/definitions-table.component';

/**
 * Query type enum
 */
export enum QueryType {
  CALLS_BY_SERVICE,
  AVG_DURATION_BY_SERVICE,
  SUM_DURATION_BY_SERVICE,
  MIN_DURATION_BY_SERVICE,
  MAX_DURATION_BY_SERVICE,
  P50_BY_SERVICE,
  P75_BY_SERVICE,
  P90_BY_SERVICE,
  P95_BY_SERVICE,
  P99_BY_SERVICE,
  ERROR_PERCENTAGE_BY_SERVICE,
  P50_BY_SERVICE_INTIME,
  P75_BY_SERVICE_INTIME,
  P90_BY_SERVICE_INTIME,
  P95_BY_SERVICE_INTIME,
  P99_BY_SERVICE_INTIME,
  APDEX_BY_SERVICE_INTIME,

  CALLS_BY_SERVICE_AND_SPAN,
  P50_BY_SERVICE_AND_SPAN,
  P75_BY_SERVICE_AND_SPAN,
  P90_BY_SERVICE_AND_SPAN,
  P95_BY_SERVICE_AND_SPAN,
  P99_BY_SERVICE_AND_SPAN,
  AVG_DURATION_BY_SERVICE_AND_SPAN,
  MIN_DURATION_BY_SERVICE_AND_SPAN,
  MAX_DURATION_BY_SERVICE_AND_SPAN,
  ERROR_PERCENTAGE_BY_SERVICE_AND_SPAN,
  P50_BY_SERVICE_AND_SPAN_INTIME,
  P75_BY_SERVICE_AND_SPAN_INTIME,
  P90_BY_SERVICE_AND_SPAN_INTIME,
  P95_BY_SERVICE_AND_SPAN_INTIME,
  P99_BY_SERVICE_AND_SPAN_INTIME,
  APDEX_BY_SERVICE_AND_SPAN_INTIME,
  RATE_BY_SERVICE_AND_SPAN_INTIME,
  TOP_KEY_OPERATIONS_BY_SERVICE_AND_SPAN_INTIME,

  SERVICE_SPAN_RELATION,
  SERVICE_RELATION,
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
    scope: string;
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
    scope: string;
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
  private _traceQueryValue?: string;
  private _traceQueryPromise?: Promise<string>;

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
      scope: params.duration_scope || 'span',
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
    const labelMap: { [key: string]: { name?: string; value?: string[] } } = {};
    
    Object.keys(params).forEach(key => {
      if (key.startsWith('label_')) {
        // Parse label parameters: label_label_1764108930474_name and label_label_1764108930474_value
        const match = key.match(/^label_(.+)_(name|value)$/);
        if (match) {
          const [, labelId, suffix] = match;
          if (!labelMap[labelId]) {
            labelMap[labelId] = {};
          }
          if (suffix === 'name') {
            labelMap[labelId].name = params[key];
          } else if (suffix === 'value') {
            labelMap[labelId].value = params[key] ? params[key].split('|') : [];
          }
        }
      }
    });
    
    // Convert map to array
    Object.values(labelMap).forEach((label) => {
      if (label.name && label.value && label.value.length > 0) {
        this.labels.push({ name: label.name, value: label.value });
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
      scope: params.tagScope || 'span',
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
      interval: params.option_interval || '5m',
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
          if (label.value.length === 1) {
            // Single value: use exact match
            labelFilters.push(`${label.name}="${label.value[0]}"`);
          } else if (label.value.length > 1) {
            // Multiple values: use regex match with pipe separator
            labelFilters.push(`${label.name}=~"${label.value.join('|')}"`);
          }
        });
        
        if (this.duration.min) {
          labelFilters.push(`${definitions.duration_ms_label_name}>${this.duration.min}`);
        }
        if (this.duration.max) {
          labelFilters.push(`${definitions.duration_ms_label_name}<${this.duration.max}`);
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

  /**
   * TraceQL query string'ini async olarak hesaplar ve cache'ler
   */
  private async initializeTraceQuery(): Promise<void> {
    if (this._traceQueryValue !== undefined) {
      return;
    }

    if (!this._traceQueryPromise) {
      this._traceQueryPromise = (async (): Promise<string> => {
        const terms: string[] = [];

        // Service filter -> TraceQL: service.name
        if (this.service?.name) {
          const op = this.service.operator || '=';
          terms.push(`resource.service.name${op}"${this.service.name}"`);
        }

        // Operation filter -> TraceQL: name
        if (this.operation?.name) {
          const op = this.operation.operator || '=';
          terms.push(`name${op}"${this.operation.name}"`);
        }

        if(this.duration?.min && this.duration?.max) {
          let durationLabel = 'duration';
          if(this.duration.scope === 'trace') {
            durationLabel = 'traceDuration';
          }
          if (this.duration?.min) {
            const min = parseFloat(this.duration.min);
            if (Number.isFinite(min) && min > 0) {
              terms.push(`${durationLabel} > ${Math.floor(min)}ms`);
            }
          }
          if (this.duration?.max) {
            const max = parseFloat(this.duration.max);
            if (Number.isFinite(max) && max > 0) {
              terms.push(`${durationLabel} < ${Math.floor(max)}ms`);
            }
          }
        }

        // Status (best effort)
        if (this.status?.name) {
          const op = this.status.operator || '=';
          terms.push(`status${op}"${this.status.name}"`);
        }

        // Tag single key/value
        if (this.tag?.key && this.tag?.value) {
          const op = this.tag.operator || '=';
          terms.push(`${this.tag.scope}.${this.tag.key}${op}"${this.tag.value}"`);
        }

        // Free-text query if provided already
        if (this.query && this.query.trim().length > 0) {
          // If user provided a full selector (starts with {), prefer it
          const q = this.query.trim();
          if (q.startsWith('{') && q.endsWith('}')) {
            this._traceQueryValue = q;
            return q;
          }
          terms.push(q);
        }

        const selector = terms.length > 0 ? `{${terms.join(' && ')}}` : '';
        this._traceQueryValue = selector;
        return selector;
      })();
    }

    await this._traceQueryPromise;
  }

  /**
   * TraceQL query'yi hazırlar (await ile kullanılmalı) ve cache'e yazar
   */
  async setTraceQueryAsync(): Promise<string> {
    await this.initializeTraceQuery();
    return this._traceQueryValue || '';
  }

  /**
   * TraceQL query'yi döndürür (await ile kullanılmalı)
   */
  async getTraceQueryAsync(): Promise<string> {
    await this.initializeTraceQuery();
    return this._traceQueryValue || '';
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
    option_interval: '5m',
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
  const status_label_name = definitions.status_label_name;
  const http_method_label_name = definitions.http_method_label_name;
  const http_url_label_name = definitions.http_url_label_name;
  const net_host_port_label_name = definitions.net_host_port_label_name;
  const client_label_name = definitions.client_label_name;
  const client_operation_name_label_name = definitions.client_operation_name_label_name;
  const server_label_name = definitions.server_label_name;
  const server_operation_name_label_name = definitions.server_operation_name_label_name;

  const buildStatusCodeFilter = (baseLabelFilters: string, statusCode: string) => {
    if (baseLabelFilters.includes(`${status_label_name}=`)) {
      return baseLabelFilters;
    }
    if (!baseLabelFilters || baseLabelFilters === '""') {
      return `{${status_label_name}="${statusCode}"}`;
    }
    if (baseLabelFilters.startsWith('{') && baseLabelFilters.endsWith('}')) {
      const inner = baseLabelFilters.slice(1, -1).trim();
      if (!inner) {
        return `{${status_label_name}="${statusCode}"}`;
      }
      return `{${inner},${status_label_name}="${statusCode}"}`;
    }

    return `{${baseLabelFilters},${status_label_name}="${statusCode}"}`;
  };
  const buildLeFilter = (baseLabelFilters: string, le: string) => {
    if (baseLabelFilters.includes('le=')) {
      return baseLabelFilters;
    }
    if (!baseLabelFilters || baseLabelFilters === '""') {
      return `{le="${le}"}`;
    }
    if (baseLabelFilters.startsWith('{') && baseLabelFilters.endsWith('}')) {
      const inner = baseLabelFilters.slice(1, -1).trim();
      if (!inner) {
        return `{le="${le}"}`;
      }
      return `{${inner},le="${le}"}`;
    }

    return `{${baseLabelFilters},le="${le}"}`;
  };

  switch (queryType) {
    case QueryType.ERROR_PERCENTAGE_BY_SERVICE:
      return `sum by(${service_label_name}) (increase(${definitions.request_count_metric_name}${buildStatusCodeFilter(labelFilters, definitions.error_status_code_value)}[${interval}]))`;

    case QueryType.CALLS_BY_SERVICE:
      return `sum by(${service_label_name}) (increase(${definitions.request_count_metric_name}${labelFilters}[${interval}]))`;
    
    case QueryType.AVG_DURATION_BY_SERVICE:
      return `sum by(${service_label_name}) (rate(${definitions.sum_duration_ms_metric_name}${labelFilters}[${interval}])) / sum by(${service_label_name}) (rate(${definitions.count_duration_ms_metric_name}${labelFilters}[${interval}]))`;
    
    case QueryType.SUM_DURATION_BY_SERVICE:
      return `sum by(${service_label_name}) (rate(${definitions.sum_duration_ms_metric_name}${labelFilters}[${interval}]))`;
    
    case QueryType.MIN_DURATION_BY_SERVICE:
      return `histogram_quantile(0.0, sum by(${service_label_name}, le) (rate(${definitions.bucket_duration_ms_metric_name}${labelFilters}[${interval}])))`;
    
    case QueryType.MAX_DURATION_BY_SERVICE:
      return `histogram_quantile(1.0, sum by(${service_label_name}, le) (rate(${definitions.bucket_duration_ms_metric_name}${labelFilters}[${interval}])))`;
    
    case QueryType.P50_BY_SERVICE:
      return `histogram_quantile(0.50, sum by(${service_label_name}, le) (rate(${definitions.bucket_duration_ms_metric_name}${labelFilters}[${interval}])))`;
  
    case QueryType.P75_BY_SERVICE:
      return `histogram_quantile(0.75, sum by(${service_label_name}, le) (rate(${definitions.bucket_duration_ms_metric_name}${labelFilters}[${interval}])))`;
  
    case QueryType.P90_BY_SERVICE:
      return `histogram_quantile(0.90, sum by(${service_label_name}, le) (rate(${definitions.bucket_duration_ms_metric_name}${labelFilters}[${interval}])))`;
  
    case QueryType.P95_BY_SERVICE:
      return `histogram_quantile(0.95, sum by(${service_label_name}, le) (rate(${definitions.bucket_duration_ms_metric_name}${labelFilters}[${interval}])))`;

    case QueryType.P99_BY_SERVICE:
      return `histogram_quantile(0.99, sum by(${service_label_name}, le) (rate(${definitions.bucket_duration_ms_metric_name}${labelFilters}[${interval}])))`;
      
    case QueryType.P50_BY_SERVICE_INTIME:
      return `histogram_quantile(0.50, sum(rate(${definitions.bucket_duration_ms_metric_name}${labelFilters}[${interval}])) by (${service_label_name}, le))`;
  
    case QueryType.P75_BY_SERVICE_INTIME:
      return `histogram_quantile(0.75, sum(rate(${definitions.bucket_duration_ms_metric_name}${labelFilters}[${interval}])) by (${service_label_name}, le))`;

    case QueryType.P90_BY_SERVICE_INTIME:
      return `histogram_quantile(0.90, sum(rate(${definitions.bucket_duration_ms_metric_name}${labelFilters}[${interval}])) by (${service_label_name}, le))`;

    case QueryType.P95_BY_SERVICE_INTIME:
      return `histogram_quantile(0.95, sum(rate(${definitions.bucket_duration_ms_metric_name}${labelFilters}[${interval}])) by (${service_label_name}, le))`;

    case QueryType.P99_BY_SERVICE_INTIME:
      return `histogram_quantile(0.99, sum(rate(${definitions.bucket_duration_ms_metric_name}${labelFilters}[${interval}])) by (${service_label_name}, le))`;

    case QueryType.APDEX_BY_SERVICE_INTIME:
      return `(sum by(${service_label_name}) (rate(${definitions.bucket_duration_ms_metric_name}${buildLeFilter(labelFilters, definitions.apdex_min_threshold_seconds)}[${interval}])) + sum by(${service_label_name}) (rate(${definitions.bucket_duration_ms_metric_name}${buildLeFilter(labelFilters, definitions.apdex_max_threshold_seconds)}[${interval}])) / 2) / sum by(${service_label_name}) (rate(${definitions.bucket_duration_ms_metric_name}${labelFilters}[${interval}]))`;
    
    case QueryType.CALLS_BY_SERVICE_AND_SPAN:
      return `sum by(${service_label_name}, ${span_label_name}, ${type_label_name}, ${http_method_label_name}, ${http_url_label_name}, ${net_host_port_label_name}) (increase(${definitions.request_count_metric_name}${labelFilters}[${interval}]))`;
    
    case QueryType.P50_BY_SERVICE_AND_SPAN:
      return `histogram_quantile(0.5, sum by(${service_label_name}, ${span_label_name}, ${type_label_name}, ${http_method_label_name}, ${http_url_label_name}, ${net_host_port_label_name}, le) (rate(${definitions.bucket_duration_ms_metric_name}${labelFilters}[${interval}])))`;
    
    case QueryType.P75_BY_SERVICE_AND_SPAN:
      return `histogram_quantile(0.75, sum by(${service_label_name}, ${span_label_name}, ${type_label_name}, ${http_method_label_name}, ${http_url_label_name}, ${net_host_port_label_name}, le) (rate(${definitions.bucket_duration_ms_metric_name}${labelFilters}[${interval}])))`;
    
    case QueryType.P90_BY_SERVICE_AND_SPAN:
      return `histogram_quantile(0.9, sum by(${service_label_name}, ${span_label_name}, ${type_label_name}, ${http_method_label_name}, ${http_url_label_name}, ${net_host_port_label_name}, le) (rate(${definitions.bucket_duration_ms_metric_name}${labelFilters}[${interval}])))`;
    
    case QueryType.P95_BY_SERVICE_AND_SPAN:
      return `histogram_quantile(0.95, sum by(${service_label_name}, ${span_label_name}, ${type_label_name}, ${http_method_label_name}, ${http_url_label_name}, ${net_host_port_label_name}, le) (rate(${definitions.bucket_duration_ms_metric_name}${labelFilters}[${interval}])))`;
    
    case QueryType.P99_BY_SERVICE_AND_SPAN:
      return `histogram_quantile(0.99, sum by(${service_label_name}, ${span_label_name}, ${type_label_name}, ${http_method_label_name}, ${http_url_label_name}, ${net_host_port_label_name}, le) (rate(${definitions.bucket_duration_ms_metric_name}${labelFilters}[${interval}])))`;
    
    case QueryType.AVG_DURATION_BY_SERVICE_AND_SPAN:
      return `sum by(${service_label_name}, ${span_label_name}, ${type_label_name}, ${http_method_label_name}, ${http_url_label_name}, ${net_host_port_label_name}) (rate(${definitions.sum_duration_ms_metric_name}${labelFilters}[${interval}])) / sum by(${service_label_name}, ${span_label_name}, ${type_label_name}, ${http_method_label_name}, ${http_url_label_name}, ${net_host_port_label_name}) (rate(${definitions.count_duration_ms_metric_name}${labelFilters}[${interval}]))`;
      
    case QueryType.MIN_DURATION_BY_SERVICE_AND_SPAN:
      return `histogram_quantile(0.0, sum by(${service_label_name}, ${span_label_name}, ${type_label_name}, ${http_method_label_name}, ${http_url_label_name}, ${net_host_port_label_name}, le) (rate(${definitions.bucket_duration_ms_metric_name}${labelFilters}[${interval}])))`;
    
    case QueryType.MAX_DURATION_BY_SERVICE_AND_SPAN:
      return `histogram_quantile(1.0, sum by(${service_label_name}, ${span_label_name}, ${type_label_name}, ${http_method_label_name}, ${http_url_label_name}, ${net_host_port_label_name}, le) (rate(${definitions.bucket_duration_ms_metric_name}${labelFilters}[${interval}])))`;
    
    case QueryType.ERROR_PERCENTAGE_BY_SERVICE_AND_SPAN:
      return `sum by(${service_label_name}, ${span_label_name}, ${type_label_name}, ${http_method_label_name}, ${http_url_label_name}, ${net_host_port_label_name}) (rate(${definitions.request_count_metric_name}${buildStatusCodeFilter(labelFilters, definitions.error_status_code_value)}[${interval}]))`;
  
    case QueryType.P50_BY_SERVICE_AND_SPAN_INTIME:
      return `histogram_quantile(0.50, sum(rate(${definitions.bucket_duration_ms_metric_name}${labelFilters}[${interval}])) by (${service_label_name}, ${span_label_name}, ${type_label_name}, ${http_method_label_name}, ${http_url_label_name}, ${net_host_port_label_name}, le))`;

    case QueryType.P75_BY_SERVICE_AND_SPAN_INTIME:
      return `histogram_quantile(0.75, sum(rate(${definitions.bucket_duration_ms_metric_name}${labelFilters}[${interval}])) by (${service_label_name}, ${span_label_name}, ${type_label_name}, ${http_method_label_name}, ${http_url_label_name}, ${net_host_port_label_name}, le))`;

    case QueryType.P90_BY_SERVICE_AND_SPAN_INTIME:
      return `histogram_quantile(0.90, sum(rate(${definitions.bucket_duration_ms_metric_name}${labelFilters}[${interval}])) by (${service_label_name}, ${span_label_name}, ${type_label_name}, ${http_method_label_name}, ${http_url_label_name}, ${net_host_port_label_name}, le))`;

    case QueryType.P95_BY_SERVICE_AND_SPAN_INTIME:
      return `histogram_quantile(0.95, sum(rate(${definitions.bucket_duration_ms_metric_name}${labelFilters}[${interval}])) by (${service_label_name}, ${span_label_name}, ${type_label_name}, ${http_method_label_name}, ${http_url_label_name}, ${net_host_port_label_name}, le))`;

    case QueryType.P99_BY_SERVICE_AND_SPAN_INTIME:
      return `histogram_quantile(0.99, sum(rate(${definitions.bucket_duration_ms_metric_name}${labelFilters}[${interval}])) by (${service_label_name}, ${span_label_name}, ${type_label_name}, ${http_method_label_name}, ${http_url_label_name}, ${net_host_port_label_name}, le))`;

    case QueryType.APDEX_BY_SERVICE_AND_SPAN_INTIME:
      return `(sum by(${service_label_name}, ${span_label_name}, ${type_label_name}, ${http_method_label_name}, ${http_url_label_name}, ${net_host_port_label_name}) (rate(${definitions.bucket_duration_ms_metric_name}${buildLeFilter(labelFilters, definitions.apdex_min_threshold_seconds)}[${interval}])) + sum by(${service_label_name}, ${span_label_name}, ${type_label_name}, ${http_method_label_name}, ${http_url_label_name}, ${net_host_port_label_name}) (rate(${definitions.bucket_duration_ms_metric_name}${buildLeFilter(labelFilters, definitions.apdex_max_threshold_seconds)}[${interval}])) / 2) / sum by(${service_label_name}, ${span_label_name}, ${type_label_name}, ${http_method_label_name}, ${http_url_label_name}, ${net_host_port_label_name}) (rate(${definitions.bucket_duration_ms_metric_name}${labelFilters}[${interval}]))`;

    case QueryType.RATE_BY_SERVICE_AND_SPAN_INTIME:
      return `sum by(${service_label_name}, ${span_label_name}, ${type_label_name}, ${http_method_label_name}, ${http_url_label_name}, ${net_host_port_label_name}) (rate(${definitions.request_count_metric_name}${labelFilters}[${interval}]))`;

    case QueryType.TOP_KEY_OPERATIONS_BY_SERVICE_AND_SPAN_INTIME:
      return `topk(5, sum by(${service_label_name}, ${span_label_name}, ${type_label_name}, ${http_method_label_name}, ${http_url_label_name}, ${net_host_port_label_name}) (rate(${definitions.request_count_metric_name}${labelFilters}[${interval}])))`;

    case QueryType.SERVICE_SPAN_RELATION:
      return `sum by(${client_label_name}, ${client_operation_name_label_name}, ${server_label_name}, ${server_operation_name_label_name}) (${definitions.service_graph_metric_name})`;

      case QueryType.SERVICE_RELATION:
        return `sum by(${client_label_name}, ${server_label_name}) (${definitions.service_graph_metric_name})`;

    default:
      throw new Error(`Unknown query type: ${queryType}`);
  }
};
/*
Sample Query

sum(rate(traces_spanmetrics_calls_total{service="frontend-proxy"}[300s])) * 300

count(count by (span_name) (rate(traces_spanmetrics_calls_total{service="frontend-proxy"}[300s])))

histogram_quantile(0.50, sum(rate(traces_spanmetrics_latency_bucket{service="frontend-proxy"}[300s])) by (span_name, type, le))

histogram_quantile(0.90, sum(rate(traces_spanmetrics_latency_bucket{service="frontend-proxy"}[300s])) by (span_name, type, le))

histogram_quantile(0.99, sum(rate(traces_spanmetrics_latency_bucket{service="frontend-proxy"}[300s])) by (span_name, type, le))

histogram_quantile(0.50, sum(rate(traces_spanmetrics_latency_bucket[5m])) by (le, service))

floor(sum by(service) (increase(traces_spanmetrics_calls_total[1m])))

sum(rate(traces_spanmetrics_calls_total{service="frontend-proxy"}[300s])) * 300

{traceId="25ea1224e6454aedfbc105be6f45f944"}

sum(rate(traces_spanmetrics_calls_total{span_name="GET /api/users"}[5m]))

{service="frontend-proxy"} |= "error"

{service="frontend-proxy"} | json | line_format "{{.timestamp}} [{{.level}}] {{.message}}"

histogram_quantile(0.95, sum(rate(traces_spanmetrics_latency_bucket[5m])) by (le, service))

{service.name="frontend-proxy" && duration > 100ms}

{service="frontend-proxy"} | json | level="error"

sum(rate(traces_spanmetrics_calls_total[5m])) by (service)










operationCount: ({ serviceName, windowSeconds }, cfg) =>
    `count(count by (${cfg.labels.span_name}) (rate(${cfg.metrics.traces_spanmetrics_calls_total}{${cfg.labels.service}="${serviceName}"}[${windowSeconds}s])))`,

  totalCalls: ({ serviceName, windowSeconds }, cfg) =>
    `sum(increase(${cfg.metrics.traces_spanmetrics_calls_total}{${cfg.labels.service}="${serviceName}"}[${windowSeconds}s])) by (${cfg.labels.span_name}, ${cfg.labels.type})`,

  maxLatencySpan: ({ serviceName, windowSeconds }, cfg) =>
    `topk(1, sum_over_time(${cfg.metrics.traces_spanmetrics_latency_sum}{${cfg.labels.service}="${serviceName}"}[${windowSeconds}s]) / sum_over_time(${cfg.metrics.traces_spanmetrics_latency_count}{${cfg.labels.service}="${serviceName}"}[${windowSeconds}s])) by (${cfg.labels.span_name})`,

  minLatencySpan: ({ serviceName, windowSeconds }, cfg) =>
    `bottomk(1, sum_over_time(${cfg.metrics.traces_spanmetrics_latency_sum}{${cfg.labels.service}="${serviceName}"}[${windowSeconds}s]) / sum_over_time(${cfg.metrics.traces_spanmetrics_latency_count}{${cfg.labels.service}="${serviceName}"}[${windowSeconds}s])) by (${cfg.labels.span_name})`,

  // CallMetrics queries (use fixed 1m rate window as in UI today)
  p50Latency: ({ serviceName, windowSeconds }, cfg) =>
    `histogram_quantile(0.50, sum(rate(${cfg.metrics.traces_spanmetrics_latency_bucket}{${cfg.labels.service}="${serviceName}"}[${windowSeconds}s])) by (${cfg.labels.span_name}, ${cfg.labels.type}, le))`,
  
  p90Latency: ({ serviceName, windowSeconds }, cfg) =>
    `histogram_quantile(0.90, sum(rate(${cfg.metrics.traces_spanmetrics_latency_bucket}{${cfg.labels.service}="${serviceName}"}[${windowSeconds}s])) by (${cfg.labels.span_name}, ${cfg.labels.type}, le))`,
  
  p99Latency: ({ serviceName, windowSeconds }, cfg) =>
    `histogram_quantile(0.99, sum(rate(${cfg.metrics.traces_spanmetrics_latency_bucket}{${cfg.labels.service}="${serviceName}"}[${windowSeconds}s])) by (${cfg.labels.span_name}, ${cfg.labels.type}, le))`,
  
  callsPerSecond: ({ serviceName, windowSeconds }, cfg) =>
    `sum(rate(${cfg.metrics.traces_spanmetrics_calls_total}{${cfg.labels.service}="${serviceName}"}[${windowSeconds}s])) by (${cfg.labels.span_name})`,
  
  apdex: ({ serviceName, windowSeconds }, cfg) =>
    `(sum(rate(${cfg.metrics.traces_spanmetrics_latency_bucket}{le="100",${cfg.labels.service}="${serviceName}"}[${windowSeconds}s])) + sum(rate(${cfg.metrics.traces_spanmetrics_latency_bucket}{le="400",${cfg.labels.service}="${serviceName}"}[${windowSeconds}s])) / 2) / sum(rate(${cfg.metrics.traces_spanmetrics_latency_count}{${cfg.labels.service}="${serviceName}"}[${windowSeconds}s]))`,
  
  apdexBySpan: ({ serviceName, windowSeconds }, cfg) =>
    `(sum(rate(${cfg.metrics.traces_spanmetrics_latency_bucket}{le="100",${cfg.labels.service}="${serviceName}"}[${windowSeconds}s])) by (${cfg.labels.span_name}) + sum(rate(${cfg.metrics.traces_spanmetrics_latency_bucket}{le="400",${cfg.labels.service}="${serviceName}"}[${windowSeconds}s])) by (${cfg.labels.span_name}) / 2) / sum(rate(${cfg.metrics.traces_spanmetrics_latency_count}{${cfg.labels.service}="${serviceName}"}[${windowSeconds}s])) by (${cfg.labels.span_name})`,
  
  topKeyOperations: ({ serviceName, windowSeconds }, cfg) =>
    `topk(5, sum(rate(${cfg.metrics.traces_spanmetrics_calls_total}{${cfg.labels.service}="${serviceName}"}[${windowSeconds}s])) by (${cfg.labels.span_name}))`,

  // ServiceCard queries (use 5m rate window)
  totalTraceCount: ({ serviceName, windowSeconds }, cfg) =>
    `sum(rate(${cfg.metrics.traces_spanmetrics_calls_total}{${cfg.labels.service}="${serviceName}"}[${windowSeconds}s])) * 300`,
  
  avgLatency: ({ serviceName, windowSeconds }, cfg) =>
    `sum(rate(${cfg.metrics.traces_spanmetrics_latency_sum}{${cfg.labels.service}="${serviceName}"}[${windowSeconds}s])) / sum(rate(${cfg.metrics.traces_spanmetrics_latency_count}{${cfg.labels.service}="${serviceName}"}[${windowSeconds}s]))`,
  
  minLatency: ({ serviceName, windowSeconds }, cfg) =>
    `min(rate(${cfg.metrics.traces_spanmetrics_latency_bucket}{${cfg.labels.service}="${serviceName}"}[${windowSeconds}s]))`,
  
  maxLatency: ({ serviceName, windowSeconds }, cfg) =>
    `histogram_quantile(0.99, sum(rate(${cfg.metrics.traces_spanmetrics_latency_bucket}{${cfg.labels.service}="${serviceName}"}[${windowSeconds}s])) by (le))`,

  // MiddleStatsCharts queries (global, no service filter)
  p50LatencyGlobal: ({ rateInterval = '5m', windowSeconds }, cfg) =>
    `histogram_quantile(0.50, sum(rate(${cfg.metrics.traces_spanmetrics_latency_bucket}[${rateInterval}])) by (le, ${cfg.labels.service}))`,
  
  p90LatencyGlobal: ({ rateInterval = '5m' }, cfg) =>
    `histogram_quantile(0.90, sum(rate(${cfg.metrics.traces_spanmetrics_latency_bucket}[${rateInterval}])) by (le, ${cfg.labels.service}))`,
  
  p95LatencyGlobal: ({ rateInterval = '5m' }, cfg) =>
    `histogram_quantile(0.95, sum(rate(${cfg.metrics.traces_spanmetrics_latency_bucket}[${rateInterval}])) by (le, ${cfg.labels.service}))`,

  // TraceQLBuilder queries (span-specific)
  errorRate: ({ spanName, rateInterval = '5m' }, cfg) =>
    `sum(rate(${cfg.metrics.traces_spanmetrics_calls_total}{${cfg.labels.span_name}="${spanName}", status_code!="STATUS_CODE_UNSET"}[${rateInterval}])) / sum(rate(${cfg.metrics.traces_spanmetrics_calls_total}{${cfg.labels.span_name}="${spanName}"}[${rateInterval}])) by (${cfg.labels.span_name}, ${cfg.labels.type})`,
  
  opsPerSec: ({ spanName, rateInterval = '5m' }, cfg) =>
    `sum(rate(${cfg.metrics.traces_spanmetrics_calls_total}{${cfg.labels.span_name}="${spanName}"}[${rateInterval}]))`,
  
  errorCount: ({ spanName, rateInterval = '5m' }, cfg) =>
    `sum(increase(${cfg.metrics.traces_spanmetrics_calls_total}{${cfg.labels.span_name}="${spanName}", status_code!="STATUS_CODE_UNSET"}[${rateInterval}]))`,
  
  latencyBucket: ({ spanName, le, rateInterval = '5m' }, cfg) =>
    `rate(${cfg.metrics.traces_spanmetrics_latency_bucket}{${cfg.labels.span_name}="${spanName}", le="${le}"}[${rateInterval}])`,
  
  approxAvgLatency: ({ spanName, rateInterval = '5m' }, cfg) =>
    `sum(rate(${cfg.metrics.traces_spanmetrics_latency_sum}{${cfg.labels.span_name}="${spanName}"}[${rateInterval}])) / sum(rate(${cfg.metrics.traces_spanmetrics_latency_count}{${cfg.labels.span_name}="${spanName}"}[${rateInterval}]))`,

  // ErrorStatsCharts query (global service call count)
  serviceCallCountGlobal: ({ rateInterval = '1m' }, cfg) =>
    `floor(sum by(${cfg.labels.service}) (increase(${cfg.metrics.traces_spanmetrics_calls_total}[${rateInterval}])))`,










  histogram_quantile(0.90,sum by(le) (rate(iyzitrace_span_metrics_duration_seconds_bucket{service_name="accounting"}[1m])))


  sum(rate(iyzitrace_span_metrics_duration_seconds_sum{service_name="accounting", span_name="order-consumed"}[1m])) 
/ 
(sum(rate(iyzitrace_span_metrics_duration_seconds_count{service_name="accounting", span_name="order-consumed"}[1m])))
*/