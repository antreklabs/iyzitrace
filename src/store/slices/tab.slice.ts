import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type Tab = {
  key: string;
  label: string;
  closable: boolean;
};

type TabsState = {
  tabs: Tab[];
  activeKey: string;
};

const initialState: TabsState = {
  tabs: [
    { key: '/a/antreklabs-iyzitrace-app/', label: 'Dashboard', closable: false }
  ],
  activeKey: '/a/antreklabs-iyzitrace-app/',
};

const tabsSlice = createSlice({
  name: 'tabs',
  initialState,
  reducers: {
    setActiveKey: (state, action: PayloadAction<string>) => {
      state.activeKey = action.payload;
    },
    addTab: (state, action: PayloadAction<Tab>) => {
      if (!state.tabs.find(t => t.key === action.payload.key)) {
        state.tabs.push(action.payload);
        state.activeKey = action.payload.key;
      }
    },
    removeTab: (state, action: PayloadAction<string>) => {
      state.tabs = state.tabs.filter(t => t.key !== action.payload);
      if (state.activeKey === action.payload && state.tabs.length > 0) {
        state.activeKey = state.tabs[state.tabs.length - 1].key;
      }
    },
    setTabs: (state, action: PayloadAction<Tab[]>) => {
      state.tabs = action.payload;
    }
  },
});

export const { addTab, removeTab, setActiveKey, setTabs } = tabsSlice.actions;
export default tabsSlice.reducer;