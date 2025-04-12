import { TempoStoreState } from '@/interfaces';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
const initialState: TempoStoreState = {
    tempoUids: [],
    selectedTempoUid: null,
    selectedPrometheusUid: null,
}

const tempoSlice = createSlice({
    name: 'tempo',
    initialState,
    reducers: {
        setTempoUids(state, action: PayloadAction<string[]>) {
            state.tempoUids = action.payload;
            if (!state.selectedTempoUid && action.payload.length > 0) {
                state.selectedTempoUid = action.payload[0];
            }
        },
        setSelectedTempoUid(state, action: PayloadAction<string>) {
            state.selectedTempoUid = action.payload;
        },
        setSelectedPrometheusUid(state, action: PayloadAction<string>) {
            state.selectedPrometheusUid = action.payload;
        },
    },
});

export const { setTempoUids, setSelectedTempoUid,setSelectedPrometheusUid } = tempoSlice.actions;
export default tempoSlice.reducer;
