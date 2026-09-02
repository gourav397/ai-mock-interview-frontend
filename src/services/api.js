// ============================================================
// API SERVICE — Centralized API client
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
      error.responseData = data;
    } else if (error.request) {
      error.message = "No response from server. Check your connection.";
    }

    return Promise.reject(error);
  }
);

// ============================================
// IMAGE EDITOR — URL / FILENAME NORMALIZATION
// Single source of truth for extracting a safe filename from ANY
// backend response format:
//   - { path: "adjusted_uuid.jpg" }                          (new backend)
//   - { path: "/app/temp/processed/adjusted_uuid.jpg" }      (old backend, full fs path)
//   - { path: "C:\\app\\temp\\adjusted_uuid.jpg" }           (old backend, Windows)
//   - { preview: "/api/image-editor/preview/adjusted_x.jpg" }
//   - { resultUrl: ".../preview/adjusted_x.jpg" }
//   - { filename: "adjusted_x.jpg" }
// ============================================================

/**
 * Extract a safe basename from any value (URL, path, or plain filename).
 * Returns null if nothing safe can be extracted.
 */
const extractBasename = (value) => {
  if (!value || typeof value !== "string") return null;
  // Never treat data:/blob: URLs as filenames
  if (value.startsWith("data:") || value.startsWith("blob:")) return null;
  // Strip query/hash, then take everything after the last / or \
  const clean = value.split("?")[0].split("#")[0];
  const name = clean.split("/").pop().split("\\").pop();
  if (!name) return null;
  // Must be a safe filename with an extension (blocks traversal payloads)
  if (!/^[a-zA-Z0-9._-]+$/.test(name)) return null;
  if (!name.includes(".")) return null;
  return name;
};

/**
 * Resolve the result filename from a backend response data object.
 * Checks preview URL → resultUrl → path → filename, in that order.
 */
const resolveImageFilename = (d = {}) => {
  return (
    extractBasename(d.preview) ||
    extractBasename(d.resultUrl) ||
    extractBasename(d.path) ||
    extractBasename(d.filename) ||
    null
  );
};

/**
 * Build the canonical preview URL for a filename.
 * Cache-busting param included so repeated edits always refresh.
 */
const buildPreviewUrl = (filename) => {
  const name = extractBasename(filename);
  if (!name) return null;
  return `${API_BASE_URL}/api/image-editor/preview/${encodeURIComponent(
    name
  )}?v=${Date.now()}`;
};

/**
 * Build the canonical download URL for a filename.
 * Points at the SAME generated file as the preview.
 */
const buildDownloadUrl = (filename) => {
  const name = extractBasename(filename);
  if (!name) return null;
  return `${API_BASE_URL}/api/image-editor/download/${encodeURIComponent(name)}`;
};

// Legacy helper kept for compatibility
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
  extractBasename,
  resolveImageFilename,
  buildPreviewUrl,
  buildDownloadUrl,

  // ============================================
  // IMAGE UPLOAD — multipart/form-data, field name MUST be "image"
  // (Do NOT set Content-Type manually — axios sets the boundary)
  // ============================================
 uploadImage: (file) => {
  const formData = new FormData();

  formData.append("image", file, file.name);

  return api.post("/api/image-editor/upload", formData, {
    headers: {
      "Content-Type": undefined,
    },
  });
},

  // ============================================
  // IMAGE EDITING OPERATIONS — all stateless via imagePath
  // imagePath is always a SAFE basename returned by a previous call
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

  downloadUrl: buildDownloadUrl,
};

export default apiService;
export { api, API_BASE_URL };