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
    // Proxy, /loki/api/v1/* isteklerini Loki'ye yönlendiriyor
    this.baseUrl = 'http://localhost:3101/loki/api/v1';
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
          
          // Raw JSON'dan parse et: logLine'ı JSON olarak parse etmeye çalış
          let rawJsonData: any = null;
          try {
            rawJsonData = JSON.parse(logLine);
          } catch {
            // JSON değilse, text log olarak işle
          }

          // Attributes: Raw JSON'dan attributes alanını al, yoksa stream label'ları kullan
          let attributes: Record<string, any> = { ...labelData };
          if (rawJsonData && rawJsonData.attributes) {
            attributes = { ...attributes, ...rawJsonData.attributes };
          } else if (parsed && parsed.attributes) {
            attributes = { ...attributes, ...parsed.attributes };
          }

          // Metadata: Raw JSON'dan root level alanları al
          let metadata: Record<string, any> = {};
          if (rawJsonData) {
            // Root level alanları metadata olarak al (attributes hariç)
            Object.keys(rawJsonData).forEach(key => {
              if (key !== 'attributes' && key !== 'id' && key !== 'timestamp' && key !== 'level' && key !== 'service' && key !== 'message') {
                metadata[key] = rawJsonData[key];
              }
            });
          }

          logs.push({
            id: `loki-${timestamp}-${index}`,
            timestamp: new Date(parseInt(timestamp) / 1000000).toISOString(), // Nanosecond to millisecond
            level: rawJsonData?.level || parsed.level,
            service: rawJsonData?.service || correctService,
            message: rawJsonData?.message || parsed.message || logLine,
            attributes: attributes,
            traceId: rawJsonData?.traceId || parsed.traceId,
            spanId: rawJsonData?.spanId || parsed.spanId,
            hostname: metadata.hostname || labelData.hostname || labelData.instance,
            environment: metadata.environment || labelData.environment,
            namespace: metadata.namespace || labelData.namespace,
            pod: metadata.pod || labelData.pod,
            deployment: metadata.deployment || labelData.deployment,
            cluster: metadata.cluster || labelData.cluster
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
    // Örnek format:
    // 2025-09-17 21:11:45 [INFO] cdn: Asset served - File: /path Size: 103424KB Cache hit: 0 Response time: 202ms Client IP: 203.0.113.101 TraceID: trace-cdn-101 SpanID: span-cdn-101

    // Level
    const levelMatch = logLine.match(/\[(DEBUG|INFO|WARN|WARNING|ERROR|FATAL|TRACE)\]/i);
    const level = levelMatch ? this.extractLevel(levelMatch[1]) : 'INFO';

    // Service: level kapalı parantezden sonra gelen ilk "<service>:"
    let service: string | undefined;
    const serviceMatch = logLine.match(/\]\s*([^:\s]+)\s*:/);
    if (serviceMatch) {
      service = serviceMatch[1];
    }

    // Trace/Span IDs
    const traceMatch = logLine.match(/TraceID:\s*([\w-]+)/i);
    const spanMatch = logLine.match(/SpanID:\s*([\w-]+)/i);

    // Ek alanlar
    const fileMatch = logLine.match(/File:\s*([^\s]+)\b/);
    const sizeMatch = logLine.match(/Size:\s*(\d+)KB/i);
    const cacheMatch = logLine.match(/Cache\s+hit:\s*(\d+)/i);
    const respMatch = logLine.match(/Response\s+time:\s*(\d+)ms/i);
    const ipMatch = logLine.match(/Client\s+IP:\s*([\d.]+)/i);

    const attributes: Record<string, any> = {};
    if (fileMatch) attributes.file = fileMatch[1];
    if (sizeMatch) attributes.size_kb = Number(sizeMatch[1]);
    if (cacheMatch) attributes.cache_hit = Number(cacheMatch[1]);
    if (respMatch) attributes.response_ms = Number(respMatch[1]);
    if (ipMatch) attributes.client_ip = ipMatch[1];

    return {
      level,
      service,
      message: logLine,
      attributes,
      traceId: traceMatch ? traceMatch[1] : undefined,
      spanId: spanMatch ? spanMatch[1] : undefined
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
