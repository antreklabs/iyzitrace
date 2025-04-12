import { combineReducers } from '@reduxjs/toolkit';
import tempoReducer from './slices/tempo.slice';

const rootReducer = combineReducers({
  tempo: tempoReducer,
  
});

export type RootState = ReturnType<typeof rootReducer>;
export default rootReducer;
