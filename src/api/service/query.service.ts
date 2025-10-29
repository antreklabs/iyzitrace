// URL parametrelerini düzenli yapıya dönüştüren model sınıfı
export class FilterParamsModel {
  timeRange: {
    from: string;
    to: string;
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

  constructor(params: Record<string, string>) {
    // Time range - Default to last 15 minutes
    const now = Date.now();
    const fifteenMinutesAgo = now - (15 * 60 * 1000);
    
    this.timeRange = {
      from: params.from || fifteenMinutesAgo.toString(),
      to: params.to || now.toString(),
      get datetime() {
        return {
          from: this.from ? new Date(parseInt(this.from)).toISOString() : '',
          to: this.to ? new Date(parseInt(this.to)).toISOString() : ''
        };
      },
      get rangeText() {
        if (this.from && this.to) {
          const fromDate = new Date(parseInt(this.from));
          const toDate = new Date(parseInt(this.to));
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
