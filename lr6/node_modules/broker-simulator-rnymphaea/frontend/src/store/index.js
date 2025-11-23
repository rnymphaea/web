import { configureStore } from '@reduxjs/toolkit';
import brokersReducer from './brokersSlice';
import stocksReducer from './stocksSlice';
import simulationReducer from './simulationSlice';

export const store = configureStore({
  reducer: {
    brokers: brokersReducer,
    stocks: stocksReducer,
    simulation: simulationReducer,
  },
});
