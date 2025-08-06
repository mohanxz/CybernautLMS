import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import {
  FaHome, FaBook, FaUser, FaUsers, FaChartBar, FaFolderPlus,
  FaMoneyBill, FaCog, FaEnvelope, FaSignOutAlt , FaChartPie
} from "react-icons/fa";
import { IoSettingsOutline } from "react-icons/io5";
import {toast} from "react-toastify";

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


export default function Sidebar({ onHover, darkMode, setDarkMode, isSidebarOpen, setSidebarOpen }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [active, setActive] = useState("");
  const [userEmail, setUserEmail] = useState("");


  useEffect(() => {
  const currentPath = location.pathname;
  const current = menuItems.find(item => currentPath.endsWith(item.path));
  setActive(current?.id || "");
}, [location]);

  useEffect(() => {
    const fetchSuperAdmin = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${import.meta.env.VITE_LOGIN_API}/auth/superadmin/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
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
    await axios.post(`${import.meta.env.VITE_LOGIN_API}/auth/logout`, null, {
      headers: { Authorization: `Bearer ${token}` },
    });
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

      <aside
        className={`fixed top-0 left-0 z-40 w-64 h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 shadow-sm flex-col
          ${isSidebarOpen ? "flex" : "hidden"} md:flex`}
      >
        {/* Close button for mobile */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="md:hidden absolute top-4 right-4 text-gray-600 dark:text-gray-300 text-2xl z-50 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
        >
          &times;
        </button>





      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* Profile Section */}
        <div className="border-b border-gray-200 dark:border-gray-700 h-20 flex items-center px-4 md:px-6">
          <div className="flex items-center gap-3 bg-gray-100 dark:bg-gray-800 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 w-full">
            <div className="relative">
              <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white shadow-sm">
                <FaUser className="text-lg" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-black dark:text-white truncate">Super Admin</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium truncate">{userEmail}</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 flex flex-col px-4 md:px-6 py-6 space-y-2 overflow-y-auto">
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
                <span className="text-sm font-semibold tracking-wide whitespace-nowrap">{label}</span>
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