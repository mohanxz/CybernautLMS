import { useEffect, useState } from "react";

const AdminPublicRoute = ({ children }) => {
  const [canRender, setCanRender] = useState(false);

  const ADMIN_DASHBOARD_URL = import.meta.env.VITE_ADMIN_FRONTEND_URL;

  useEffect(() => {
    const token = localStorage.getItem("adminToken");

    if (token) {
      // Optional: verify token via API
      window.location.href = ADMIN_DASHBOARD_URL;
    } else {
      setCanRender(true);
    }
  }, []);

  return canRender ? children : null; // Optionally show loading spinner
};

export default AdminPublicRoute;
