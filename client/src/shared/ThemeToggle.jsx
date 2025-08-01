import React from 'react';
import { FaSun, FaMoon } from 'react-icons/fa';

const ThemeToggle = ({ darkMode, setDarkMode }) => {
  return (
    <button
      onClick={() => setDarkMode(!darkMode)}
      className="relative inline-flex items-center justify-center h-8 w-14 rounded-full bg-gray-300 dark:bg-gray-600 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
      aria-label="Toggle dark mode"
    >
      {/* Toggle Circle - perfectly centered and sized */}
      <span
        className={`absolute inline-block h-6 w-6 rounded-full bg-white shadow-lg transition-transform duration-300 ease-in-out flex items-center justify-center ${
          darkMode ? 'translate-x-3' : 'translate-x-[-12px]'
        }`}
      >
        {/* Icon inside the circle - perfectly centered */}
        {darkMode ? (
          <FaMoon className="h-3 w-3 text-gray-700" />
        ) : (
          <FaSun className="h-3 w-3 text-yellow-500" />
        )}
      </span>
      
      {/* Background Icons - perfectly positioned in each half */}
      <span className="absolute left-0 top-0 h-full w-7 flex items-center justify-center">
        <FaSun className={`h-3 w-3 transition-opacity duration-300 ${darkMode ? 'opacity-30' : 'opacity-70'} text-yellow-400`} />
      </span>
      <span className="absolute right-0 top-0 h-full w-7 flex items-center justify-center">
        <FaMoon className={`h-3 w-3 transition-opacity duration-300 ${darkMode ? 'opacity-70' : 'opacity-30'} text-gray-400`} />
      </span>
    </button>
  );
};

export default ThemeToggle;