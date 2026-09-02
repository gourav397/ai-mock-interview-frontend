// ============================================================
// API SERVICE — Centralized API client
// PREMIUM: Handles auth, errors, multipart, image uploads
// Image Editor endpoints are STATELESS: upload returns a server
// filename, and every edit operation sends it back as `imagePath`.
// ============================================================

import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60s for image operations
  headers: {
    "Content-Type": "application/json",
  },
});

// ============================================
// REQUEST INTERCEPTOR — Attach auth token
// ============================================

api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ============================================
// RESPONSE INTERCEPTOR — Handle common errors
// ============================================

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;

      if (status === 401) {
        localStorage.removeItem("token");
        sessionStorage.removeItem("token");
        if (!window.location.pathname.includes("/login")) {
          window.location.href = "/login";
        }
      }

      const message =
        data?.message || data?.error || `Request failed (${status})`;
      error.message = message;
    } else if (error.request) {
      error.message = "No response from server. Check your connection.";
    }

    return Promise.reject(error);
  }
);

// ============================================
// IMAGE EDITOR — URL helpers
// ============================================

// Server returns relative URLs like /api/image-editor/preview/<file>
const absolutize = (url) => {
  if (!url) return null;
  if (url.startsWith("http") || url.startsWith("blob:") || url.startsWith("data:")) return url;
  return `${API_BASE_URL}${url}`;
};

// ============================================
// GENERIC API METHODS
// ============================================

const apiService = {
  get: (url, config = {}) => api.get(url, config),
  post: (url, data, config = {}) => api.post(url, data, config),
  put: (url, data, config = {}) => api.put(url, data, config),
  patch: (url, data, config = {}) => api.patch(url, data, config),
  delete: (url, config = {}) => api.delete(url, config),

  absolutize,

  // ============================================
  // IMAGE UPLOAD — multipart/form-data, field name MUST be "image"
  // (Do NOT set Content-Type manually — axios sets the boundary)
  // ============================================
  uploadImage: (file) => {
    const formData = new FormData();
    formData.append("image", file);
    return api.post("/api/image-editor/upload", formData);
  },

  // ============================================
  // IMAGE EDITING OPERATIONS — all stateless via imagePath
  // ============================================

  applyFilter: (imagePath, filter) =>
    api.post("/api/image-editor/filter", { imagePath, filter }),

  applyAdjustments: (imagePath, adjustments) =>
    api.post("/api/image-editor/adjust", { imagePath, adjustments }),

  enhanceImage: (imagePath) =>
    api.post("/api/image-editor/enhance", { imagePath, scale: 1.5 }),

  upscaleImage: (imagePath, scale = 2) =>
    api.post("/api/image-editor/upscale", { imagePath, scale }),

  resizeImage: (imagePath, width, height, fit = "cover") =>
    api.post("/api/image-editor/resize", { imagePath, width, height, fit }),

  cropImage: (imagePath, left, top, width, height) =>
    api.post("/api/image-editor/crop", { imagePath, left, top, width, height }),

  rotateImage: (imagePath, degrees = 90) =>
    api.post("/api/image-editor/rotate", { imagePath, degrees }),

  removeBackground: (imagePath) =>
    api.post("/api/image-editor/remove-background", { imagePath }),

  replaceBackground: (imagePath, color = "#ffffff") =>
    api.post("/api/image-editor/replace-background", { imagePath, color }),

  aiEditImage: (imagePath, instruction) =>
    api.post("/api/image-editor/ai-edit", { imagePath, instruction }),

  compareImage: (imagePath, editType = "enhance") =>
    api.post("/api/image-editor/compare", { imagePath, editType }),

  resetImage: (imagePath) =>
    api.post("/api/image-editor/reset", { imagePath }),

  downloadUrl: (filename) =>
    `${API_BASE_URL}/api/image-editor/download/${filename}`,
};

export default apiService;
export { api, API_BASE_URL };