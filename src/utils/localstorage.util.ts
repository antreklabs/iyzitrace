const PAGE_STATE_PREFIX = 'pageState';

export interface PageState {
  selectedDataSourceUid?: string;
  range?: [number, number];
  filters?: any;
  pageSize?: number;
}

export const savePageState = (pageName: string, state: PageState) => {
  const key = `${PAGE_STATE_PREFIX}_${pageName}`;
  localStorage.setItem(key, JSON.stringify(state));
};

export const getPageState = (pageName: string): PageState | null => {
  const key = `${PAGE_STATE_PREFIX}_${pageName}`;
  const state = localStorage.getItem(key);
  if (!state) return null;
  try {
    return JSON.parse(state);
  } catch (e) {
    return null;
  }
};

export const updatePageState = (pageName: string, updates: Partial<PageState>) => {
  const currentState = getPageState(pageName) || {};
  const newState = { ...currentState, ...updates };
  savePageState(pageName, newState);
};

export const getDefaultPageState = (): PageState => ({
  range: [Date.now() - 15 * 60 * 1000, Date.now()],
  filters: {},
  pageSize: 10,
});