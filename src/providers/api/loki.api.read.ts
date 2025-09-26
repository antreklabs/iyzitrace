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

// Kendi log parser wrapper'ımızı kullan (Grafana bağımlılığını azaltır)
import { logParser } from '../../utils/log-parser.wrapper';

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
      
      // Güvenli varsayılan tarih aralığı (son 1 saat)
      const fallbackTo = dateTime();
      const fallbackFrom = dateTime().subtract(1, 'hour');

      // Datasource ref (Grafana'nın query motoru için kritik)
      const dsRef = typeof lokiDs?.getRef === 'function'
        ? lokiDs.getRef()
        : { uid: lokiDs?.uid ?? 'loki', type: lokiDs?.type ?? 'loki' };

      // Grafana'nın LokiQuery formatında query oluştur
      const lokiQuery: LokiQuery = {
        refId: 'A',
        expr: params.query,
        queryType: LokiQueryType.Range,
        maxLines: params.limit || 100,
        // @ts-expect-error: datasource field runtime'da mevcut; tipler her versiyonda olmayabiliyor
        datasource: dsRef,
      };

      // TimeRange oluştur
      const fromDt = params.start ? dateTime(params.start) : fallbackFrom;
      const toDt = params.end ? dateTime(params.end) : fallbackTo;

      const timeRange: TimeRange = {
        from: fromDt,
        to: toDt,
        // raw alanını DateTime objeleri ile ver (Grafana beklenen format)
        raw: { from: fromDt, to: toDt },
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
        app: CoreApp.Explore,
        maxDataPoints: 1000,
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
              
              // Log line'ını direkt wrapper ile parse et
              const parsed = logParser.parseLogLine(logLine);
              
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
                // Level: JSON -> parsed -> labels (wrapper handles standardization)
                level: (rawJsonData?.level
                  ? logParser.extractLevel(rawJsonData.level)
                  : parsed.level) || logParser.extractLevel(labels.level) as LogEntry['level'],
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
}

export const lokiReadApi = new LokiReadApi();