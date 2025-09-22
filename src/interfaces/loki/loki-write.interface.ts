export interface LokiWriteOptions {
  stream?: string;
  labels?: Record<string, string>;
  timestamp?: string;
}

export interface LokiWriteResult {
  success: boolean;
  message?: string;
  error?: string;
}
