import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    dashboard: {},
}

export const dashboardSlice = createSlice({
    name: 'dashboard',
    initialState,
    reducers: {
        setdashboard: (state, action) => {
            state.dashboard = action.payload
        },



    },
});

export const { setdashboard } = dashboardSlice.actions;
export default dashboardSlice.reducer;