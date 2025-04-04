import { TempoDatasource } from "@/providers";
import { DataQuery, DataSourceJsonData } from "@grafana/schema";

export enum TempoVariableQueryType {
    LabelNames,
    LabelValues,
  }
  
  export interface TempoVariableQuery extends DataQuery {
    type: TempoVariableQueryType;
    label?: string;
    stream?: string;
  }
  
  
  export type TempoVariableQueryEditorProps = {
    onChange: (value: TempoVariableQuery) => void;
    query: TempoVariableQuery;
    datasource: TempoDatasource;
  };

  export interface TagLimitOptions extends DataSourceJsonData {
    tagLimit?: number;
  }

  export interface TraceToProfilesOptions {
    datasourceUid?: string;
    tags?: Array<{ key: string; value?: string }>;
    query?: string;
    profileTypeId?: string;
    customQuery: boolean;
  }
  
  export interface TraceToProfilesData extends DataSourceJsonData {
    tracesToProfiles?: TraceToProfilesOptions;
  }