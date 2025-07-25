import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import {
  FaHome, FaBook, FaUser, FaUsers, FaChartBar, FaFolderPlus,
  FaMoneyBill, FaCog, FaEnvelope, FaSignOutAlt , FaChartPie
} from "react-icons/fa";
import { IoSettingsOutline } from "react-icons/io5";
import {toast} from "react-toastify";
import bulbImg from '../../../shared/bulb.png';

const menuItems = [
  { id: "dashboard", icon: <FaHome />, label: "Dashboard", path: "/superadmin" },
  { id: "admins", icon: <FaUser />, label: "Admin Management", path: "/superadmin/admins" },
  { id: "courses", icon: <FaBook />, label: "Course Management", path: "/superadmin/courses" },
  { id: "batches", icon: <FaFolderPlus />, label: "Batch Management", path: "/superadmin/batches" },
  { id: "students", icon: <FaUsers />, label: "Student Management", path: "/superadmin/students" },
  { id: "salary", icon: <FaMoneyBill />, label: "Salary Management", path: "/superadmin/salary" },
  { id: "communication", icon: <FaEnvelope />, label: "Communication", path: "/superadmin/communication" },
  { id: "analytics", icon: <FaChartPie />, label: "Analytics", path: "/superadmin/analytics" },
  { id: "setings", icon: <FaCog />, label: "Profile", path: "/superadmin/settings" },
  { id: "certificates", icon: <FaChartBar />, label: "Certificates", path: "/superadmin/certificates" }

];


export default function Sidebar({ onHover }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [active, setActive] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("theme") === "dark"
  );

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  useEffect(() => {
  const currentPath = location.pathname;
  const current = menuItems.find(item => currentPath.endsWith(item.path));
  setActive(current?.id || "");
}, [location]);

  useEffect(() => {
    const fetchSuperAdmin = async () => {
      try {
        const res = await axios.get("http://localhost:5004/auth/superadmin/me", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        const superAdmin = res.data?.[0]; 
        if (superAdmin) {
          setUserEmail(superAdmin.email || "admin@lms.com");
        }
      } catch (error) {
        console.error("Error fetching super admin:", error);
      }
    };
    fetchSuperAdmin();
  }, []);

const handleLogout = async () => {
  const token = localStorage.getItem("token");
  try {
    localStorage.removeItem("token");
    toast.success("Logged out successfully");
    setTimeout(() => {
      navigate("/login");
    }, 500);
  } catch (error) {
    console.error("Logout failed:", error);
    toast.error("Logout failed");
  }
};


  return (
    <>
      {/* Theme Toggle Button */}
      <div
        className="fixed left-1/2 transform -translate-x-1/2 z-50 cursor-pointer transition-all duration-300 hover:scale-110"
        onClick={() => setDarkMode(!darkMode)}
      >
        <div
          className={`absolute inset-0 rounded-full transition-all duration-500 ${
            !darkMode ? "bg-yellow-300 blur-2xl opacity-60 scale-125" : "bg-gray-600 opacity-20 scale-110"
          }`}
        ></div>
        <img
          src={bulbImg}
          className="relative w-10 h-15 z-20 transition-all duration-300"
          alt="Toggle Theme"
        />
      </div>

      <aside
  className="fixed top-0 left-0 z-40 w-64 h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 shadow-sm flex flex-col overflow-y-auto scrollbar-hide"
>





      <div className="flex-1 flex flex-col">
        {/* Logo Section */}
        <div className="flex items-center gap-3 p-2 border-b border-gray-200 dark:border-gray-700">
          <div className="h-11 w-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xl font-bold shadow-lg">
            SA
          </div>
          <div>
            <h1 className="font-bold text-gray-900 dark:text-white text-lg">Super Admin</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">LMS Portal</p>
          </div>
        </div>

        {/* Profile Section */}
        <div className="border-b border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 px-4 py-3 rounded-xl border border-red-200 dark:border-red-800">
            <div className="relative">
              <div className="h-10 w-10 bg-gradient-to-br from-red-600 to-pink-600 rounded-full flex items-center justify-center text-white shadow-sm">
                <FaUser className="text-lg" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></div>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Super Admin</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{userEmail}</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 flex flex-col px-4 py-6 space-y-2">
          {menuItems.map(({ id, icon, label, path }) => {
            const isActive = active === id;
            return (
              <button
                key={id}
                onClick={() => navigate(path)}
                className={`flex items-center gap-4 px-4 py-3 rounded-xl text-left transition-all duration-200 ease-in-out ${
                  isActive
                    ? "bg-blue-700 text-white shadow-lg"
                    : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 hover:shadow-sm"
                }`}
              >
                <span className={`text-lg ${isActive ? "text-white" : "text-blue-700 dark:text-blue-400"}`}>
                  {icon}
                </span>
                <span className="text-sm font-semibold tracking-wide">{label}</span>
              </button>
            );
          })}
        </nav>
      </div>
      
      {/* Logout Section */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 text-base font-semibold text-red-600 dark:text-red-500 hover:text-white hover:bg-red-600 border-2 border-red-600 rounded-xl transition-all duration-300 hover:shadow-lg transform hover:scale-105"
        >
          <FaSignOutAlt className="text-xl" />
          <span className="tracking-wide">Sign Out</span>
        </button>
      </div>
      </aside>
    </>
  );
}