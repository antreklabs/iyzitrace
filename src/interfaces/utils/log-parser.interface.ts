
export interface LogParserInterface {
  isLogLineJSON(line: string): boolean;

  isLogLineLogfmt(line: string): boolean;

  parseLogfmtKeyValues(line: string): Record<string, string>;

  extractLevel(level: string | undefined): 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';
}

export interface LogFormatDetection {
  format: 'json' | 'logfmt' | 'text';
  confidence: number;
}

export interface ParsedLogLine {
  format: LogFormatDetection['format'];
  level?: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';
  service?: string;
  message: string;
  attributes: Record<string, any>;
  traceId?: string;
  spanId?: string;
  timestamp?: string;
}