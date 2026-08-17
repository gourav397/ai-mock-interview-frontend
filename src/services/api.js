import axios from "axios";

const API = axios.create({
  baseURL: "https://ai-interview-backend-production-6da2.up.railway.app/api",
  headers: { "Content-Type": "application/json" },
  timeout: 180000,
});

export default API;