import axios from "axios";

const API = axios.create({
  baseURL: "https://ai-interview-backend-production-6da2.up.railway.app/api",
  headers: { "Content-Type": "application/json" },
  timeout: 300000, // 5 minutes (increased for voice processing)
});

// ── Request Interceptor ──
// Automatically attaches JWT token from localStorage
API.interceptors.request.use((config) => {
  try {
    let token = null;

    // 1. First try: read from "user" object (primary method)
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      token = user?.token || user?.accessToken || null;
    }

    // 2. Fallback: read directly from "token" key (for backward compatibility)
    if (!token) {
      token = localStorage.getItem("token");
    }

    if (token && token !== "undefined" && token !== "null") {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    console.warn("Auth interceptor: failed to parse user", e.message);
  }
  return config;
});

// ── Response Interceptor ──
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("Auth expired — clearing user");
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default API;