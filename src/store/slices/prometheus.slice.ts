import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface PrometheusStoreState {
    selectedPrometheusUid: string | null;
}

const initialState: PrometheusStoreState = {
    selectedPrometheusUid: null,
}

const prometheusSlice = createSlice({
    name: 'prometheus',
    initialState,
    reducers: {
        setSelectedPrometheusUid(state, action: PayloadAction<string>) {
            state.selectedPrometheusUid = action.payload;
        },
    },
});

export const { setSelectedPrometheusUid } = prometheusSlice.actions;
export default prometheusSlice.reducer;
