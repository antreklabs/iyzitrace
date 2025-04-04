import { startCase, uniq } from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import { DataSourceApi, parseDuration, ScopedVars, SelectableValue } from '@grafana/data';
import { getDataSourceSrv, getTemplateSrv } from '@grafana/runtime';
import { VariableFormatID } from '@grafana/schema';

import { TraceqlFilter, TraceqlSearchScope ,Scope, TempoQuery} from '../../../interfaces';

import TempoLanguageProvider from './language_provider';
import { intrinsics } from './constant';

export const generateId = () => uuidv4().slice(0, 8);

export function getEscapedSpanNames(values: string[]) {
    return values.map((value: string) => value.replace(/\\/g, '\\\\\\\\').replace(/[$^*{}\[\]\'+?.()|]/g, '\\\\$&'));
}

export const interpolateFilters = (filters: TraceqlFilter[], scopedVars?: ScopedVars) => {
  const interpolatedFilters = filters.map((filter) => {
    const updatedFilter = {
      ...filter,
      tag: getTemplateSrv().replace(filter.tag ?? '', scopedVars ?? {}),
    };

    if (filter.value) {
      updatedFilter.value =
        typeof filter.value === 'string'
          ? getTemplateSrv().replace(filter.value ?? '', scopedVars ?? {}, VariableFormatID.Pipe)
          : filter.value.map((v) => getTemplateSrv().replace(v ?? '', scopedVars ?? {}, VariableFormatID.Pipe));
    }

    return updatedFilter;
  });

  return interpolatedFilters;
};

const isRegExpOperator = (operator: string) => operator === '=~' || operator === '!~';

const escapeValues = (values: string[]) => getEscapedSpanNames(values);

export const valueHelper = (f: TraceqlFilter) => {
  const value = Array.isArray(f.value) && isRegExpOperator(f.operator!) ? escapeValues(f.value) : f.value;

  if (Array.isArray(value) && value.length > 1) {
    return `"${value.join('|')}"`;
  }
  if (f.valueType === 'string') {
    return `"${value}"`;
  }
  return value;
};

export const scopeHelper = (f: TraceqlFilter, lp: TempoLanguageProvider) => {
  // Intrinsic fields don't have a scope
  if (lp.getIntrinsics().find((t) => t === f.tag)) {
    return '';
  }
  return (
    (f.scope === TraceqlSearchScope.Event ||
    f.scope === TraceqlSearchScope.Instrumentation ||
    f.scope === TraceqlSearchScope.Link ||
    f.scope === TraceqlSearchScope.Resource ||
    f.scope === TraceqlSearchScope.Span
      ? f.scope?.toLowerCase()
      : '') + '.'
  );
};

export const tagHelper = (f: TraceqlFilter, filters: TraceqlFilter[]) => {
  if (f.tag === 'duration') {
    const durationType = filters.find((f) => f.id === 'duration-type');
    if (durationType) {
      return durationType.value === 'trace' ? 'traceDuration' : 'duration';
    }
    return f.tag;
  }
  return f.tag;
};

export const filterToQuerySection = (f: TraceqlFilter, filters: TraceqlFilter[], lp: TempoLanguageProvider) => {
  if (Array.isArray(f.value) && f.value.length > 1 && !isRegExpOperator(f.operator!)) {
    return `(${f.value.map((v) => `${scopeHelper(f, lp)}${tagHelper(f, filters)}${f.operator}${valueHelper({ ...f, value: v })}`).join(' || ')})`;
  }

  return `${scopeHelper(f, lp)}${tagHelper(f, filters)}${f.operator}${valueHelper(f)}`;
};

export const getTagWithoutScope = (tag: string) => {
  return tag.replace(/^(event|instrumentation|link|resource|span)\./, '');
};

export const filterScopedTag = (f: TraceqlFilter, lp: TempoLanguageProvider) => {
  return scopeHelper(f, lp) + f.tag;
};

export const filterTitle = (f: TraceqlFilter, lp: TempoLanguageProvider) => {
  // Special case for the intrinsic "name" since a label called "Name" isn't explicit
  if (f.tag === 'name') {
    return 'Span Name';
  }
  // Special case for the resource service name
  if (f.tag === 'service.name' && f.scope === TraceqlSearchScope.Resource) {
    return 'Service Name';
  }
  return startCase(filterScopedTag(f, lp));
};

export const getFilteredTags = (tags: string[], staticTags: Array<string | undefined>) => {
  return [...tags].filter((t) => !staticTags.includes(t));
};

export const getUnscopedTags = (scopes: Scope[]) => {
  return uniq(
    scopes
      .map((scope: Scope) =>
        scope.name && scope.name !== TraceqlSearchScope.Intrinsic && scope.tags ? scope.tags : []
      )
      .flat()
  );
};

export const getIntrinsicTags = (scopes: Scope[]) => {
  let tags = scopes
    .map((scope: Scope) => (scope.name && scope.name === TraceqlSearchScope.Intrinsic && scope.tags ? scope.tags : []))
    .flat();

  // Add the default intrinsic tags to the list of tags.
  // This is needed because the /api/v2/search/tags API
  // may not always return all the default intrinsic tags
  // but generally has the most up to date list.
  tags = uniq(tags.concat(intrinsics));
  return tags;
};

export const getAllTags = (scopes: Scope[]) => {
  return uniq(scopes.map((scope: Scope) => (scope.tags ? scope.tags : [])).flat());
};

export const getTagsByScope = (scopes: Scope[], scope: TraceqlSearchScope | string) => {
  return uniq(scopes.map((s: Scope) => (s.name && s.name === scope && s.tags ? s.tags : [])).flat());
};

export function replaceAt<T>(array: T[], index: number, value: T) {
  const ret = array.slice(0);
  ret[index] = value;
  return ret;
}

export const operatorSelectableValue = (op: string) => {
  const result: SelectableValue = { label: op, value: op };
  switch (op) {
    case '=':
      result.description = 'Equals';
      break;
    case '!=':
      result.description = 'Not equals';
      break;
    case '>':
      result.description = 'Greater';
      break;
    case '>=':
      result.description = 'Greater or Equal';
      break;
    case '<':
      result.description = 'Less';
      break;
    case '<=':
      result.description = 'Less or Equal';
      break;
    case '=~':
      result.description = 'Matches regex';
      break;
    case '!~':
      result.description = 'Does not match regex';
      break;
  }
  return result;
};



export const getErrorMessage = (message: string | undefined, prefix?: string) => {
  const err = message ? ` (${message})` : '';
  let errPrefix = prefix ? prefix : 'Error';
  return `${errPrefix}${err}. Please check the server logs for more details.`;
};

export async function getDS(uid?: string): Promise<DataSourceApi | undefined> {
  if (!uid) {
    return undefined;
  }

  const dsSrv = getDataSourceSrv();
  try {
    return await dsSrv.get(uid);
  } catch (error) {
    console.error('Failed to load data source', error);
    return undefined;
  }
}

export const migrateFromSearchToTraceQLSearch = (query: TempoQuery) => {
  let filters: TraceqlFilter[] = [];
  if (query.spanName) {
    filters.push({
      id: 'span-name',
      scope: TraceqlSearchScope.Span,
      tag: 'name',
      operator: '=',
      value: [query.spanName],
      valueType: 'string',
    });
  }
  if (query.serviceName) {
    filters.push({
      id: 'service-name',
      scope: TraceqlSearchScope.Resource,
      tag: 'service.name',
      operator: '=',
      value: [query.serviceName],
      valueType: 'string',
    });
  }
  if (query.minDuration || query.maxDuration) {
    filters.push({
      id: 'duration-type',
      value: 'trace',
    });
  }
  if (query.minDuration) {
    filters.push({
      id: 'min-duration',
      tag: 'duration',
      operator: '>',
      value: [query.minDuration],
      valueType: 'duration',
    });
  }
  if (query.maxDuration) {
    filters.push({
      id: 'max-duration',
      tag: 'duration',
      operator: '<',
      value: [query.maxDuration],
      valueType: 'duration',
    });
  }
  if (query.search) {
    const tags = query.search.split(' ');
    for (const tag of tags) {
      const [key, value] = tag.split('=');
      if (key && value) {
        filters.push({
          id: generateId(),
          scope: TraceqlSearchScope.Unscoped,
          tag: key,
          operator: '=',
          value: [value.replace(/(^"|"$)/g, '')], // remove quotes at start and end of string
          valueType: value.startsWith('"') && value.endsWith('"') ? 'string' : undefined,
        });
      }
    }
  }

  const migratedQuery: TempoQuery = {
    datasource: query.datasource,
    filters,
    limit: query.limit,
    query: query.query,
    queryType: 'traceqlSearch',
    refId: query.refId,
  };
  return migratedQuery;
};

export const stepToNanos = (step?: string) => {
  if (!step) {
    return 0;
  }

  const match = step.match(/(\d+)(.+)/);

  const rawLength = match?.[1];
  const unit = match?.[2];

  if (rawLength) {
    if (unit === 'ns') {
      return parseInt(rawLength, 10);
    }
    if (unit === 'µs') {
      return parseInt(rawLength, 10) * 1000;
    }
    if (unit === 'ms') {
      return parseInt(rawLength, 10) * 1000000;
    }
    const duration = parseDuration(step);
    return (
      (duration.seconds || 0) * 1000000000 +
      (duration.minutes || 0) * 60000000000 +
      (duration.hours || 0) * 3600000000000
    );
  }

  return 0;
};