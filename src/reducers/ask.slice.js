import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    Category: {},
}

export const askSlice = createSlice({
    name: 'ask',
    initialState,
    reducers: {
        setCategory: (state, action) => {
            state.Category = action.payload
        },



    },
});

export const { setCategory } = askSlice.actions;
export default askSlice.reducer;