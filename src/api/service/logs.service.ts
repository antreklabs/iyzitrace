import { FilterParamsModel } from "./query.service";
import { getQueryData } from "../provider/loki.provider";
import { LogItem } from "../../interfaces/pages/logs/logs.response.interface";
import { logParser } from "../../utils/log-parser.wrapper";

export const getLogsTableData = async (filterParamsModel: FilterParamsModel): Promise<any> => {
  let query = "{service_namespace=\"opentelemetry-demo\"} |= \"\"";
  if(filterParamsModel.service.name) {
    query = `{service_name="${filterParamsModel.service.name}"} |= \"\"`;
  }
  console.log('query', query);
  const data = await getQueryData(query, filterParamsModel.timeRange.from, filterParamsModel.timeRange.to, 
    parseInt(filterParamsModel.options.limit || '1000'), filterParamsModel.options.orderBy, 
    filterParamsModel.options.orderDirection as 'asc' | 'desc', 
    filterParamsModel.options.interval);
  return mapResponseModel(data);
};


const mapResponseModel = (response: any): LogItem[] => {
  const logs: LogItem[] = [];
  
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
                : parsed.level) || logParser.extractLevel(labels.level) as LogItem['level'],
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
  
  return logs
}