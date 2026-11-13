
import axios from "axios";

const quizBattleAPI = axios.create({
  baseURL: (
    import.meta.env.VITE_API_URL ||
    "https://ai-mock-interview-backend-ymuh.onrender.com"
  ).replace(/\/+$/, "") + "/api",

  timeout: 120000,

  headers: {
    "Content-Type": "application/json",
  },
});

// Authentication — existing API jaisa hi
quizBattleAPI.interceptors.request.use(
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

export default quizBattleAPI;
