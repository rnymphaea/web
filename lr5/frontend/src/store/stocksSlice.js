import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const API_URL = 'http://localhost:3001/stocks';

export const fetchStocks = createAsyncThunk('stocks/fetchStocks', async () => {
  const response = await fetch(API_URL);
  return response.json();
});

export const updateStock = createAsyncThunk('stocks/updateStock', async ({ id, ...stock }) => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(stock),
  });
  return response.json();
});

const stocksSlice = createSlice({
  name: 'stocks',
  initialState: {
    items: [],
    status: 'idle',
    error: null,
  },
  reducers: {
    updateStockPrice: (state, action) => {
      const { id, currentPrice } = action.payload;
      const stock = state.items.find(stock => stock.id === id);
      if (stock) {
        stock.currentPrice = currentPrice;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStocks.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchStocks.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchStocks.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(updateStock.fulfilled, (state, action) => {
        const index = state.items.findIndex(stock => stock.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      });
  },
});

export const { updateStockPrice } = stocksSlice.actions;
export default stocksSlice.reducer;
