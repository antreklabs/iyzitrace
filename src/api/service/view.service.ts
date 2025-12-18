import { getPluginSettings } from './settings.service';

let cachedSelectedData: any | null = null;

export const getSelectedViewData = async (pageName: string): Promise<any | null> => {
  if (cachedSelectedData) return cachedSelectedData;
  try {
    let viewId: string | undefined;
    try {
      const raw = localStorage.getItem(`lastSelectedPageView_${pageName}`);
      if (raw) {
        const obj = JSON.parse(raw);
        if (obj?.pageName) pageName = obj.pageName;
        viewId = obj?.viewId;
      }
    } catch {}

    try {
      const settings: any = await getPluginSettings();
      const pageViews = settings.pageViews || [];
      const match = pageViews.find((v: any) => v.page === pageName && (!viewId || v.id === viewId));
      if (match?.data) {
        cachedSelectedData = match.data;
        return cachedSelectedData;
      }
    } catch {}

    try {
      const local = JSON.parse(localStorage.getItem(`iyzitrace-views-${pageName}`) || '[]');
      const match = (local || []).find((v: any) => (!viewId || v.id === viewId));
      if (match?.data) {
        cachedSelectedData = match.data;
        return cachedSelectedData;
      }
    } catch {}
  } catch {}
  return null;
};