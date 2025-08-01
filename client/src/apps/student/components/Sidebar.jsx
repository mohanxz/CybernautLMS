import React, { useEffect, useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  FaHome,
  FaChalkboardTeacher,
  FaCog,
  FaSignOutAlt,
  FaUserCircle,
  FaComments,
  FaChartBar, // <-- Added for Quiz Reports
  FaBars,
  FaTimes, // Added FaTimes for close button
} from "react-icons/fa";
import axios from "axios";
import { toast } from "react-toastify";
import Topbar from "./Topbar";
import { FaFileAlt } from "react-icons/fa";

const Sidebar = ({ children, pageTitle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [student, setStudent] = useState(null);
  const [batchId, setBatchId] = useState(null);
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
    const fetchStudentData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return navigate("/");

        const res = await axios.get("http://localhost:5004/auth/student/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setStudent(res.data);
        setBatchId(res.data.batch);
      } catch (error) {
        console.error("Failed to load student data:", error);
        toast.error("Failed to load profile");
        navigate("/");
      }
    };

    fetchStudentData();
  }, [navigate]);

  const handleLogout = async () => {
    const token = localStorage.getItem("token");
    try {
      await axios.post(
        "http://localhost:5004/auth/logout",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      localStorage.removeItem("token");
      toast.success("Logged out");
      window.location.href = "http://localhost:5173";
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="flex h-screen bg-white dark:bg-black text-black dark:text-white">
      <aside
        className={`fixed top-0 left-0 z-40 w-64 h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 shadow-sm flex-col ${
          isSidebarOpen ? "flex" : "hidden"
        } md:flex`}
      >
        {/* Profile */}
        <div className="border-b border-gray-200 dark:border-gray-700 h-20 flex items-center px-4 relative">
          <div className="flex items-center gap-3 bg-gray-100 dark:bg-gray-800 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 w-full">
            <div className="relative">
              <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white shadow-sm">
                <FaUserCircle className="text-lg" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-black dark:text-white truncate">
                {student?.user?.name || "Student"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium truncate">
                {student?.user?.email}
              </p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden absolute top-1/2 -translate-y-1/2 right-4 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white focus:outline-none"
            aria-label="Close sidebar"
          >
            <FaTimes className="text-xl" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6">
          <NavLink
            to="/student"
            end
            className={({ isActive }) =>
              `flex items-center gap-4 px-4 py-3 my-1 rounded-xl transition-all duration-200 ease-in-out ${
                isActive
                  ? "bg-blue-700 text-white shadow-lg"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700 text-black dark:text-white"
              }`
            }
          >
            <FaHome className="text-lg" />
            <span className="text-sm font-semibold tracking-wide">
              Dashboard
            </span>
          </NavLink>

          {batchId && (
            <>
              <NavLink
                to={`/student/batch/${batchId}`}
                className={({ isActive }) =>
                  `flex items-center gap-4 px-4 py-3 my-1 rounded-xl transition-all duration-200 ease-in-out ${
                    isActive
                      ? "bg-blue-700 text-white shadow-lg"
                      : "hover:bg-gray-100 dark:hover:bg-gray-700 text-black dark:text-white"
                  }`
                }
              >
                <FaChalkboardTeacher className="text-lg" />
                <span className="text-sm font-semibold tracking-wide">
                  My Course
                </span>
              </NavLink>

              <NavLink
                to={`/student/chat?type=forum&batch=${batchId}`}
                className={({ isActive }) =>
                  `flex items-center gap-4 px-4 py-3 my-1 rounded-xl transition-all duration-200 ease-in-out ${
                    isActive
                      ? "bg-blue-700 text-white shadow-lg"
                      : "hover:bg-gray-100 dark:hover:bg-gray-700 text-black dark:text-white"
                  }`
                }
              >
                <FaComments className="text-lg" />
                <span className="text-sm font-semibold tracking-wide">
                  Chat
                </span>
              </NavLink>

              <NavLink
                to="/student/reports"
                className={({ isActive }) =>
                  `flex items-center gap-4 px-4 py-3 my-1 rounded-xl transition-all duration-200 ease-in-out ${
                    isActive
                      ? "bg-blue-700 text-white shadow-lg"
                      : "hover:bg-gray-100 dark:hover:bg-gray-700 text-black dark:text-white"
                  }`
                }
              >
                <FaChartBar className="text-lg" />
                <span className="text-sm font-semibold tracking-wide">
                  Quiz Reports
                </span>
              </NavLink>
            </>
          )}

          <NavLink
            to="/student/settings"
            className={({ isActive }) =>
              `flex items-center gap-4 px-4 py-3 my-1 rounded-xl transition-all duration-200 ease-in-out ${
                isActive
                  ? "bg-blue-700 text-white shadow-lg"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700 text-black dark:text-white"
              }`
            }
          >
            <FaCog className="text-lg" />
            <span className="text-sm font-semibold tracking-wide">
              Profile
            </span>
          </NavLink>
          <NavLink
            to={`/student/project`}
            className={({ isActive }) =>
              `flex items-center gap-4 px-4 py-3 my-1 rounded-xl transition-all duration-200 ease-in-out ${
                isActive
                  ? "bg-blue-700 text-white shadow-lg"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700 text-black dark:text-white"
              }`
            }
          >
            <FaFileAlt className="text-lg" />
            <span className="text-sm font-semibold tracking-wide">
              Project
            </span>
          </NavLink>

          <NavLink
            to={`/student/theory`}
            className={({ isActive }) =>
              `flex items-center gap-4 px-4 py-3 my-1 rounded-xl transition-all duration-200 ease-in-out ${
                isActive
                  ? "bg-blue-700 text-white shadow-lg"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700 text-black dark:text-white"
              }`
            }
          >
            <FaFileAlt className="text-lg" />
            <span className="text-sm font-semibold tracking-wide">
              Theory
            </span>
          </NavLink>
        </nav>

        {/* Logout */}
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
      {/* Main Content with Topbar */}
      <div className="flex-1 flex flex-col h-full bg-white dark:bg-black text-blue md:ml-64">
        <Topbar
          pageTitle={pageTitle}
          userName={student?.user?.name || "Student"}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          toggleSidebar={() => setSidebarOpen(!isSidebarOpen)}
        />
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

export default Sidebar;
