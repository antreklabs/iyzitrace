export interface TempoRequestModel {
  start?: number;
  end?: number;
  interval?: string;
  intervalMs?: number;
  timezone?: string;
  queryType?: string; 
  query?: string;
  limit?: number;
}