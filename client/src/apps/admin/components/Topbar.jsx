import React from 'react';
import { FaBell, FaBars } from 'react-icons/fa';
import ThemeToggle from '../../../shared/ThemeToggle';

export default function Topbar({ pageTitle = "Dashboard", adminName = "Admin", darkMode, setDarkMode, toggleSidebar }) {
  return (
    <div className="w-full bg-white dark:bg-black shadow-sm border-b border-gray-200 dark:border-gray-800 z-30">
      <div className="px-6 h-20 flex justify-between items-center">
        
        {/* Left: Page Title */}
        <div className="flex items-center gap-4">
          <button 
            className="p-2 text-gray-600 dark:text-gray-300" 
            onClick={toggleSidebar}
          >
            <FaBars className="text-xl" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            {pageTitle}
          </h1>
        </div>

        {/* Right: Actions and User Info */}
        <div className="flex items-center gap-4">
          
          {/* Theme Toggle */}
          <ThemeToggle darkMode={darkMode} setDarkMode={setDarkMode} />
          
          {/* Notifications */}
          <div className="relative">
            <button className="p-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-white hover:bg-blue-50 dark:hover:bg-gray-800 rounded-xl transition-all duration-200">
              <FaBell className="text-xl" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-black"></span>
            </button>
          </div>

          {/* Welcome Message */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-xl border border-blue-100 dark:border-gray-700">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Welcome back,</span>
            <span className="text-sm font-semibold text-blue-700 dark:text-white">{adminName}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
