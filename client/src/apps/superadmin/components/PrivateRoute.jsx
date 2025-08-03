import { useEffect, useState } from 'react';
import axios from 'axios';

const PrivateRoute = ({ children }) => {
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const logout = async () => {
    const token = localStorage.getItem('token');

    if (!token) return;

    try {
      await axios.post(`${import.meta.env.VITE_LOGIN_API}/auth/logout`, null, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (err) {
      console.error("Logout request failed:", err.message);
    } finally {
      localStorage.removeItem('token');
      window.location.href = `${import.meta.env.VITE_FRONTEND_URL}/login`; // Redirect using env
    }
  };

  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        setIsAuthenticated(false);
        setCheckingAuth(false);
        window.location.href = `${import.meta.env.VITE_FRONTEND_URL}/login`;
        return;
      }

      try {
        await axios.get(`${import.meta.env.VITE_LOGIN_API}/auth/verify`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setIsAuthenticated(true);
      } catch (err) {
        console.error("Token verification failed:", err.message);
        await logout();
        return;
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
