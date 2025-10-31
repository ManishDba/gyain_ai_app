import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    files: [],
    Smskit:[],
    NewSmsSendDetails:[]

}

export const filesSlice = createSlice({
    name: 'files',
    initialState,
    reducers: {
        setFiles: (state, action) => {
            state.files = action.payload
        },



    },
});

export const { setFiles } = filesSlice.actions;
export default filesSlice.reducer;