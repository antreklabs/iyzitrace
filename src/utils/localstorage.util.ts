const STORAGE_KEY = 'selectedTempoUid';

export const saveTempoUidToLocal = (uid: string) => {
  localStorage.setItem(STORAGE_KEY, uid);
};

export const getTempoUidFromLocal = (): string | null => {
  return localStorage.getItem(STORAGE_KEY);
};
