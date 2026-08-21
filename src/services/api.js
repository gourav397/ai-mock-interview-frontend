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

    // 3. Validate: ensure token is a real JWT (starts with eyJ), not "undefined" or "null"
    if (token && typeof token === 'string' && token.startsWith('eyJ') && token.split('.').length === 3) {
      config.headers.Authorization = `Bearer ${token}`;
    } else if (token && token !== "undefined" && token !== "null" && token !== "") {
      // Even if it doesn't look like a full JWT, trust the value
      // (some tokens may not start with eyJ depending on encoding)
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
    // Only logout on 401 if there's actually a token in localStorage
    // (prevents logout on CORS preflight or other non-auth 401s)
    if (error.response?.status === 401) {
      const hasToken = localStorage.getItem("token") || (
        (() => {
          try {
            const u = JSON.parse(localStorage.getItem("user") || "{}");
            return !!u?.token;
          } catch { return false; }
        })()
      );

      if (hasToken) {
        console.warn("Auth expired — clearing user");
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default API;