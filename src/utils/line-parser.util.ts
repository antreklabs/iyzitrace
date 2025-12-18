export function isLogLineJSON(line: string): boolean {
    let parsed;
    try {
      parsed = JSON.parse(line);
    } catch (error) {}
    return typeof parsed === 'object';
  }
  
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

export function parseLogfmtKeyValues(line: string): Record<string, string> {
  const attributes: Record<string, string> = {};
  const LOGFMT_REGEXP = /(?:^|\s)([\w\(\)\[\]\{\}]+)=(""|(?:".*?[^\\]"|[^"\s]\S*))/g;
  
  let match;
  while ((match = LOGFMT_REGEXP.exec(line)) !== null) {
    const key = match[1];
    let value = match[2];
    
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    
    attributes[key] = value;
  }
  
  return attributes;
}