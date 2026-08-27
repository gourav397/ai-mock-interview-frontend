import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      if (status === 401) {
        localStorage.removeItem("token");
        sessionStorage.removeItem("token");
        if (!window.location.pathname.includes("/login")) window.location.href = "/login";
      }
      error.message = data?.message || data?.error || `Request failed (${status})`;
    } else if (error.request) {
      error.message = "No response from server. Check your connection.";
    }
    return Promise.reject(error);
  }
);

const apiService = {
  get: (url, config = {}) => api.get(url, config),
  post: (url, data, config = {}) => api.post(url, data, config),
  put: (url, data, config = {}) => api.put(url, data, config),
  patch: (url, data, config = {}) => api.patch(url, data, config),
  delete: (url, config = {}) => api.delete(url, config),

  // IMAGE EDITOR OPERATIONS
  uploadImage: (file, sessionId = null) => {
    const formData = new FormData();
    formData.append("image", file);
    const headers = { "Content-Type": "multipart/form-data" };
    if (sessionId) headers["X-Session-Id"] = sessionId;
    return api.post("/api/image-editor/upload", formData, { headers });
  },
  applyFilter: (sessionId, filter) => api.post("/api/image-editor/filter", { sessionId, filter }),
  applyAdjustments: (sessionId, adjustments) => api.post("/api/image-editor/adjust", { sessionId, adjustments }),
  enhanceImage: (sessionId) => api.post("/api/image-editor/enhance", { sessionId }),
  upscaleImage: (sessionId, factor = 2) => api.post("/api/image-editor/upscale", { sessionId, factor }),
  removeBackground: (sessionId) => api.post("/api/image-editor/remove-bg", { sessionId }),
  aiEditImage: (sessionId, instruction) => api.post("/api/image-editor/ai-edit", { sessionId, instruction }),
  resetImage: (sessionId) => api.post("/api/image-editor/reset", { sessionId }),
  getSession: (sessionId) => api.get(`/api/image-editor/session/${sessionId}`),
  clearSession: (sessionId) => api.delete(`/api/image-editor/session/${sessionId}`),
};

export default apiService;
export { api, API_BASE_URL };