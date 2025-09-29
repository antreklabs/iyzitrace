export interface BaseProps {
  id?: string | null;
  start?: number;
  end?: number;
}

// Runtime defaults helper
export const createDefaultBaseProps = (): BaseProps => ({
  id: null,
  start: Date.now() - 15 * 60 * 1000,
  end: Date.now(),
});
