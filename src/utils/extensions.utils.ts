/**
 * Converts milliseconds to a human-readable interval label
 * @param intervalMs - Interval in milliseconds
 * @returns Formatted interval string (e.g., "1d", "2h", "30m", "5s", "500ms")
 */
export const getIntervalLabel = (intervalMs: number): string => {
  if (!intervalMs) return '1s';
  
  if (intervalMs >= 86400000) { // 24 hours
    return `${intervalMs / 86400000}d`;
  }
  if (intervalMs >= 3600000) { // 1 hour
    return `${intervalMs / 3600000}h`;
  }
  if (intervalMs >= 60000) { // 1 minute
    return `${intervalMs / 60000}m`;
  }
  if (intervalMs >= 1000) { // 1 second
    return `${intervalMs / 1000}s`;
  }
  return `${intervalMs}ms`;
};