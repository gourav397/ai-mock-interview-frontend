import axios from "axios";

const API = axios.create({
  baseURL: "https://ai-interview-backend-production-6da2.up.railway.app/api",
  headers: { "Content-Type": "application/json" },
  timeout: 180000,
});

// ⭐⭐ HAR request mein token AUTO-ATTACH — isi se 401 khatam
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ⭐ Agar 401 aaye (token expire) to clean karke login pe bhejo
API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response && err.response.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

export default API;