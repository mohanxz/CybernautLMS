import { useEffect, useState } from 'react';
import axios from 'axios';

const PrivateRoute = ({ children }) => {
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const LOGIN_API = import.meta.env.VITE_LOGIN_API;
  const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL;

  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        setIsAuthenticated(false);
        setCheckingAuth(false);
        window.location.href = FRONTEND_URL; // Redirect to login
        return;
      }

      try {
        await axios.get(`${LOGIN_API}/auth/verify`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setIsAuthenticated(true);
      } catch (err) {
        localStorage.removeItem('token');
        setIsAuthenticated(false);
        window.location.href = FRONTEND_URL; // Redirect to login
      } finally {
        setCheckingAuth(false);
      }
    };

    verifyToken();
  }, []);

  if (checkingAuth) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Checking authentication...</p>
      </div>
    );
  }

  return isAuthenticated ? children : null;
};

export default PrivateRoute;
