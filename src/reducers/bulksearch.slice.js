import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    document_type: [],
    tag:[]
}

export const bulkSearchSlice = createSlice({
    name: 'bulksearch',
    initialState,
    reducers: {
        setDocument_type: (state, action) => {
            state.document_type = action.payload
        },
        setTag: (state, action) => {
            state.tag = action.payload
        },



    },
});

export const { setDocument_type ,setTag} = bulkSearchSlice.actions;
export default bulkSearchSlice.reducer;