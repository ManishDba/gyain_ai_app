import { createSlice } from '@reduxjs/toolkit'

const initialState = {
    email: "",
    token: "",
    userDetails: {},
}

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        setUserAuthCred: (state, action) => {
            return {
                ...state,
                ...action.payload
            };
        },
        removeUserAuthCred: (state, action) => {
            return {
                ...state,
                ...initialState
            };
        },
        restoreAuthState: (state, action) => {
            return {
                ...state,
                ...action.payload
            };
        },
        setUserDetails: (state, action) => {
          return {
            ...state,
            userDetails: action.payload, 
          };
        },
    },
})

export const { setUserAuthCred, removeUserAuthCred, restoreAuthState,setUserDetails } = authSlice.actions
export default authSlice.reducer