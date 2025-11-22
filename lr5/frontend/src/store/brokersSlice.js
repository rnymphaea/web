import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const API_URL = 'http://localhost:3001/brokers';

export const fetchBrokers = createAsyncThunk('brokers/fetchBrokers', async () => {
  const response = await fetch(API_URL);
  return response.json();
});

export const addBroker = createAsyncThunk('brokers/addBroker', async (broker) => {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(broker),
  });
  return response.json();
});

export const updateBroker = createAsyncThunk('brokers/updateBroker', async ({ id, ...broker }) => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(broker),
  });
  return response.json();
});

export const deleteBroker = createAsyncThunk('brokers/deleteBroker', async (id) => {
  await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
  return id;
});

const brokersSlice = createSlice({
  name: 'brokers',
  initialState: {
    items: [],
    status: 'idle',
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchBrokers.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchBrokers.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchBrokers.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(addBroker.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(updateBroker.fulfilled, (state, action) => {
        const index = state.items.findIndex(broker => broker.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(deleteBroker.fulfilled, (state, action) => {
        state.items = state.items.filter(broker => broker.id !== action.payload);
      });
  },
});

export default brokersSlice.reducer;
