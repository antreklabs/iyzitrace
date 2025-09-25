/**
 * Log parsing interface abstraction
 * Bu interface Grafana plugin'lerinden bağımsız log parsing sağlar
 */

export interface LogParserInterface {
  /**
   * Verilen log line'ının JSON formatında olup olmadığını kontrol eder
   */
  isLogLineJSON(line: string): boolean;

  /**
   * Verilen log line'ının logfmt formatında olup olmadığını kontrol eder
   */
  isLogLineLogfmt(line: string): boolean;

  /**
   * Logfmt formatındaki string'i key-value pairs'e parse eder
   */
  parseLogfmtKeyValues(line: string): Record<string, string>;

  /**
   * Log level'ı standardize eder
   */
  extractLevel(level: string | undefined): 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';
}

/**
 * Log format detection result
 */
export interface LogFormatDetection {
  format: 'json' | 'logfmt' | 'text';
  confidence: number; // 0-1 arası güven skoru
}

/**
 * Parsed log line result
 */
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
