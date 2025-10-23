import axios from "axios";
import { getAuth } from "firebase/auth";

const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
});

http.interceptors.request.use(async (config) => {
  const auth = getAuth();
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = "Bearer " + token;
  }
  return config;
});

export default http;





