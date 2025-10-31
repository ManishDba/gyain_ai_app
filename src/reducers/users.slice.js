import { createSlice } from '@reduxjs/toolkit';


const initialState = {
    user: {},
    config: {}
}

export const usersSlice = createSlice({
    name: 'users',
    initialState,
    reducers: {
        setUsers: (state, action) => {
            state.user = action.payload
        },
        setConfig: (state, action) => {
            state.config = action.payload
        },



    },
});

export const { setUsers, setConfig } = usersSlice.actions;
export default usersSlice.reducer;