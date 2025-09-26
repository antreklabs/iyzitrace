import { getBackendSrv, getDataSourceSrv } from '@grafana/runtime';
import { LogPipeline } from '../../interfaces/pipeline.interface';
import { LokiWriteOptions, LokiWriteResult } from '../../interfaces/loki';

class LokiWriteApi {
  private async getLokiUid(): Promise<string> {
    try {
      const ds = await getDataSourceSrv().getInstanceSettings('loki');
      if (!ds?.uid) {
        throw new Error('Loki datasource not found');
      }
      return ds.uid;
    } catch (error) {
      // Sessizce üst katmana bildir; fallback mekanizması devreye girecek
      throw new Error('Loki datasource not configured');
    }
  }

  /**
   * Log verilerini Loki'ye yazar
   */
  async writeLogs(logs: any[], options?: LokiWriteOptions): Promise<LokiWriteResult> {
    try {
      // 1) Prefer Grafana datasource proxy if configured
      const uid = await this.getLokiUid().catch((): null => null);
      const grafanaProxyUrl = uid ? `/api/datasources/proxy/uid/${uid}/loki/api/v1/push` : null;

      // 2) Fallback to direct Loki connection
      const fallbackUrl = 'http://localhost:3100/loki/api/v1/push';

      // Logları etiketlere göre grupla ve her grup için ayrı stream gönder (Loki label semantiği)
      const groups: Record<string, { labels: Record<string, string>; entries: any[] }> = {};
      for (const log of logs) {
        const service = (log.service || log.attributes?.service || 'unknown').toString();
        const environment = (log.environment || log.attributes?.environment || 'unknown').toString();
        const level = (log.level || 'INFO').toString();
        const key = `${service}|${environment}|${level}`;
        if (!groups[key]) {
          groups[key] = {
            labels: {
              job: 'test-app', // Default job label
              service,
              environment,
              level,
              service_name: log.attributes?.service_name || service,
              version: log.attributes?.version || '1.0.0',
              ...options?.labels
            },
            entries: []
          };
        }
        groups[key].entries.push(log);
      }

      // Stream payloadlarını batch'leyerek gönder
      const streams = Object.values(groups).map(g => ({
        stream: g.labels,
        values: g.entries.map(log => {
          // Orijinal timestamp'i kullan ama biraz güncelle (override için)
          const originalTime = new Date(log.timestamp).getTime();
          const ns = String((originalTime + 1) * 1000000); // 1ms ekle
          const line = typeof log === 'string' ? log : JSON.stringify(log);
          return [ns, line];
        })
      }));

      const batches = this.createLogBatches(streams, 50); // stream bazlı batch

      for (const streamBatch of batches) {
        const payload = { streams: streamBatch };
        console.log('Sending payload to Loki:', JSON.stringify(payload, null, 2));
        console.log('Payload streams count:', payload.streams.length);
        console.log('First stream labels:', payload.streams[0]?.stream);
        console.log('First stream values count:', payload.streams[0]?.values?.length);

        if (grafanaProxyUrl) {
          await getBackendSrv().post(grafanaProxyUrl, payload);
          continue;
        }

        // Try fallback
        try {
          const res = await fetch(fallbackUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            mode: 'cors'
          });
          if (!res.ok) {
            const text = await res.text().catch(() => '');
            throw new Error(`HTTP ${res.status}: ${text}`);
          }
        } catch (error) {
          console.error('Failed to write to Loki via direct connection:', error);
          throw error;
        }
      }

      return {
        success: true,
        message: `Successfully wrote ${logs.length} logs to Loki`
      };

    } catch (error: any) {
      console.error('Loki write error:', error);
      return {
        success: false,
        error: error.message || 'Unknown error occurred'
      };
    }
  }

  /**
   * Pipeline'dan işlenmiş logları Loki'ye yazar
   */
  async writeProcessedLogsToLoki(logs: any[], pipeline: LogPipeline): Promise<void> {
    // 1) Prefer Grafana datasource proxy if configured
    const uid = await this.getLokiUid().catch((): null => null);
    const grafanaProxyUrl = uid ? `/api/datasources/proxy/uid/${uid}/loki/api/v1/push` : null;

    // 2) Fallback to direct Loki connection
    const fallbackUrl = 'http://localhost:3100/loki/api/v1/push';

    // Logları etiketlere göre grupla ve her grup için ayrı stream gönder (Loki label semantiği)
    const groups: Record<string, { labels: Record<string, string>; entries: any[] }> = {};
    for (const log of logs) {
      const service = (log.service || log.attributes?.service || 'unknown').toString();
      const environment = (log.environment || log.attributes?.environment || 'unknown').toString();
      const level = (log.level || 'INFO').toString();
      const key = `${service}|${environment}|${level}`;
      if (!groups[key]) {
        groups[key] = {
          labels: {
            // Orijinal loglarla TAMAMEN aynı etiketleri kullan, sadece level'ı değiştir
            job: 'test-app', // Orijinal job etiketi
            service,
            environment,
            level, // Bu değişecek (FATAL -> DEBUG)
            service_name: log.attributes?.service_name || service,
            version: log.attributes?.version || '1.0.0',
            // Pipeline'ın işlediği logları belirtmek için özel etiket
            processed_by_pipeline: 'true',
            pipeline_id: pipeline.id,
            processed_at: new Date().toISOString(),
            ...pipeline.output.config.labels
          },
          entries: []
        };
      }
      groups[key].entries.push(log);
    }

    // Stream payloadlarını batch'leyerek gönder
    const streams = Object.values(groups).map(g => ({
      stream: g.labels,
      values: g.entries.map(log => {
        // Orijinal timestamp'i kullan ama biraz güncelle (override için)
        const originalTime = new Date(log.timestamp).getTime();
        const ns = String((originalTime + 1) * 1000000); // 1ms ekle
        const line = typeof log === 'string' ? log : JSON.stringify(log);
        return [ns, line];
      })
    }));

    const batches = this.createLogBatches(streams, 50); // stream bazlı batch

    for (const streamBatch of batches) {
      const payload = { streams: streamBatch };
      console.log('Sending payload to Loki:', JSON.stringify(payload, null, 2));
      console.log('Payload streams count:', payload.streams.length);
      console.log('First stream labels:', payload.streams[0]?.stream);
      console.log('First stream values count:', payload.streams[0]?.values?.length);

      if (grafanaProxyUrl) {
        await getBackendSrv().post(grafanaProxyUrl, payload);
        continue;
      }

      // Try fallback
      try {
        const res = await fetch(fallbackUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          mode: 'cors'
        });
        if (!res.ok) {
          const text = await res.text().catch(() => '');
          throw new Error(`HTTP ${res.status}: ${text}`);
        }
      } catch (error) {
        console.error('Failed to write to Loki via direct connection:', error);
        throw error;
      }
    }
  }

  /**
   * Log batch'lerini oluşturur
   */
  createLogBatches(logs: any[], batchSize: number): any[][] {
    const batches = [];
    for (let i = 0; i < logs.length; i += batchSize) {
      batches.push(logs.slice(i, i + batchSize));
    }
    return batches;
  }

  
}

export const lokiWriteApi = new LokiWriteApi();
