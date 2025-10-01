// Page state keys
const PAGE_STATE_PREFIX = 'pageState';

export interface PageState {
  selectedDataSourceUid?: string;
  range?: [number, number];
  filters?: any;
  pageSize?: number;
}

// Save page state to localStorage
export const savePageState = (pageName: string, state: PageState) => {
  const key = `${PAGE_STATE_PREFIX}_${pageName}`;
  localStorage.setItem(key, JSON.stringify(state));
};

// Get page state from localStorage
export const getPageState = (pageName: string): PageState | null => {
  const key = `${PAGE_STATE_PREFIX}_${pageName}`;
  const state = localStorage.getItem(key);
  if (!state) return null;
  try {
    return JSON.parse(state);
  } catch (e) {
    console.error('Error parsing page state:', e);
    return null;
  }
};

// Update specific fields in page state
export const updatePageState = (pageName: string, updates: Partial<PageState>) => {
  const currentState = getPageState(pageName) || {};
  const newState = { ...currentState, ...updates };
  savePageState(pageName, newState);
};

// Get default page state
export const getDefaultPageState = (): PageState => ({
  range: [Date.now() - 15 * 60 * 1000, Date.now()], // 15 minutes ago to now
  filters: {},
  pageSize: 10,
});
