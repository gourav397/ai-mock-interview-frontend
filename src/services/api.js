// ============================================================
// API SERVICE — Centralized API client
// ============================================================

import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ============================================================
// AUTH INTERCEPTOR
// ============================================================

api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("token") ||
      sessionStorage.getItem("token");

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ============================================================
// RESPONSE INTERCEPTOR
// ============================================================

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
        data?.message ||
        data?.error ||
        `Request failed (${status})`;

      error.message = message;
      error.responseData = data;
    } else if (error.request) {
      error.message =
        "No response from server. Check your connection.";
    }

    return Promise.reject(error);
  }
);

// ============================================================
// SAFE FILENAME
// ============================================================

const extractBasename = (value) => {
  if (!value || typeof value !== "string") {
    return null;
  }

  if (
    value.startsWith("data:") ||
    value.startsWith("blob:")
  ) {
    return null;
  }

  const clean = value
    .split("?")[0]
    .split("#")[0];

  const name = clean
    .split("/")
    .pop()
    .split("\\")
    .pop();

  if (!name) return null;

  if (!/^[a-zA-Z0-9._-]+$/.test(name)) {
    return null;
  }

  if (!name.includes(".")) {
    return null;
  }

  return name;
};

// ============================================================
// RESULT FILENAME
// ============================================================

const resolveImageFilename = (data = {}) => {
  return (
    extractBasename(data.preview) ||
    extractBasename(data.resultUrl) ||
    extractBasename(data.path) ||
    extractBasename(data.filename) ||
    null
  );
};

// ============================================================
// PREVIEW URL
// ============================================================

const buildPreviewUrl = (filename) => {
  const name = extractBasename(filename);

  if (!name) return null;

  return `${API_BASE_URL}/api/image-editor/preview/${encodeURIComponent(
    name
  )}?t=${Date.now()}`;
};

// ============================================================
// DOWNLOAD URL
// ============================================================

const buildDownloadUrl = (filename) => {
  const name = extractBasename(filename);

  if (!name) return null;

  return `${API_BASE_URL}/api/image-editor/download/${encodeURIComponent(
    name
  )}`;
};

// ============================================================
// LEGACY URL HELPER
// ============================================================

const absolutize = (url) => {
  if (!url) return null;

  if (
    url.startsWith("http") ||
    url.startsWith("blob:") ||
    url.startsWith("data:")
  ) {
    return url;
  }

  return `${API_BASE_URL}${url}`;
};

// ============================================================
// API SERVICE
// ============================================================

const apiService = {
  // ----------------------------------------------------------
  // GENERIC
  // ----------------------------------------------------------

  get: (url, config = {}) =>
    api.get(url, config),

  post: (url, data, config = {}) =>
    api.post(url, data, config),

  put: (url, data, config = {}) =>
    api.put(url, data, config),

  patch: (url, data, config = {}) =>
    api.patch(url, data, config),

  delete: (url, config = {}) =>
    api.delete(url, config),

  // ----------------------------------------------------------
  // HELPERS
  // ----------------------------------------------------------

  absolutize,
  extractBasename,
  resolveImageFilename,
  buildPreviewUrl,
  buildDownloadUrl,

  // ----------------------------------------------------------
  // UPLOAD
  // ----------------------------------------------------------

  uploadImage: (file) => {
    const formData = new FormData();

    formData.append(
      "image",
      file,
      file.name
    );

    return api.post(
      "/api/image-editor/upload",
      formData,
      {
        headers: {
          "Content-Type": undefined,
        },
      }
    );
  },

  // ----------------------------------------------------------
  // FILTER
  // ----------------------------------------------------------

  applyFilter: (imagePath, filter) =>
    api.post(
      "/api/image-editor/filter",
      {
        imagePath,
        filter,
      }
    ),

  // ----------------------------------------------------------
  // ADJUSTMENTS
  // ----------------------------------------------------------

  applyAdjustments: (
    imagePath,
    adjustments
  ) =>
    api.post(
      "/api/image-editor/adjust",
      {
        imagePath,
        adjustments,
      }
    ),

  // ----------------------------------------------------------
  // ENHANCE
  // ----------------------------------------------------------

  enhanceImage: (imagePath) =>
    api.post(
      "/api/image-editor/enhance",
      {
        imagePath,
        scale: 1.5,
      }
    ),

  // ----------------------------------------------------------
  // UPSCALE
  // ----------------------------------------------------------

  upscaleImage: (
    imagePath,
    scale = 2
  ) =>
    api.post(
      "/api/image-editor/upscale",
      {
        imagePath,
        scale,
      }
    ),

  // ----------------------------------------------------------
  // RESIZE
  // ----------------------------------------------------------

  resizeImage: (
    imagePath,
    width,
    height,
    fit = "cover"
  ) =>
    api.post(
      "/api/image-editor/resize",
      {
        imagePath,
        width,
        height,
        fit,
      }
    ),

  // ----------------------------------------------------------
  // CROP
  // ----------------------------------------------------------

  cropImage: (
    imagePath,
    left,
    top,
    width,
    height
  ) =>
    api.post(
      "/api/image-editor/crop",
      {
        imagePath,
        left,
        top,
        width,
        height,
      }
    ),

  // ----------------------------------------------------------
  // ROTATE
  // ----------------------------------------------------------

  rotateImage: (
    imagePath,
    degrees = 90
  ) =>
    api.post(
      "/api/image-editor/rotate",
      {
        imagePath,
        degrees,
      }
    ),

  // ----------------------------------------------------------
  // REMOVE BACKGROUND
  // ----------------------------------------------------------

  removeBackground: (imagePath) =>
    api.post(
      "/api/image-editor/remove-background",
      {
        imagePath,
      }
    ),

  // ----------------------------------------------------------
  // REPLACE BACKGROUND
  // ----------------------------------------------------------

  replaceBackground: (
    imagePath,
    color = "#ffffff"
  ) =>
    api.post(
      "/api/image-editor/replace-background",
      {
        imagePath,
        color,
      }
    ),

  // ----------------------------------------------------------
  // BACKGROUND BLUR
  // ----------------------------------------------------------

  backgroundBlur: (
    imagePath,
    intensity = "medium"
  ) =>
    api.post(
      "/api/image-editor/background-blur",
      {
        imagePath,
        intensity,
      }
    ),

  // ----------------------------------------------------------
  // HAIRSTYLE API KEPT FOR BACKEND COMPATIBILITY
  // UI WILL NOT USE THIS FOR FREE STYLES
  // ----------------------------------------------------------

  applyHairstyle: (
    imagePath,
    style
  ) =>
    api.post(
      "/api/image-editor/hairstyle",
      {
        imagePath,
        style,
      }
    ),

  getHairstyles: () =>
    api.get(
      "/api/image-editor/hairstyles"
    ),

  // ----------------------------------------------------------
  // AI EDIT — PRESERVED
  // ----------------------------------------------------------

  aiEditImage: (
    imagePath,
    instruction
  ) =>
    api.post(
      "/api/image-editor/ai-edit",
      {
        imagePath,
        instruction,
      }
    ),

  // ----------------------------------------------------------
  // COMPARE
  // ----------------------------------------------------------

  compareImage: (
    imagePath,
    editType = "enhance"
  ) =>
    api.post(
      "/api/image-editor/compare",
      {
        imagePath,
        editType,
      }
    ),

  // ----------------------------------------------------------
  // RESET
  // ----------------------------------------------------------

  resetImage: (imagePath) =>
    api.post(
      "/api/image-editor/reset",
      {
        imagePath,
      }
    ),

  // ----------------------------------------------------------
  // DOWNLOAD
  // ----------------------------------------------------------

  downloadUrl: buildDownloadUrl,
};

export default apiService;

export {
  api,
  API_BASE_URL,
};
