import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import axios from 'axios';
import { FaUser, FaUsers, FaBook, FaFolderPlus, FaMoneyBill } from 'react-icons/fa';
import { StatCardSkeleton, SystemOverviewSkeleton, FadeIn, SlideUp, LoadingSpinner } from "../../../shared/LoadingComponents";


ChartJS.register(ArcElement, Tooltip, Legend);

const Home = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
  totalStudents: 0,
  totalLecturers: 0,
  activeBatches: 0,
});

const [overview, setOverview] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Add delay to show loading animation
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Fetch both overview and stats
      const [overviewRes, statsRes] = await Promise.all([
        axios.get("http://localhost:5001/api/system/overview"),
        axios.get('http://localhost:5001/api/stats')
      ]);
      
      setOverview(overviewRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.error("Failed to load data", err);
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, []);

  

  if (loading) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900 min-h-screen p-4">
        <div className="max-w-screen mx-auto">
          <FadeIn>
            {/* Header Section */}
            <div className="mb-10 ml-2">
              <div className="text-center md:text-left">
                <h1 className="text-3xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  Welcome, Super Admin
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-400 mb-4 max-w-3xl">
                  Manage your institution's learning ecosystem from this central dashboard. Monitor performance, manage resources, and drive educational excellence.
                </p>
              </div>
            </div>

            {/* Loading Metric Cards */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 mb-5">
              <div className="flex items-center mb-8">
                <div className="w-3 h-8 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full mr-4"></div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">System Statistics</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
              </div>
            </div>

            {/* Loading Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 mb-5">
              <div className="flex items-center mb-8">
                <div className="w-3 h-8 bg-gradient-to-b from-green-500 to-green-600 rounded-full mr-4"></div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Quick Actions</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-6 animate-pulse">
                    <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded mb-3 mx-auto"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4 mx-auto"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Loading System Overview */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
              <div className="flex items-center mb-8">
                <div className="w-3 h-8 bg-gradient-to-b from-red-500 to-red-600 rounded-full mr-4"></div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">System Overview</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <SystemOverviewSkeleton />
                <SystemOverviewSkeleton />
                <SystemOverviewSkeleton />
                <SystemOverviewSkeleton />
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900 min-h-screen p-4">
        <div className="max-w-screen mx-auto">
          <FadeIn>
            <div className="mb-10 ml-2">
              <div className="text-center md:text-left">
                <h1 className="text-3xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  Welcome, Super Admin
                </h1>
              </div>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
              <div className="text-red-600 dark:text-red-400 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">Error Loading Dashboard</h3>
              <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
              >
                Try Again
              </button>
            </div>
          </FadeIn>
        </div>
      </div>
    );
  }

  return (
    <SlideUp className="bg-gray-50 dark:bg-gray-900 min-h-screen p-4">
      <div className="max-w-screen mx-auto">
        {/* Header Section */}
        <FadeIn delay={100}>
          <div className="mb-10 ml-2">
            <div className="text-center md:text-left">
              <h1 className="text-3xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Welcome, Super Admin
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-400 mb-4 max-w-3xl">
                Manage your institution's learning ecosystem from this central dashboard. Monitor performance, manage resources, and drive educational excellence.
              </p>
            </div>
          </div>
        </FadeIn>

        {/* Metric Cards */}
        <FadeIn delay={200}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 mb-5 hover:shadow-2xl transition-shadow duration-300">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 flex items-center">
              <div className="w-3 h-8 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full mr-4"></div>
              System Statistics
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              <SlideUp delay={300}>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 rounded-xl p-6 text-center border border-blue-200 dark:border-blue-700 hover:scale-105 transition-transform duration-200">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <FaUser className="text-white text-lg" />
                  </div>
                  <h3 className="text-sm text-blue-700 dark:text-blue-400 font-medium mb-2">Total Lecturers</h3>
                  <p className="text-xl font-bold text-blue-700 dark:text-blue-300">{stats.totalLecturers}</p>
                </div>
              </SlideUp>
              <SlideUp delay={350}>
                <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 rounded-xl p-6 text-center border border-green-200 dark:border-green-700 hover:scale-105 transition-transform duration-200">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <FaFolderPlus className="text-white text-lg" />
                  </div>
                  <h3 className="text-sm text-green-700 dark:text-green-400 font-medium mb-2">Active Batches</h3>
                  <p className="text-xl font-bold text-green-700 dark:text-green-300">{stats.activeBatches}</p>
                </div>
              </SlideUp>
              <SlideUp delay={400}>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800 rounded-xl p-6 text-center border border-purple-200 dark:border-purple-700 hover:scale-105 transition-transform duration-200">
                  <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <FaUsers className="text-white text-lg" />
                  </div>
                  <h3 className="text-sm text-purple-700 dark:text-purple-400 font-medium mb-2">Total Students</h3>
                  <p className="text-xl font-bold text-purple-700 dark:text-purple-300">{stats.totalStudents}</p>
                </div>
              </SlideUp>
            </div>
          </div>
        </FadeIn>

        {/* Quick Actions */}
        <FadeIn delay={300}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 mb-5 hover:shadow-2xl transition-shadow duration-300">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 flex items-center">
              <div className="w-3 h-8 bg-gradient-to-b from-green-500 to-green-600 rounded-full mr-4"></div>
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <button 
              onClick={() => navigate("admins")} 
              className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 border border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 py-6 px-6 rounded-2xl font-semibold hover:from-blue-100 hover:to-blue-200 dark:hover:from-blue-800 dark:hover:to-blue-700 transition-all duration-200 flex flex-col items-center justify-center gap-3 hover:scale-105 hover:shadow-lg"
            >
              <FaUser className="text-2xl" />
              <span className="text-sm">Add New Lecturer</span>
            </button>
            <button 
              onClick={() => navigate("courses")} 
              className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-300 py-6 px-6 rounded-2xl font-semibold hover:from-green-100 hover:to-green-200 dark:hover:from-green-800 dark:hover:to-green-700 transition-all duration-200 flex flex-col items-center justify-center gap-3 hover:scale-105 hover:shadow-lg"
            >
              <FaBook className="text-2xl" />
              <span className="text-sm">Manage Courses</span>
            </button>
            <button 
              onClick={() => navigate("batches")} 
              className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800 border border-purple-200 dark:border-purple-700 text-purple-700 dark:text-purple-300 py-6 px-6 rounded-2xl font-semibold hover:from-purple-100 hover:to-purple-200 dark:hover:from-purple-800 dark:hover:to-purple-700 transition-all duration-200 flex flex-col items-center justify-center gap-3 hover:scale-105 hover:shadow-lg"
            >
              <FaFolderPlus className="text-2xl" />
              <span className="text-sm">Batch Management</span>
            </button>
            <button 
              onClick={() => navigate("salary")} 
              className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900 dark:to-orange-800 border border-orange-200 dark:border-orange-700 text-orange-700 dark:text-orange-300 py-6 px-6 rounded-2xl font-semibold hover:from-orange-100 hover:to-orange-200 dark:hover:from-orange-800 dark:hover:to-orange-700 transition-all duration-200 flex flex-col items-center justify-center gap-3 hover:scale-105 hover:shadow-lg"
            >
              <FaMoneyBill className="text-2xl" />
              <span className="text-sm">Pay Salary</span>
            </button>
          </div>
        </div>
        </FadeIn>

        {/* System Overview */}
        <FadeIn delay={400}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 hover:shadow-2xl transition-shadow duration-300">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 flex items-center">
              <div className="w-3 h-8 bg-gradient-to-b from-red-500 to-red-600 rounded-full mr-4"></div>
              System Overview
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <SlideUp delay={500}>
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-600 hover:shadow-lg transition-all duration-200">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Server Status</span>
                    <div className="w-4 h-4 bg-green-500 rounded-full shadow-sm animate-pulse"></div>
                  </div>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{overview?.serverStatus || "Online"}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">System operational</p>
                </div>
              </SlideUp>
              
              <SlideUp delay={550}>
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-600 hover:shadow-lg transition-all duration-200">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Database Health</span>
                    <div className={`w-4 h-4 rounded-full shadow-sm ${overview?.dbHealth === "healthy" ? "bg-green-500 animate-pulse" : "bg-red-500"}`}></div>
                  </div>
                  <p className={`text-2xl font-bold ${overview?.dbHealth === "healthy" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                    {overview?.dbHealth === "healthy" ? "Excellent" : "Unhealthy"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Connection stable</p>
                </div>
              </SlideUp>
              
              <SlideUp delay={600}>
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-600 hover:shadow-lg transition-all duration-200">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Active Sessions</span>
                    <div className="w-4 h-4 bg-blue-500 rounded-full shadow-sm"></div>
                  </div>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{overview?.activeSessions || "0"}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Users online</p>
                </div>
              </SlideUp>
            </div>
          </div>
        </FadeIn>
      </div>
    </SlideUp>
  );

};

export default Home;
