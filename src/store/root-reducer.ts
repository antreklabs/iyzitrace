import { combineReducers } from '@reduxjs/toolkit';
import prometheusReducer from './slices/prometheus.slice';
import tabReducer from './slices/tab.slice';
import datasourceReducer from './slices/datasource.slice';

const rootReducer = combineReducers({
  prometheus: prometheusReducer,
  tabSlice: tabReducer,
  datasource: datasourceReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
export default rootReducer;