import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const API_URL = 'http://localhost:3001/simulation';

export const fetchSettings = createAsyncThunk('simulation/fetchSettings', async () => {
  const response = await fetch(`${API_URL}/settings`);
  return response.json();
});

export const updateSettings = createAsyncThunk('simulation/updateSettings', async (settings) => {
  const response = await fetch(`${API_URL}/settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
  return response.json();
});

export const startSimulation = createAsyncThunk('simulation/startSimulation', async () => {
  const response = await fetch(`${API_URL}/start`, { method: 'POST' });
  return response.json();
});

export const stopSimulation = createAsyncThunk('simulation/stopSimulation', async () => {
  const response = await fetch(`${API_URL}/stop`, { method: 'POST' });
  return response.json();
});

const simulationSlice = createSlice({
  name: 'simulation',
  initialState: {
    settings: {},
    currentStocks: [],
    status: 'idle',
    error: null,
  },
  reducers: {
    setCurrentStocks: (state, action) => {
      state.currentStocks = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSettings.fulfilled, (state, action) => {
        state.settings = action.payload;
      })
      .addCase(updateSettings.fulfilled, (state, action) => {
        state.settings = action.payload;
      });
  },
});

export const { setCurrentStocks } = simulationSlice.actions;
export default simulationSlice.reducer;
