// src/reducers/exampleSlice.js
import { createSlice } from '@reduxjs/toolkit';

const indicatorsSlice = createSlice({
  name: 'indicator',
  initialState: {
    indicators: [],
    selectedIndiId:[],
    indicatorsDetails:[]
  },
  reducers: {
    setIndicators: (state, action) => {
      state.indicators = action.payload;
    },
    setIndicatorsDetails: (state, action) => {
      state.indicatorsDetails = action.payload;
    },
    setSelectedIndiId: (state, action) => {
      state.selectedIndiId = action.payload;
    },
    clearIndicatorsDetails: (state) => {
      state.indicatorsDetails=[]
    },


  },
});

export const { setIndicators, setSelectedIndiId, setIndicatorsDetails,clearIndicatorsDetails } = indicatorsSlice.actions;
export default indicatorsSlice.reducer;
