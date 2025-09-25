export interface LogPipeline {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  filters: PipelineFilter[];
  processors: PipelineProcessor[];
  output: PipelineOutput;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  version: number;
}

export interface PipelineFilter {
  id: string;
  type: 'label' | 'regex' | 'json' | 'timestamp';
  field: string;
  operator: 'equals' | 'contains' | 'regex' | 'exists' | 'not_exists';
  value: string;
  enabled: boolean;
}

export interface PipelineProcessor {
  id: string;
  type: 'parse_attributes' | 'parse_json' | 'remove_field' | 'add_field' | 'transform';
  config: Record<string, any>;
  enabled: boolean;
  order: number;
}

export interface PipelineOutput {
  type: 'loki';
  config: {
    stream?: string;
    labels?: Record<string, string>;
  };
}

export interface PipelineExecution {
  id: string;
  pipelineId: string;
  status: 'running' | 'completed' | 'failed';
  startTime: string;
  endTime?: string;
  processedLogs: number;
  errors: number;
  errorMessage?: string;
}
