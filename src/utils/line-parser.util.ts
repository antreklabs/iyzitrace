export function isLogLineJSON(line: string): boolean {
    let parsed;
    try {
      parsed = JSON.parse(line);
    } catch (error) {}
    // The JSON parser should only be used for log lines that are valid serialized JSON objects.
    return typeof parsed === 'object';
  }
  
  // This matches:
  // first a label from start of the string or first white space, then any word chars until "="
  // second either an empty quotes, or anything that starts with quote and ends with unescaped quote,
  // or any non whitespace chars that do not start with quote
  const LOGFMT_REGEXP = /(?:^|\s)([\w\(\)\[\]\{\}]+)=(""|(?:".*?[^\\]"|[^"\s]\S*))/;
  
  export function isLogLineLogfmt(line: string): boolean {
    return LOGFMT_REGEXP.test(line);
  }
  
export function isLogLinePacked(line: string): boolean {
  let parsed;
  try {
    parsed = JSON.parse(line);
    return parsed.hasOwnProperty('_entry');
  } catch (error) {
    return false;
  }
}

/**
 * Parses logfmt formatted strings into key-value pairs
 * Example: "level=info service=api message=\"User logged in\" trace_id=abc123"
 * Returns: { level: "info", service: "api", message: "User logged in", trace_id: "abc123" }
 * 
 * COPIED FROM GRAFANA LOKI PLUGIN v11.5.2
 * Source: /public/app/plugins/datasource/loki/lineParser.ts
 * Last synced: 2024-12-15
 * 
 * TODO: Check for updates when upgrading Grafana
 */
export function parseLogfmtKeyValues(line: string): Record<string, string> {
  const attributes: Record<string, string> = {};
  const LOGFMT_REGEXP = /(?:^|\s)([\w\(\)\[\]\{\}]+)=(""|(?:".*?[^\\]"|[^"\s]\S*))/g;
  
  let match;
  while ((match = LOGFMT_REGEXP.exec(line)) !== null) {
    const key = match[1];
    let value = match[2];
    
    // Remove quotes from quoted values
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    
    attributes[key] = value;
  }
  
  return attributes;
}
  