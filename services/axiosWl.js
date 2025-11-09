// without loader use axios 

import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import store from "../src/store";
import { ENV } from "../env";

// ✅ Create Axios instance
const axiosInstance = axios.create({
  baseURL: ENV.BASE_URL,
});

// ✅ REQUEST INTERCEPTOR
axiosInstance.interceptors.request.use(
  async (config) => {
    const state = store.getState();
    const token = state.authSlice.token || null;

    if (token) {
      config.headers["Authorization"] = `Token ${token}`;
      await AsyncStorage.setItem("auth_token", token);
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ✅ RESPONSE INTERCEPTOR
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

export default axiosInstance;
