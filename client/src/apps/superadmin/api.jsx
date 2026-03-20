import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_SUPERADMIN_API || "http://localhost:5000", // fallback to localhost
  timeout: 10000, // 10 second timeout
});

// Request interceptor to add token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log requests in development
    if (import.meta.env.DEV) {
      console.log(
        `🚀 ${config.method.toUpperCase()} ${config.baseURL}${config.url}`,
        config.data || "",
      );
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor for error handling
API.interceptors.response.use(
  (response) => {
    // Log responses in development
    if (import.meta.env.DEV) {
      console.log(" Response:", response.status, response.data);
    }
    return response;
  },
  (error) => {
    // Enhanced error logging
    console.error("❌ API Error:", {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      code: error.code,
    });

    // Handle authentication errors
    if (error.response && [401, 403].includes(error.response.status)) {
      console.log("🔄 Authentication error - redirecting to login");
      localStorage.removeItem("token");
      window.location.href =
        (import.meta.env.VITE_FRONTEND_URL || "http://localhost:5173") +
        "/login";
    }

    // Handle network errors
    if (error.code === "ERR_NETWORK") {
      console.error(
        "🔌 Network Error - Cannot connect to server at:",
        error.config?.baseURL,
      );
    }

    return Promise.reject(error);
  },
);

export default API;
