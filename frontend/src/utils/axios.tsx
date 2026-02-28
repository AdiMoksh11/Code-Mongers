import axios from "axios";

// Fallback baseURL in dev if NEXT_PUBLIC_API_URL is not provided
const inferDevBaseUrl = () => {
  if (typeof window === "undefined") return undefined;
  const { protocol, hostname } = window.location;
  // Assume backend runs on 4000 in dev
  return `${protocol}//${hostname}:4000`;
};

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || inferDevBaseUrl(),
  withCredentials: true,
});

// Attach Authorization header with token from localStorage if present
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers = config.headers || {};
      (config.headers as any)["Authorization"] = `Bearer ${token}`;
    }
  }
  return config;
});

// Redirect to login on 401 unauthorized
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (typeof window !== "undefined") {
      const status = error?.response?.status;
      if (status === 401) {
        // optionally clear token
        localStorage.removeItem("authToken");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
