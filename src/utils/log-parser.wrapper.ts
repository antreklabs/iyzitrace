
import { 
  LogParserInterface, 
  LogFormatDetection, 
  ParsedLogLine 
} from '../interfaces/utils/log-parser.interface';

import { 
  isLogLineJSON as grafanaIsLogLineJSON,
  isLogLineLogfmt as grafanaIsLogLineLogfmt,
  parseLogfmtKeyValues as grafanaParseLogfmtKeyValues
} from './line-parser.util';

export class LogParserWrapper implements LogParserInterface {
  
  isLogLineJSON(line: string): boolean {
    try {
      return grafanaIsLogLineJSON(line);
    } catch (error) {
      return this.fallbackIsJSON(line);
    }
  }

  isLogLineLogfmt(line: string): boolean {
    try {
      return grafanaIsLogLineLogfmt(line);
    } catch (error) {
      return this.fallbackIsLogfmt(line);
    }
  }

  parseLogfmtKeyValues(line: string): Record<string, string> {
    try {
      return grafanaParseLogfmtKeyValues(line);
    } catch (error) {
      return this.fallbackParseLogfmt(line);
    }
  }

  detectLogFormat(line: string): LogFormatDetection {
    if (this.isLogLineJSON(line)) {
      return {
        format: 'json',
        confidence: 0.95
      };
    }

    if (this.isLogLineLogfmt(line)) {
      return {
        format: 'logfmt',
        confidence: 0.90
      };
    }

    return {
      format: 'text',
      confidence: 0.50
    };
  }

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

  private parseTextLog(line: string): ParsedLogLine {
    const levelMatch = line.match(/\[(DEBUG|INFO|WARN|WARNING|ERROR|FATAL|TRACE)\]/i);
    const level = this.extractLevel(levelMatch?.[1]);

    const serviceMatch = line.match(/\]\s*([^:\s]+)\s*:/);
    const service = serviceMatch?.[1];

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

  private fallbackIsJSON(line: string): boolean {
    try {
      const parsed = JSON.parse(line);
      return typeof parsed === 'object' && parsed !== null;
    } catch {
      return false;
    }
  }

  private fallbackIsLogfmt(line: string): boolean {
    const logfmtPattern = /(?:^|\s)[\w\(\)\[\]\{\}]+=(?:""|(?:".*?[^\\]"|[^"\s]\S*))/;
    return logfmtPattern.test(line);
  }

  private fallbackParseLogfmt(line: string): Record<string, string> {
    const attributes: Record<string, string> = {};
    const pattern = /(?:^|\s)([\w\(\)\[\]\{\}]+)=(""|(?:".*?[^\\]"|[^"\s]\S*))/g;
    
    let match;
    while ((match = pattern.exec(line)) !== null) {
      const key = match[1];
      let value = match[2];
      
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      
      attributes[key] = value;
    }
    
    return attributes;
  }
}

export const logParser = new LogParserWrapper();