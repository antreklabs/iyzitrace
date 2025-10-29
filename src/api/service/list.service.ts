// List Service - Dropdown data provider for labels and values
import { getLabels, getLabelValues } from '../provider/prometheus.provider';

export class DropdownOption {
  key: string;
  value: string;
  name: string;

  // Overload signatures
  constructor(key: string);
  constructor(key: string, value: string, name: string);
  // Single implementation
  constructor(key: string, value?: string, name?: string) {
    this.key = key;
    this.value = value ?? key;
    this.name = name ?? key;
  }
}

/**
 * Get available labels for dropdown selection
 * Returns labels from Prometheus API
 */
export const getPrometheusLabels = async (): Promise<DropdownOption[]> => {
  try {
    const response = await getLabels();
    
    return response.map((label: string) => new DropdownOption(label));
  } catch (error) {
    console.error('Error fetching labels from Prometheus:', error);
    // Fallback to empty array on error
    return [];
  }
};

/**
 * Get label values for a specific label
 * @param labelName - The name of the label to get values for
 * @returns Array of dropdown options with label values from Prometheus API
 */
export const getPrometheusLabelValues = async (labelName: string): Promise<DropdownOption[]> => {
  try {
    const response = await getLabelValues(labelName);
    
    return response.map((value: string) => new DropdownOption(`${labelName}-${value}`, value, value));
  } catch (error) {
    console.error(`Error fetching label values for ${labelName} from Prometheus:`, error);
    // Fallback to empty array on error
    return [];
  }
};

/**
 * Convenience: Fetch Prometheus services as DropdownOption[]
 */
export const getPrometheusServices = async (): Promise<DropdownOption[]> => {
  return getPrometheusLabelValues('service_name');
};

/**
 * Convenience: Fetch Prometheus services as DropdownOption[]
 */
export const getPrometheusOperations = async (): Promise<DropdownOption[]> => {
  return getPrometheusLabelValues('span_name');
};

/**
 * Convenience: Fetch operation types as DropdownOption[]
 */
export const getPrometheusOperationTypes = async (): Promise<DropdownOption[]> => {
  return getPrometheusLabelValues('type');
};

/**
 * Convenience: Fetch trace statuses as DropdownOption[]
 */
export const getPrometheusTraceStatuses = async (): Promise<DropdownOption[]> => {
  return getPrometheusLabelValues('status');
};

/**
 * Convenience: Fetch Loki levels as DropdownOption[]
 */
export const getPrometheusLokiLevels = async (): Promise<DropdownOption[]> => {
  return getPrometheusLabelValues('exception_type');
};
