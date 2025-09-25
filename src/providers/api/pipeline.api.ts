import { getDataSourceSrv } from '@grafana/runtime';
import { LogPipeline, PipelineExecution, PipelineFilter, PipelineProcessor } from '../../interfaces/pipeline.interface';
import { lokiWriteApi } from './loki.api.write';

export const pipelineApi = {
  // Pipeline CRUD operations
  async getPipelines(): Promise<LogPipeline[]> {
    const pipelines = localStorage.getItem('logPipelines');
    return pipelines ? JSON.parse(pipelines) : [];
  },

  async createPipeline(pipeline: Omit<LogPipeline, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<LogPipeline> {
    const pipelines = await this.getPipelines();
    const newPipeline: LogPipeline = {
      ...pipeline,
      id: `pipeline_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1
    };
    
    pipelines.push(newPipeline);
    localStorage.setItem('logPipelines', JSON.stringify(pipelines));
    return newPipeline;
  },

  async updatePipeline(id: string, updates: Partial<LogPipeline>): Promise<LogPipeline> {
    const pipelines = await this.getPipelines();
    const index = pipelines.findIndex(p => p.id === id);
    
    if (index === -1) {
      throw new Error('Pipeline not found');
    }
    
    pipelines[index] = {
      ...pipelines[index],
      ...updates,
      updatedAt: new Date().toISOString(),
      version: pipelines[index].version + 1
    };
    
    localStorage.setItem('logPipelines', JSON.stringify(pipelines));
    return pipelines[index];
  },

  async deletePipeline(id: string): Promise<void> {
    const pipelines = await this.getPipelines();
    const filtered = pipelines.filter(p => p.id !== id);
    localStorage.setItem('logPipelines', JSON.stringify(filtered));
  },

  async getPipeline(id: string): Promise<LogPipeline> {
    const pipelines = await this.getPipelines();
    const pipeline = pipelines.find(p => p.id === id);
    if (!pipeline) {
      throw new Error('Pipeline not found');
    }
    return pipeline;
  },

  // Pipeline execution
  async executePipeline(pipelineId: string, logs: any[]): Promise<PipelineExecution> {
    const pipeline = await this.getPipeline(pipelineId);
    
    const execution: PipelineExecution = {
      id: `exec_${Date.now()}`,
      pipelineId,
      status: 'running',
      startTime: new Date().toISOString(),
      processedLogs: 0,
      errors: 0
    };

    try {
      let processedLogs = [...logs];
      console.log(`Pipeline ${pipeline.name} executing on ${logs.length} logs`);
      
      // Filtreleri uygula
      for (const filter of pipeline.filters) {
        if (filter.enabled) {
          console.log(`Applying filter: ${filter.field} ${filter.operator} ${filter.value}`);
          processedLogs = this.applyFilter(processedLogs, filter);
          console.log(`After filter: ${processedLogs.length} logs remaining`);
        }
      }
      
      // Processor'ları uygula
      for (const processor of pipeline.processors.sort((a, b) => a.order - b.order)) {
        if (processor.enabled) {
          console.log(`Applying processor: ${processor.type}`, processor.config);
          processedLogs = this.applyProcessor(processedLogs, processor);
          console.log(`After processor: ${processedLogs.length} logs processed`);
        }
      }
      
      // İşlenmiş logları Loki'ye yaz
      console.log(`Writing ${processedLogs.length} processed logs to Loki`);
      console.log('Sample processed log:', processedLogs[0]);
      await lokiWriteApi.writeProcessedLogsToLoki(processedLogs, pipeline);
      
      execution.status = 'completed';
      execution.endTime = new Date().toISOString();
      execution.processedLogs = processedLogs.length;
      console.log(`Pipeline execution completed successfully`);
      
    } catch (error: any) {
      console.error('Pipeline execution error:', error);
      execution.status = 'failed';
      execution.endTime = new Date().toISOString();
      execution.errors = 1;
      execution.errorMessage = error.message;
    }
    
    return execution;
  },


  createLogBatches(logs: any[], batchSize: number): any[][] {
    const batches = [];
    for (let i = 0; i < logs.length; i += batchSize) {
      batches.push(logs.slice(i, i + batchSize));
    }
    return batches;
  },

  async getLokiUid(): Promise<string> {
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
  },

  applyFilter(logs: any[], filter: PipelineFilter): any[] {
    return logs.filter(log => {
      const value = this.getFieldValue(log, filter.field);
      
      switch (filter.operator) {
        case 'equals':
          return value === filter.value;
        case 'contains':
          return value && value.toString().includes(filter.value);
        case 'regex':
          return value && new RegExp(filter.value).test(value.toString());
        case 'exists':
          return value !== undefined && value !== null;
        case 'not_exists':
          return value === undefined || value === null;
        default:
          return true;
      }
    });
  },

  applyProcessor(logs: any[], processor: PipelineProcessor): any[] {
    return logs.map(log => {
      try {
        switch (processor.type) {
          case 'parse_attributes':
            return this.parseAttributes(log, processor.config);
          case 'parse_json':
            return this.parseJson(log, processor.config);
          case 'remove_field':
            return this.removeField(log, processor.config);
          case 'add_field':
            return this.addField(log, processor.config);
          case 'transform':
            return this.transformLog(log, processor.config);
          default:
            return log;
        }
      } catch (error) {
        console.error('Processor error:', error);
        return log;
      }
    });
  },

  parseAttributes(log: any, config: any): any {
    const { field, pattern } = config;
    const text = this.getFieldValue(log, field);
    
    if (!text) return log;
    
    const regex = new RegExp(pattern);
    const matches = text.match(regex);
    
    if (matches) {
      const attributes = { ...log.attributes };
      matches.forEach((match: string, index: number) => {
        if (index > 0) {
          attributes[`attr_${index}`] = match;
        }
      });
      return { ...log, attributes };
    }
    
    return log;
  },

  parseJson(log: any, config: any): any {
    const { field, targetField } = config;
    const text = this.getFieldValue(log, field);
    
    if (!text) return log;
    
    try {
      const parsed = JSON.parse(text);
      return {
        ...log,
        [targetField || 'parsed']: parsed
      };
    } catch (error) {
      return log;
    }
  },

  removeField(log: any, config: any): any {
    const { field } = config;
    const newLog = { ...log };
    delete newLog[field];
    return newLog;
  },

  addField(log: any, config: any): any {
    const { field, value } = config;
    return {
      ...log,
      [field]: value
    };
  },

  transformLog(log: any, config: any): any {
    const { expression } = config;
    try {
      console.log('Transform expression:', expression);
      console.log('Input log:', log);
      const func = new Function('log', `return ${expression}`);
      const result = func(log);
      console.log('Transform result:', result);
      return result;
    } catch (error) {
      console.error('Transform error:', error);
      return log;
    }
  },

  getFieldValue(log: any, field: string): any {
    if (field.includes('.')) {
      return field.split('.').reduce((obj, key) => obj?.[key], log);
    }
    return log[field];
  }
};
