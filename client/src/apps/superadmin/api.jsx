// src/api.js
import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_SUPERADMIN_API, // use .env variable
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response && [401, 403].includes(err.response.status)) {
      localStorage.removeItem('token');
      window.location.href = import.meta.env.VITE_FRONTEND_URL + '/login'; // redirect using env
    }
    return Promise.reject(err);
  }
);

export default API;
