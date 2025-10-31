import { createSlice } from '@reduxjs/toolkit'

const initialState = {
    loader: false,
}

const loaderSlice = createSlice({
    name: "loader",
    initialState,
    reducers: {
        startLoaderAct: (state, action) => {
            if (!state.loader) {
                state.loader = true
            }
        },
        stopLoaderAct: (state) => {
            state.loader = false
        },
    },
})

export const { startLoaderAct, stopLoaderAct } = loaderSlice.actions
export default loaderSlice.reducer