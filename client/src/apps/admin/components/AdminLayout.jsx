import React, { useState, useEffect, useRef } from "react";
import { FaBook, FaClipboardCheck, FaFileAlt, FaComments, FaUser, FaHome } from "react-icons/fa";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import logo from "../assets/logo.JPG";
import API from "../api";
import axios from 'axios';

const AdminLayout = ({ children }) => {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const logoutRef = useRef(null);
  const [batchInfo, setBatchInfo] = useState(null);
  const [showLogout, setShowLogout] = useState(false);

  const menuItems = [
    { id: "home", label: "Home", icon: <FaHome />, path: "/" },
    { id: "lesson-plan", label: "Lesson Plan", icon: <FaBook />, path: `/batch/${batchId}/lesson-plan` },
    { id: "evaluation", label: "Evaluation", icon: <FaClipboardCheck />, path: `/batch/${batchId}/evaluation` },
    { id: "report", label: "Report", icon: <FaFileAlt />, path: `/batch/${batchId}/report` },
    { id: "chat", label: "Chat", icon: <FaComments />, path: `/batch/${batchId}/chat` },
  ];

  useEffect(() => {
    const fetchBatchDetails = async () => {
      try {
        const res = await API.get(`/admin-batches/${batchId}`);
        setBatchInfo(res.data);
      } catch (err) {
        console.error("Error fetching batch details:", err);
      }
    };
    if (batchId) fetchBatchDetails();
  }, [batchId]);

  const handleLogout = async () => {
  try {
    const token = localStorage.getItem("token");
    await axios.post(`${import.meta.env.VITE_LOGIN_API}/auth/logout`, null, {
      headers: { Authorization: `Bearer ${token}` },
    });
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = `${import.meta.env.VITE_FRONTEND_URL}/login`;
  } catch (err) {
    console.error("Logout failed:", err);
  }
};


  useEffect(() => {
    const handleClickOutside = (event) => {
      if (logoutRef.current && !logoutRef.current.contains(event.target)) {
        setShowLogout(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const renderBatchTitle = () => {
    if (!batchInfo) return "Loading...";
    const courseName = batchInfo?.course?.courseName || "Course";
    const batchName = batchInfo?.batchName || "Batch";
    const startDate = new Date(batchInfo?.startDate);
    const monthYear = startDate.toLocaleString('default', { month: 'short', year: 'numeric' });
    return `${courseName} - ${monthYear} - ${batchName}`;
  };

  return (
    <div className="flex h-screen bg-[#f8f9fc] font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-xl flex flex-col border-r">
        <div className="p-6 flex flex-col items-center">
          <img src={logo} alt="Logo" className="h-16 w-auto" />
        </div>
        <nav className="flex-1 space-y-1 mt-6">
          {menuItems.map(({ id, label, icon, path }) => (
            <NavLink
              key={id}
              to={path}
              className={({ isActive }) =>
                `flex items-center gap-4 px-5 py-3 transition rounded-md font-medium ${
                  isActive
                    ? "bg-[#e0f2fe] text-blue-800"
                    : "text-gray-700 hover:bg-gray-100"
                }`
              }
            >
              <div className="text-lg">{icon}</div>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="bg-white px-10 py-5 border-b shadow-sm flex justify-between items-center">
          <h2 className="font-semibold text-2xl text-gray-800">{renderBatchTitle()}</h2>
          <div className="relative" ref={logoutRef}>
            <button
              onClick={() => setShowLogout(prev => !prev)}
              className="flex items-center gap-2 text-gray-700 hover:text-gray-900 focus:outline-none"
            >
              <span className="text-sm font-medium">Admin</span>
              <FaUser size={20} />
            </button>
            {showLogout && (
              <div className="absolute right-0 mt-2 w-32 bg-white border rounded-md shadow-lg z-50">
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="p-10 bg-[#f9fbfd] flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
