export interface TempoServiceMapQuery {
  refId: string;
  queryType: string;
  serviceMapQuery?: string;
  serviceMapIncludeNamespace?: boolean;
  serviceMapUseNativeHistograms?: boolean;
  datasource?: {
    type: string;
    uid: string;
  };
}