export interface TempoStoreState {
    tempoUids: string[];
    selectedTempoUid: string | null;
    selectedPrometheusUid: string | null;
}

export interface TraceQLSearchParams {
    query: string;
    start: number;
    end: number;
    limit?: number;
  };
