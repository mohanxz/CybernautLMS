// src/api.js
import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_ADMIN_API, // use from .env
});

// Add token to headers
API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

// Handle token expiration
API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response && [401, 403].includes(err.response.status)) {
      localStorage.removeItem('token');
      window.location.href = "/login"; // fallback if not in React context
    }
    return Promise.reject(err);
  }
);

export default API;
