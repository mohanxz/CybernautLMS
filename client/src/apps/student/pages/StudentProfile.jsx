import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import UserContext from '../context/UserContext';
import axios from 'axios';


function StudentProfile() {
  const { userData, setUserData } = useContext(UserContext);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const logout = () => {
    localStorage.clear();
    setUserData(null);
    navigate('/');
  };

  const changePassword = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${import.meta.env.VITE_LOGIN_API}/auth/change-password`,
        {
          username: userData.username,
          newPassword,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      alert('Password changed successfully');
    } catch {
      alert('Failed to change password');
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white text-center mb-8">
        Profile & Settings
      </h1>

      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl overflow-hidden">
        {/* Profile Header */}
        <div className="p-6 md:p-8 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            <div className="w-20 h-20 md:w-24 md:h-24 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl md:text-3xl font-bold">
              {userData?.name ? userData.name.charAt(0) : 'S'}
            </div>
            <div className="text-center sm:text-left">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white">{userData?.name || 'Student Name'}</h3>
              <p className="text-gray-600 dark:text-gray-300 mt-1">{userData?.email || 'student@example.com'}</p>
              <span className="inline-block mt-3 px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                Student
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-center">
            <button className="px-6 py-3 text-blue-600 border-b-2 border-blue-600 font-medium">
              Password
            </button>
          </div>
        </div>

        {/* Password Settings Content */}
        <div className="p-6 md:p-8">
          <div className="mb-6">
            <h4 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Password Settings</h4>
            <p className="text-gray-600 dark:text-gray-300">Update your password to keep your account secure</p>
          </div>
          
          <div className="max-w-sm mx-auto md:mx-0 space-y-6">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button
              onClick={changePassword}
              className="w-full bg-black hover:bg-gray-800 text-white font-bold py-3 px-4 rounded-lg shadow-lg transition-all duration-200 hover:scale-105"
            >
              Change Password
            </button>

            <button
              onClick={logout}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg shadow-lg transition-all duration-200 hover:scale-105"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 md:px-8 py-6 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
          <button
            onClick={() => navigate('/student/home')}
            className="w-full sm:w-auto bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 px-6 py-3 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-500 hover:shadow-md transition-all duration-200 text-sm font-medium text-gray-700 dark:text-gray-200"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

export default StudentProfile;