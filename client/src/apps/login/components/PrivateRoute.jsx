import { useEffect } from 'react';
import API from '../api';

const PrivateRoute = () => {
  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      const token = localStorage.getItem('token');
      const role = localStorage.getItem('role');

      if (!token || !role) {
        window.location.href = `${import.meta.env.VITE_FRONTEND_URL}/login`;
        return;
      }

      try {
        // Verify token is still valid
        await API.get('/auth/verify', {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Redirect based on role
        const redirectBase = import.meta.env.VITE_FRONTEND_URL;
        if (role === 'superadmin') {
          window.location.href = `${redirectBase}/superadmin?token=${token}&role=${role}`;
        } else if (role === 'admin') {
          window.location.href = `${redirectBase}/admin?token=${token}&role=${role}`;
        } else if (role === 'student') {
          window.location.href = `${redirectBase}/student?token=${token}&role=${role}`;
        } else {
          alert('Unknown user role');
          localStorage.clear();
          window.location.href = `${redirectBase}/login`;
        }
      } catch (err) {
        // Token invalid or expired
        console.error('Token invalid:', err);
        localStorage.clear();
        window.location.href = `${import.meta.env.VITE_FRONTEND_URL}/login`;
      }
    };

    checkAuthAndRedirect();
  }, []);

  return null; // No UI rendered
};

export default PrivateRoute;
