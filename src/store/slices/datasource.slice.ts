import { DataSourceStoreState } from '../../interfaces/store/store.interface';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

const initialState: DataSourceStoreState = {
  uids: [],
  selectedUid: null,
};

const datasourceSlice = createSlice({
  name: 'datasource',
  initialState,
  reducers: {
    setDataSourceUids(state, action: PayloadAction<string[]>) {
      state.uids = action.payload;
      if (!state.selectedUid && action.payload.length > 0) {
        state.selectedUid = action.payload[0];
      }
    },
    setSelectedDataSourceUid(state, action: PayloadAction<string>) {
      state.selectedUid = action.payload;
    },
  },
});

export const { setDataSourceUids, setSelectedDataSourceUid } = datasourceSlice.actions;
export default datasourceSlice.reducer;