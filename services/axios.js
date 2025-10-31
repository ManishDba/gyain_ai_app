import axios from "axios";
import store from "../src/store";
import { startLoaderAct, stopLoaderAct } from "../src/reducers/loader.slice";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ENV } from "../env";

// Create Axios instance
const axiosInstance = axios.create({
  baseURL: ENV.BASE_URL,
});

// Track active requests
let activeRequests = 0;

// ✅ REQUEST INTERCEPTOR
axiosInstance.interceptors.request.use(
  async (config) => {
    activeRequests += 1;
    if (activeRequests === 1) {
      // Start loader only when the first request begins
      store.dispatch(startLoaderAct());
    }

    const state = store.getState();
    const token = state.authSlice.token || null;

    if (token) {
      config.headers["Authorization"] = `Token ${token}`;
      await AsyncStorage.setItem("auth_token", token);
    }

    return config;
  },
  (error) => {
    activeRequests = Math.max(activeRequests - 1, 0);
    if (activeRequests === 0) {
      store.dispatch(stopLoaderAct());
    }
    return Promise.reject(error);
  }
);

// ✅ RESPONSE INTERCEPTOR
axiosInstance.interceptors.response.use(
  (response) => {
    activeRequests = Math.max(activeRequests - 1, 0);
    if (activeRequests === 0) {
      // Stop loader only when all requests have finished
      store.dispatch(stopLoaderAct());
    }
    return response;
  },
  (error) => {
    activeRequests = Math.max(activeRequests - 1, 0);
    if (activeRequests === 0) {
      store.dispatch(stopLoaderAct());
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
