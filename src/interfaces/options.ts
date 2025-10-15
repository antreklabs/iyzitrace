export interface ServiceMapItem {
  id: string;
  name: string;
  layer: string;
  position: string;
  groupPosition: string;
  groupSize: number;
  imageUrl: string;
}

export interface PluginJsonData {
  defaultLokiUid?: string;
  defaultTempoUid?: string;
  defaultTimeRanges?: string[];
  defaultAbsoluteRange?: [number, number];
  serviceMap?: ServiceMapItem[];
}

export interface PluginSecureJsonData {
  apiKey?: string;
}


