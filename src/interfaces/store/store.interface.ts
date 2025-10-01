export interface DataSourceStoreState {
    uids: string[];
    selectedUid: string | null;
}

export interface TraceQLSearchParams {
    query: string;
    start: number;
    end: number;
    limit?: number;
  };
