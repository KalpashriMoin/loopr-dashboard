import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export const api = axios.create({ baseURL });

// Attach the JWT to every outgoing request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("loopr_token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global 401 handling: if the token is invalid/expired, force logout.
// A custom event is dispatched so AuthContext can react without a circular import.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.dispatchEvent(new CustomEvent("loopr:unauthorized"));
    }
    return Promise.reject(error);
  }
);

/** Extracts a human-readable message from any Axios/API error. */
export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || error.message || "Something went wrong.";
  }
  return "An unexpected error occurred.";
};
