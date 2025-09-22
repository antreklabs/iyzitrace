import { LogEntry, LogSearchResult } from '../../interfaces/logs.interface';
import { 
  LokiQueryParams, 
  LokiQuery, 
  LokiQueryType 
} from '../../interfaces/loki';
import { getDataSourceSrv } from '@grafana/runtime';
import { 
  DataQueryRequest, 
  TimeRange, 
  CoreApp, 
  dateTime
} from '@grafana/data';
import { lastValueFrom } from 'rxjs';

// Grafana Loki plugin'indeki line parser utilities
import { 
  isLogLineJSON, 
  isLogLineLogfmt,
  parseLogfmtKeyValues
} from '../../plugins/datasource/loki/lineParser';

class LokiReadApi {
  private async getLokiDatasourceInstance(): Promise<any> {
    try {
      const ds = await getDataSourceSrv().get('loki');
      if (!ds) {
        throw new Error('Loki datasource instance not found');
      }
      return ds;
    } catch (error) {
      throw new Error('Loki datasource instance not available. Please check datasource configuration.');
    }
  }

  /**
   * Loki'den log verilerini çeker - Grafana datasource instance kullanarak
   */
  async queryLogs(params: LokiQueryParams): Promise<LogSearchResult> {
    try {
      const lokiDs = await this.getLokiDatasourceInstance();
      
      // Grafana'nın LokiQuery formatında query oluştur
      const lokiQuery: LokiQuery = {
        refId: 'A',
        expr: params.query,
        queryType: LokiQueryType.Range,
        maxLines: params.limit || 100
      };

      // TimeRange oluştur
      const timeRange: TimeRange = {
        from: dateTime(params.start),
        to: dateTime(params.end),
        raw: {
          from: params.start,
          to: params.end
        }
      };

      // DataQueryRequest oluştur
      const request: DataQueryRequest<LokiQuery> = {
        targets: [lokiQuery],
        range: timeRange,
        requestId: `loki-query-${Date.now()}`,
        interval: '1s',
        intervalMs: 1000,
        scopedVars: {},
        timezone: 'UTC',
        app: CoreApp.Unknown,
        startTime: Date.now()
      };

      // Grafana'nın datasource query metodunu kullan
      const response = await lastValueFrom(lokiDs.query(request));
      
      return this.transformGrafanaResponse(response, params.orderBy, params.orderDirection);
    } catch (error) {
      console.error('Loki query error:', error);
      throw error;
    }
  }

  /**
   * Grafana DataQueryResponse'unu LogEntry formatına dönüştürür
   */
  private transformGrafanaResponse(response: any, orderBy?: string, orderDirection?: 'asc' | 'desc'): LogSearchResult {
    const logs: LogEntry[] = [];
    
    if (response.data && Array.isArray(response.data)) {
      response.data.forEach((frame: any) => {
        if (frame.fields) {
          // DataFrame formatından logları çıkar
          const timeField = frame.fields.find((f: any) => f.name === 'Time' || f.name === 'timestamp');
          const lineField = frame.fields.find((f: any) => f.name === 'Line' || f.name === 'body' || f.name === 'message');
          const labelsField = frame.fields.find((f: any) => f.name === 'labels');
          
          if (timeField && lineField && timeField.values && lineField.values) {
            for (let i = 0; i < timeField.values.length; i++) {
              const timestamp = timeField.values[i];
              const logLine = lineField.values[i];
              const labels = labelsField ? labelsField.values[i] || {} : {};
              
              // Log line'ından level, service ve message'ı parse et
              const parsed = this.parseLogLine(logLine);
              
              // Service field'ını labels'dan al (service_name veya app fallback)
              const correctService = labels.service || labels.service_name || 'unknown';
              
              // Raw JSON'dan parse et
              let rawJsonData: any = null;
              try {
                rawJsonData = JSON.parse(logLine);
              } catch {
                // JSON değilse, text log olarak işle
              }

              // Attributes: Raw JSON'dan attributes alanını al, yoksa labels kullan
              let attributes: Record<string, any> = { ...labels };
              if (rawJsonData && rawJsonData.attributes) {
                attributes = { ...attributes, ...rawJsonData.attributes };
              } else if (parsed && parsed.attributes) {
                attributes = { ...attributes, ...parsed.attributes };
              }

              // Metadata: Raw JSON'dan root level alanları al
              let metadata: Record<string, any> = {};
              if (rawJsonData) {
                Object.keys(rawJsonData).forEach(key => {
                  if (key !== 'attributes' && key !== 'id' && key !== 'timestamp' && key !== 'level' && key !== 'service' && key !== 'message') {
                    metadata[key] = rawJsonData[key];
                  }
                });
              }

              logs.push({
                id: `grafana-${timestamp}-${i}`,
                timestamp: new Date(timestamp).toISOString(),
                // Level: JSON -> parsed -> labels
                level: (rawJsonData?.level
                  ? this.extractLevel(rawJsonData.level)
                  : parsed.level) || this.extractLevel(labels.level),
                service: rawJsonData?.service || rawJsonData?.service_name || correctService,
                message: rawJsonData?.message || parsed.message || logLine,
                attributes: attributes,
                traceId: rawJsonData?.traceId || parsed.traceId,
                spanId: rawJsonData?.spanId || parsed.spanId,
                hostname: metadata.hostname || labels.hostname || labels.instance,
                environment: metadata.environment || labels.environment,
                namespace: metadata.namespace || labels.namespace,
                pod: metadata.pod || labels.pod,
                deployment: metadata.deployment || labels.deployment,
                cluster: metadata.cluster || labels.cluster
              });
            }
          }
        }
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
   * Grafana Loki plugin'indeki line parser utilities kullanarak
   */
  private parseLogLine(logLine: string): {
    level: LogEntry['level'];
    service?: string;
    message: string;
    attributes: Record<string, any>;
    traceId?: string;
    spanId?: string;
  } {
    // Grafana plugin'indeki isLogLineJSON utility'sini kullan
    if (isLogLineJSON(logLine)) {
      try {
        const jsonLog = JSON.parse(logLine);
        return {
          level: this.extractLevel(jsonLog.level),
          service: jsonLog.service || jsonLog.service_name,
          message: jsonLog.message || jsonLog.msg || logLine,
          attributes: jsonLog,
          traceId: jsonLog.trace_id || jsonLog.traceId,
          spanId: jsonLog.span_id || jsonLog.spanId
        };
      } catch {
        // JSON parse hatası durumunda text parsing'e düş
        return this.parseTextLog(logLine);
      }
    }
    
    // Grafana plugin'indeki isLogLineLogfmt utility'sini kullan
    if (isLogLineLogfmt(logLine)) {
      return this.parseLogfmtLog(logLine);
    }
    
    // Diğer durumlarda text formatında parse et
    return this.parseTextLog(logLine);
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
    const level = this.extractLevel(levelMatch[1]);

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
   * Logfmt formatındaki log'u parse eder - Grafana lineParser utility'sini kullanarak
   * Örnek: level=info service=api message="User logged in" trace_id=abc123
   */
  private parseLogfmtLog(logLine: string): {
    level: LogEntry['level'];
    service?: string;
    message: string;
    attributes: Record<string, any>;
    traceId?: string;
    spanId?: string;
  } {
    // Grafana lineParser'dan gelen parseLogfmtKeyValues utility'sini kullan
    const attributes = parseLogfmtKeyValues(logLine);

    return {
      level: this.extractLevel(attributes.level),
      service: attributes.service || attributes.service_name,
      message: attributes.message || attributes.msg || logLine,
      attributes,
      traceId: attributes.trace_id || attributes.traceId,
      spanId: attributes.span_id || attributes.spanId
    };
  }
}

export const lokiReadApi = new LokiReadApi();