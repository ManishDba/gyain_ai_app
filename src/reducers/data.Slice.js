// src/reducers/exampleSlice.js
import { createSlice } from '@reduxjs/toolkit';

const dataSlice = createSlice({
  name: 'data',
  initialState: {
    data: [],
    selectedDocIds: [],
    dataApi:[],
  },
  reducers: {
    setData: (state, action) => {
      state.data = action.payload;
    },
    setSelectedDocId: (state, action) => {
      state.selectedDocIds = action.payload;
    },
    setDataApi: (state, action) => {
      state.dataApi = action.payload;
    },
    
  },
});

export const { setData, setSelectedDocId,setDataApi } = dataSlice.actions;
export default dataSlice.reducer;
