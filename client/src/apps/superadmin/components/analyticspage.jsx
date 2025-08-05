import React, { useState, useEffect } from "react";
import API from "../api";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function AnalyticsPage() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalAdmins: 0,
    courses: {},
    adminSpecializations: {},
  });

  const [leaderboard, setLeaderboard] = useState([]);
  const [courses, setCourses] = useState([]);
  const [course, setCourse] = useState("");
  const profilePic = "https://cdn-icons-png.flaticon.com/512/847/847969.png";

  useEffect(() => {
    const token = localStorage.getItem('token');
    API.get("/api/stats", { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setStats(res.data))
      .catch(err => console.error("Stats fetch error:", err));

    API.get("/api/courses/names", { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        setCourses(res.data);
        if (res.data.length > 0) setCourse(res.data[0]);
      })
      .catch(err => console.error("Course fetch error:", err));
  }, []);

  useEffect(() => {
    if (!course) return;
    const token = localStorage.getItem('token');
    API.get(`/api/tests/top/${course}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        const formatted = res.data.map(item => ({
          studentName: item.studentName,
          quizAvg: item.quizAvg,
          assignmentAvg: item.assignAvg,
          codeAvg: item.codeAvg,
          totalAvg: item.totalAvg
        }));
        setLeaderboard(formatted);
        console.log(formatted);
      })
      .catch(err => console.error("Leaderboard fetch error:", err));
  }, [course]);

  const courseData = {
    labels: Object.keys(stats.courses),
    datasets: [{
      data: Object.values(stats.courses),
      backgroundColor: ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4'],
    }]
  };

  const adminData = {
    labels: Object.keys(stats.adminSpecializations),
    datasets: [{
      data: Object.values(stats.adminSpecializations),
      backgroundColor: ['#6366F1', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#EC4899', '#84CC16'],
    }]
  };

  // Dynamic chart options that update with theme changes
  const [isDarkMode, setIsDarkMode] = useState(document.documentElement.classList.contains('dark'));
  
  // Listen for theme changes
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          setIsDarkMode(document.documentElement.classList.contains('dark'));
        }
      });
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, []);
  
  const chartOptions = {
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          boxWidth: 20,
          color: isDarkMode ? '#E5E7EB' : '#1E293B',
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            weight: 'bold'
          }
        }
      },
      tooltip: {
        backgroundColor: isDarkMode ? 'rgba(31, 41, 55, 0.95)' : 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: isDarkMode ? '#6B7280' : '#374151',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true
      }
    },
    responsive: true,
    maintainAspectRatio: false
  };

  // Ensure at least 3 slots in podium
  const top3 = [
    leaderboard[1] || null,
    leaderboard[0] || null,
    leaderboard[2] || null
  ];

  const others = leaderboard.slice(3);

  return (
    <div className="ml-2 p-6 bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 min-h-screen text-gray-900 dark:text-white">

      <div className="mb-8 text-center">
        <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Analytics Dashboard
        </h2>
        <p className="text-gray-600 dark:text-gray-400">Performance insights and statistics</p>
      </div>

      {/* Course Selector */}
      <div className="flex flex-wrap justify-center gap-2 mb-8 bg-gray-100 dark:bg-gray-800 p-2 rounded-2xl max-w-md mx-auto">
        {courses.map(c => (
          <button
            key={c}
            onClick={() => setCourse(c)}
            className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
              course === c 
                ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm" 
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Olympic Podium */}
      {leaderboard.length > 0 && (
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-center mb-8 text-gray-800 dark:text-gray-200">Top Performers</h3>
          <div className="flex justify-center items-end gap-4 sm:gap-8 h-72 mb-8">
            {top3.map((stu, idx) => {
              const position = idx === 1 ? 1 : idx === 0 ? 2 : 3;
              const lightColors = {
                1: 'from-yellow-400 to-yellow-600',
                2: 'from-gray-300 to-gray-500', 
                3: 'from-orange-400 to-orange-600'
              };
              const darkColors = {
                1: 'dark:from-yellow-500 dark:to-yellow-700',
                2: 'dark:from-slate-500 dark:to-slate-700', 
                3: 'dark:from-orange-500 dark:to-orange-700'
              };
              return (
                <div
                  key={idx}
                  className={`flex flex-col items-center justify-end flex-1 max-w-[120px] sm:max-w-[160px] ${
                    idx === 1 ? 'h-64' : idx === 0 ? 'h-48' : 'h-40'
                  } bg-gradient-to-t ${lightColors[position]} ${darkColors[position]} rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-2 sm:p-4 relative`}
                >
                  {stu ? (
                    <>
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                          position === 1 ? 'bg-yellow-500 dark:bg-yellow-600' : 
                          position === 2 ? 'bg-gray-400 dark:bg-slate-600' : 
                          'bg-orange-500 dark:bg-orange-600'
                        }`}>
                          {position}
                        </div>
                      </div>
                      <img src={profilePic} className="w-12 h-12 sm:w-16 sm:h-16 rounded-full mb-1 sm:mb-3 border-4 border-white shadow-md" alt="profile" />
                      <p className="text-xs sm:text-sm font-bold text-center text-white mb-1 leading-tight">{stu.studentName}</p>
                      <p className="text-lg sm:text-xl font-bold text-white mb-1">{stu.totalAvg.toFixed(1)}%</p>
                      <div className="text-xs text-white/80 bg-black/20 px-1 sm:px-2 py-0.5 sm:py-1 rounded-full">
                        Rank #{position}
                      </div>
                    </>
                  ) : (
                    <div className="text-white/60 text-xs sm:text-sm mt-auto">No data</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Remaining Students */}
      <div className="max-w-2xl mx-auto mb-12">
        {others.map((stu, idx) => (
          <div key={idx} className="flex items-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-6 py-4 mb-3 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm mr-4">
              {idx + 4}
            </div>
            <img src={profilePic} className="w-12 h-12 rounded-full mr-4 border-2 border-gray-200 dark:border-gray-600" alt="Profile" />
            <div className="flex-grow">
              <div className="font-semibold text-gray-900 dark:text-white">{stu.studentName}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Student</div>
            </div>
            <div className="text-right">
              <div className="font-bold text-blue-600 dark:text-blue-400 text-lg">{stu.totalAvg.toFixed(1)}%</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Average Score</div>
            </div>
          </div>
        ))}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <div className="bg-white dark:bg-gray-800 border border-blue-100 dark:border-gray-700 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 group">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300">Total Students</h3>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
              </svg>
            </div>
          </div>
          <p className="text-4xl font-bold text-blue-700 dark:text-blue-400">{stats.totalStudents}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Active learners</p>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-green-100 dark:border-gray-700 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 group">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-green-900 dark:text-green-300">Total Admins</h3>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
          </div>
          <p className="text-4xl font-bold text-green-700 dark:text-green-400">{stats.totalLecturers}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Teaching staff</p>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-purple-100 dark:border-gray-700 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 group">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-300">Total Courses</h3>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M12 14l9-5-9-5-9 5 9 5z"/>
              </svg>
            </div>
          </div>
          <p className="text-4xl font-bold text-purple-700 dark:text-purple-400">{stats.totalCourses}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Available programs</p>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-orange-100 dark:border-gray-700 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 group">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-orange-900 dark:text-orange-300">Total Batches</h3>
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
          </div>
          <p className="text-4xl font-bold text-orange-700 dark:text-orange-400">{stats.totalBatches}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Active cohorts</p>
        </div>
      </div>

      {/* Pie Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-12">
        <div className="bg-white dark:bg-gray-800 border border-blue-100 dark:border-gray-700 rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-blue-900 dark:text-blue-300 mb-4 text-center">Courses Opted</h3>
          <div className="w-full h-80 flex items-center justify-center">
            <Pie data={courseData} options={chartOptions} />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-blue-100 dark:border-gray-700 rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-blue-900 dark:text-blue-300 mb-4 text-center">Admin Specializations</h3>
          <div className="w-full h-80 flex items-center justify-center">
            <Pie data={adminData} options={chartOptions} />
          </div>
        </div>
      </div>
    </div>
  );
}