import axios from "axios";

// ⚠️ Ye URL apne Railway ke EXACT domain se match hona chahiye
const API = axios.create({
  baseURL: "https://ai-mock-interview-backend-production-6da2.up.railway.app/api",
  headers: { "Content-Type": "application/json" },
  timeout: 180000, // 3 minute — 50 questions 7 batches mein 60-90 sec lagte hain
});

export default API;