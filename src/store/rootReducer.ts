import { combineReducers } from '@reduxjs/toolkit';
import tempoReducer from './slices/tempo.slice';
import tabReducer from './slices/tab.slice';

const rootReducer = combineReducers({
  tempo: tempoReducer,
  tabSlice: tabReducer,
  
});

export type RootState = ReturnType<typeof rootReducer>;
export default rootReducer;
