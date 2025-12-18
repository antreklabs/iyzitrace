import { getLabels, getLabelValues } from '../provider/prometheus.provider';
import { getDefinitions } from './query.service';

export class DropdownOption {
  key: string;
  value: string;
  name: string;

  constructor(key: string);
  constructor(key: string, value: string, name: string);
  constructor(key: string, value?: string, name?: string) {
    this.key = key;
    this.value = value ?? key;
    this.name = name ?? key;
  }
}

export const getPrometheusLabels = async (): Promise<DropdownOption[]> => {
  try {
    const response = await getLabels();
    
    return response.map((label: string) => new DropdownOption(label));
  } catch (error) {
    return [];
  }
};

export const getPrometheusLabelValues = async (labelName: string): Promise<DropdownOption[]> => {
  try {
    const response = await getLabelValues(labelName);
    
    return response.map((value: string) => new DropdownOption(`${labelName}-${value}`, value, value));
  } catch (error) {
    return [];
  }
};

export const getPrometheusServices = async (): Promise<DropdownOption[]> => {
  const definitions = await getDefinitions();
  return getPrometheusLabelValues(definitions.service_label_name);
};

export const getPrometheusOperations = async (): Promise<DropdownOption[]> => {
  const definitions = await getDefinitions();
  return getPrometheusLabelValues(definitions.span_label_name);
};

export const getPrometheusOperationTypes = async (): Promise<DropdownOption[]> => {
  const definitions = await getDefinitions();
  return getPrometheusLabelValues(definitions.type_label_name);
};

export const getPrometheusTraceStatuses = async (): Promise<DropdownOption[]> => {
  const definitions = await getDefinitions();
  return getPrometheusLabelValues(definitions.status_label_name);
};

export const getPrometheusExceptionTypes = async (): Promise<DropdownOption[]> => {
  const definitions = await getDefinitions();
  return getPrometheusLabelValues(definitions.exception_type_label_name);
};

export const getPrometheusRegions = async (): Promise<DropdownOption[]> => {
  const definitions = await getDefinitions();
  return getPrometheusLabelValues(definitions.region_label_name);
};

export const getPrometheusInfrastructures = async (): Promise<DropdownOption[]> => {
  const definitions = await getDefinitions();
  return getPrometheusLabelValues(definitions.infrastructure_label_name);
};