import { createSlice } from '@reduxjs/toolkit';
 
const dataSetsSlice = createSlice({
  name: 'dataSets',
  initialState: {
    dataSetsExcel: [],
    dataSetsSql:[],
    dataSetsDetails:[],
  DataSetsFilterResponse:[],
  },
  reducers: {
    setDataSets: (state, action) => {
      state.dataSetsExcel = action.payload;
    },
    setdataSetsQuery: (state, action) => {
      state.dataSetsSql = action.payload;
    },
    setDataSetsDetails: (state, action) => {
      state.dataSetsDetails = action.payload;
    },
    setDataSetsFilterResponse: (state, action) => {
      state.DataSetsFilterResponse = action.payload;
    },
 
    clearDataSetsDetails: (state) => {
      state.dataSetsDetails = [],state.DataSetsFilterResponse=[];
    },
 
 
  },
});
 
export const { setDataSets,setdataSetsQuery,setDataSetsDetails,clearDataSetsDetails,setDataSetsFilterResponse} = dataSetsSlice.actions;
export default dataSetsSlice.reducer;