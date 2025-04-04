import { DataSourceJsonData } from "@grafana/schema";
import { TraceqlSearchScope } from "../enums";

export interface NodeGraphOptions {
    enabled?: boolean;
}

export interface NodeGraphData extends DataSourceJsonData {
    nodeGraph?: NodeGraphOptions;
}

export interface SpanBarOptions {
    type?: string;
    tag?: string;
}

export interface SpanBarOptionsData extends DataSourceJsonData {
    spanBar?: SpanBarOptions;
}

export interface TraceToLogsTag {
    key: string;
    value?: string;
  }
  
  // @deprecated use getTraceToLogsOptions to get the v2 version of this config from jsonData
  export interface TraceToLogsOptions {
    datasourceUid?: string;
    tags?: string[];
    mappedTags?: TraceToLogsTag[];
    mapTagNamesEnabled?: boolean;
    spanStartTimeShift?: string;
    spanEndTimeShift?: string;
    filterByTraceID?: boolean;
    filterBySpanID?: boolean;
    lokiSearch?: boolean; // legacy
  }
  
  export interface TraceToLogsOptionsV2 {
    datasourceUid?: string;
    tags?: TraceToLogsTag[];
    spanStartTimeShift?: string;
    spanEndTimeShift?: string;
    filterByTraceID?: boolean;
    filterBySpanID?: boolean;
    query?: string;
    customQuery: boolean;
  }
  
  export interface TraceToLogsData extends DataSourceJsonData {
    tracesToLogs?: TraceToLogsOptions;
    tracesToLogsV2?: TraceToLogsOptionsV2;
  }
  export interface TraceqlFilter {
    /**
     * Uniquely identify the filter, will not be used in the query generation
     */
    id: string;
    /**
     * The operator that connects the tag to the value, for example: =, >, !=, =~
     */
    operator?: string;
    /**
     * The scope of the filter, can either be unscoped/all scopes, resource or span
     */
    scope?: TraceqlSearchScope;
    /**
     * The tag for the search filter, for example: .http.status_code, .service.name, status
     */
    tag?: string;
    /**
     * The value for the search filter
     */
    value?: (string | string[]);
    /**
     * The type of the value, used for example to check whether we need to wrap the value in quotes when generating the query
     */
    valueType?: string;
  }
