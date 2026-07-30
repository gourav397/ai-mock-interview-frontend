import axios from "axios";

const API = axios.create({
  baseURL: "https://ai-mock-interview-backend-production-6da2.up.railway.app/api"
});

export default API;