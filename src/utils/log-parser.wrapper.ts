/**
 * Log Parser Wrapper
 * Grafana plugin utilities'ini sarmalayan abstraction layer
 * Bu sayede Grafana versiyonlarına bağımlılık minimize edilir
 */

import { 
  LogParserInterface, 
  LogFormatDetection, 
  ParsedLogLine 
} from '../interfaces/log-parser.interface';

// Grafana plugin'indeki utilities (mevcut implementation)
import { 
  isLogLineJSON as grafanaIsLogLineJSON,
  isLogLineLogfmt as grafanaIsLogLineLogfmt,
  parseLogfmtKeyValues as grafanaParseLogfmtKeyValues
} from '../plugins/datasource/loki/lineParser';

/**
 * Log Parser Wrapper Implementation
 * Grafana utilities'ini wrap eder ve kendi interface'imizi implement eder
 */
export class LogParserWrapper implements LogParserInterface {
  
  /**
   * JSON format detection - Grafana utility wrapper
   */
  isLogLineJSON(line: string): boolean {
    try {
      return grafanaIsLogLineJSON(line);
    } catch (error) {
      // Fallback implementation
      return this.fallbackIsJSON(line);
    }
  }

  /**
   * Logfmt format detection - Grafana utility wrapper
   */
  isLogLineLogfmt(line: string): boolean {
    try {
      return grafanaIsLogLineLogfmt(line);
    } catch (error) {
      // Fallback implementation
      return this.fallbackIsLogfmt(line);
    }
  }

  /**
   * Logfmt parsing - Grafana utility wrapper
   */
  parseLogfmtKeyValues(line: string): Record<string, string> {
    try {
      return grafanaParseLogfmtKeyValues(line);
    } catch (error) {
      // Fallback implementation
      return this.fallbackParseLogfmt(line);
    }
  }

  /**
   * Advanced log format detection with confidence scoring
   */
  detectLogFormat(line: string): LogFormatDetection {
    // JSON detection
    if (this.isLogLineJSON(line)) {
      return {
        format: 'json',
        confidence: 0.95
      };
    }

    // Logfmt detection
    if (this.isLogLineLogfmt(line)) {
      return {
        format: 'logfmt',
        confidence: 0.90
      };
    }

    // Default to text
    return {
      format: 'text',
      confidence: 0.50
    };
  }

  /**
   * Complete log line parsing with format detection
   */
  parseLogLine(line: string): ParsedLogLine {
    const detection = this.detectLogFormat(line);
    
    switch (detection.format) {
      case 'json':
        return this.parseJSONLog(line);
      case 'logfmt':
        return this.parseLogfmtLog(line);
      default:
        return this.parseTextLog(line);
    }
  }

  /**
   * JSON log parsing
   */
  private parseJSONLog(line: string): ParsedLogLine {
    try {
      const parsed = JSON.parse(line);
      return {
        format: 'json',
        level: this.extractLevel(parsed.level || parsed.severity),
        service: parsed.service || parsed.service_name,
        message: parsed.message || parsed.msg || line,
        attributes: parsed,
        traceId: parsed.trace_id || parsed.traceId,
        spanId: parsed.span_id || parsed.spanId,
        timestamp: parsed.timestamp || parsed.time
      };
    } catch {
      return this.parseTextLog(line);
    }
  }

  /**
   * Logfmt log parsing
   */
  private parseLogfmtLog(line: string): ParsedLogLine {
    const attributes = this.parseLogfmtKeyValues(line);
    
    return {
      format: 'logfmt',
      level: this.extractLevel(attributes.level || attributes.severity),
      service: attributes.service || attributes.service_name,
      message: attributes.message || attributes.msg || line,
      attributes,
      traceId: attributes.trace_id || attributes.traceId,
      spanId: attributes.span_id || attributes.spanId,
      timestamp: attributes.timestamp || attributes.time
    };
  }

  /**
   * Text log parsing
   */
  private parseTextLog(line: string): ParsedLogLine {
    // Basic text parsing patterns
    const levelMatch = line.match(/\[(DEBUG|INFO|WARN|WARNING|ERROR|FATAL|TRACE)\]/i);
    const level = this.extractLevel(levelMatch?.[1]);

    // Service extraction: looks for "service:" pattern
    const serviceMatch = line.match(/\]\s*([^:\s]+)\s*:/);
    const service = serviceMatch?.[1];

    // Trace/Span ID extraction
    const traceMatch = line.match(/TraceID:\s*([\w-]+)/i);
    const spanMatch = line.match(/SpanID:\s*([\w-]+)/i);

    return {
      format: 'text',
      level,
      service,
      message: line,
      attributes: {},
      traceId: traceMatch?.[1],
      spanId: spanMatch?.[1]
    };
  }

  /**
   * Level standardization - Public method for external use
   */
  extractLevel(level: string | undefined): 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL' {
    if (!level) {
      return 'INFO';
    }
    const upperLevel = level.toUpperCase();
    if (['DEBUG', 'INFO', 'WARN', 'WARNING', 'ERROR', 'FATAL'].includes(upperLevel)) {
      return upperLevel === 'WARNING' ? 'WARN' : upperLevel as 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';
    }
    return 'INFO';
  }

  // ========================================
  // FALLBACK IMPLEMENTATIONS
  // Grafana utilities çalışmadığında kullanılır
  // ========================================

  /**
   * Fallback JSON detection
   */
  private fallbackIsJSON(line: string): boolean {
    try {
      const parsed = JSON.parse(line);
      return typeof parsed === 'object' && parsed !== null;
    } catch {
      return false;
    }
  }

  /**
   * Fallback logfmt detection
   */
  private fallbackIsLogfmt(line: string): boolean {
    // Basic logfmt pattern: key=value pairs
    const logfmtPattern = /(?:^|\s)[\w\(\)\[\]\{\}]+=(?:""|(?:".*?[^\\]"|[^"\s]\S*))/;
    return logfmtPattern.test(line);
  }

  /**
   * Fallback logfmt parsing
   */
  private fallbackParseLogfmt(line: string): Record<string, string> {
    const attributes: Record<string, string> = {};
    const pattern = /(?:^|\s)([\w\(\)\[\]\{\}]+)=(""|(?:".*?[^\\]"|[^"\s]\S*))/g;
    
    let match;
    while ((match = pattern.exec(line)) !== null) {
      const key = match[1];
      let value = match[2];
      
      // Remove quotes from quoted values
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      
      attributes[key] = value;
    }
    
    return attributes;
  }
}

// Singleton instance export
export const logParser = new LogParserWrapper();
