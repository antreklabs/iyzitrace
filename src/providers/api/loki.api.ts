import { LogEntry, LogSearchResult } from '../../interfaces/logs.interface';

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

export interface LokiQueryParams {
  query: string;
  start: string;
  end: string;
  limit?: number;
  direction?: 'forward' | 'backward';
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

class LokiApi {
  private baseUrl: string;

  constructor() {
    // CORS proxy üzerinden Loki API'sine erişim
    this.baseUrl = 'http://localhost:3101';
  }

  /**
   * Loki'den log verilerini çeker
   */
  async queryLogs(params: LokiQueryParams): Promise<LogSearchResult> {
    try {
      const queryParams = new URLSearchParams({
        query: params.query,
        start: params.start,
        end: params.end,
        limit: (params.limit || 100).toString(),
        direction: params.direction || 'backward'
      });

      const response = await fetch(`${this.baseUrl}/query_range?${queryParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors' // CORS mode ekle
      });

      if (!response.ok) {
        throw new Error(`Loki API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return this.transformLokiResponse(data, params.orderBy, params.orderDirection);
    } catch (error) {
      console.error('Loki query error:', error);
      throw error;
    }
  }


  /**
   * Loki response'unu LogEntry formatına dönüştürür
   */
  private transformLokiResponse(response: any, orderBy?: string, orderDirection?: 'asc' | 'desc'): LogSearchResult {
    const logs: LogEntry[] = [];
    
    if (response.data && response.data.result) {
      response.data.result.forEach((stream: any) => {
        stream.values.forEach((value: [string, string], index: number) => {
          const [timestamp, logLine] = value;
          const labelData = stream.stream || {};
          
          // Log line'ından level, service ve message'ı parse et
          const parsed = this.parseLogLine(logLine);
          
          // Service field'ını attributes.service'den al
          const correctService = labelData.service || parsed.service || 'unknown';
          
          logs.push({
            id: `loki-${timestamp}-${index}`,
            timestamp: new Date(parseInt(timestamp) / 1000000).toISOString(), // Nanosecond to millisecond
            level: parsed.level,
            service: correctService, // attributes.service'den gelen doğru değer
            message: parsed.message || logLine,
            attributes: {
              ...labelData,
              ...parsed.attributes
            },
            traceId: parsed.traceId,
            spanId: parsed.spanId,
            hostname: labelData.hostname || labelData.instance,
            environment: labelData.environment,
            namespace: labelData.namespace,
            pod: labelData.pod,
            deployment: labelData.deployment,
            cluster: labelData.cluster
          });
        });
      });
    }
    
    // Sıralama uygula
    let sortedLogs = logs;
    if (orderBy) {
      sortedLogs = logs.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (orderBy) {
          case 'timestamp':
            aValue = new Date(a.timestamp).getTime();
            bValue = new Date(b.timestamp).getTime();
            break;
          case 'level':
            aValue = a.level;
            bValue = b.level;
            break;
          case 'service':
            aValue = a.service;
            bValue = b.service;
            break;
          default:
            aValue = new Date(a.timestamp).getTime();
            bValue = new Date(b.timestamp).getTime();
        }

        const result = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        return orderDirection === 'desc' ? -result : result;
      });
    } else {
      // Default: timestamp desc
      sortedLogs = logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }

    return {
      logs: sortedLogs,
      total: logs.length,
      hasMore: logs.length >= 100
    };
  }

  /**
   * Log line'ından structured data parse eder
   */
  private parseLogLine(logLine: string): {
    level: LogEntry['level'];
    service?: string;
    message: string;
    attributes: Record<string, any>;
    traceId?: string;
    spanId?: string;
  } {
    // JSON formatında log line'ı kontrol et
    try {
      const jsonLog = JSON.parse(logLine);
      return {
        level: this.extractLevel(jsonLog.level || jsonLog.severity || 'INFO'),
        service: jsonLog.service || jsonLog.service_name,
        message: jsonLog.message || jsonLog.msg || logLine,
        attributes: jsonLog,
        traceId: jsonLog.trace_id || jsonLog.traceId,
        spanId: jsonLog.span_id || jsonLog.spanId
      };
    } catch {
      // JSON değilse, text formatında parse et
      return this.parseTextLog(logLine);
    }
  }

  /**
   * Text formatındaki log'u parse eder
   */
  private parseTextLog(logLine: string): {
    level: LogEntry['level'];
    service?: string;
    message: string;
    attributes: Record<string, any>;
    traceId?: string;
    spanId?: string;
  } {
    // Yaygın log formatlarını parse et
    const levelMatch = logLine.match(/\b(DEBUG|INFO|WARN|WARNING|ERROR|FATAL|TRACE)\b/i);
    const level = levelMatch ? this.extractLevel(levelMatch[1]) : 'INFO';
    
    // Service name'i extract et
    const serviceMatch = logLine.match(/\[([^\]]+)\]/);
    const service = serviceMatch ? serviceMatch[1] : undefined;
    
    // Trace ID'yi extract et
    const traceMatch = logLine.match(/trace[_-]?id[=:]\s*([a-f0-9-]+)/i);
    const traceId = traceMatch ? traceMatch[1] : undefined;
    
    return {
      level,
      service,
      message: logLine,
      attributes: {},
      traceId
    };
  }

  /**
   * Log level'ı standardize eder
   */
  private extractLevel(level: string): LogEntry['level'] {
    const upperLevel = level.toUpperCase();
    if (['DEBUG', 'INFO', 'WARN', 'WARNING', 'ERROR', 'FATAL'].includes(upperLevel)) {
      return upperLevel === 'WARNING' ? 'WARN' : upperLevel as LogEntry['level'];
    }
    return 'INFO';
  }

  /**
   * Log labels'ları listeler
   */
  async getLabels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/labels`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Loki labels API error: ${response.status}`);
      }

      await response.json();
      // Labels'ları extract et ve döndür
      return ['service', 'level', 'environment', 'namespace', 'pod', 'deployment', 'cluster'];
    } catch (error) {
      console.error('Loki labels error:', error);
      return [];
    }
  }

  /**
   * Label values'ları listeler
   */
  async getLabelValues(label: string): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/label/${label}/values`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Loki label values API error: ${response.status}`);
      }

      await response.json();
      // Label values'ları extract et ve döndür
      return [];
    } catch (error) {
      console.error('Loki label values error:', error);
      return [];
    }
  }
}

export const lokiApi = new LokiApi();
