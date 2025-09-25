export interface LokiStream {
  stream: Record<string, string>;
  values: [string, string][];
}

export interface LokiResponse {
  status: string;
  data: {
    resultType: string;
    result: LokiStream[];
    stats?: any;
  };
}
