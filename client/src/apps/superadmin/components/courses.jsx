import React, { useEffect, useState } from "react";
import API from "../api";
import { 
  FaPlus, FaEdit, FaTrash, FaBook, 
  FaChalkboardTeacher, FaUsers, FaClock,
  FaSearch, FaFilter, FaTimes, FaCheckCircle,
  FaGraduationCap, FaLayerGroup
} from "react-icons/fa";
import { MdOutlineMenuBook } from "react-icons/md";
import { toast, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import fullstack from '../assets/fullstack.jpg';
import dataanalytics from '../assets/dataanalytics.jpg';
import { GridLoading, CardSkeleton, FadeIn, SlideUp, LoadingSpinner } from "../../../shared/LoadingComponents";

const CoursesSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800">
    <div className="p-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <div className="h-8 w-48 bg-slate-200 dark:bg-gray-700 rounded-lg animate-pulse mb-2"></div>
          <div className="h-4 w-64 bg-slate-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
        <div className="h-12 w-36 bg-slate-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="border dark:border-gray-700 p-6 rounded-xl shadow bg-white dark:bg-gray-800">
            <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-3"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-2/3 mb-4"></div>
            <div className="flex justify-end gap-2 mt-4">
              <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-16"></div>
              <div className="h-8 bg-red-300 rounded w-16"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newCourseName, setNewCourseName] = useState("");
  const [newModules, setNewModules] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editCourseId, setEditCourseId] = useState(null);
  const [courseToDelete, setCourseToDelete] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        await new Promise(resolve => setTimeout(resolve, 700));
        await fetchCourses();
      } catch (err) {
        setError("Failed to load courses. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    filterAndSortCourses();
  }, [courses, searchTerm, sortBy, sortOrder]);

  const fetchCourses = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await API.get("/api/courses", { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      // Fetch batch counts for each course
      const coursesWithStats = await Promise.all(
        (res.data || []).map(async (course) => {
          try {
            const batchRes = await API.get(`/api/batches/course/${course._id}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            return {
              ...course,
              batchCount: batchRes.data?.count || 0,
              studentCount: batchRes.data?.studentCount || 0
            };
          } catch (err) {
            return { ...course, batchCount: 0, studentCount: 0 };
          }
        })
      );
      
      setCourses(coursesWithStats);
      setFilteredCourses(coursesWithStats);
    } catch (err) {
      console.error("Error fetching courses:", err);
      throw err;
    }
  };

  const filterAndSortCourses = () => {
    let filtered = [...courses];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(course =>
        course.courseName?.toLowerCase().includes(term) ||
        course.modules?.some(module => module.toLowerCase().includes(term))
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aVal, bVal;
      
      if (sortBy === 'name') {
        aVal = a.courseName || '';
        bVal = b.courseName || '';
      } else if (sortBy === 'batches') {
        aVal = a.batchCount || 0;
        bVal = b.batchCount || 0;
      } else if (sortBy === 'modules') {
        aVal = a.modules?.length || 0;
        bVal = b.modules?.length || 0;
      }

      if (typeof aVal === 'string') {
        return sortOrder === 'asc' 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      } else {
        return sortOrder === 'asc' 
          ? aVal - bVal
          : bVal - aVal;
      }
    });

    setFilteredCourses(filtered);
  };

  const handleSaveCourse = () => {
    const courseData = {
      courseName: newCourseName.trim(),
      modules: newModules.split(',').map(mod => mod.trim()).filter(mod => mod),
    };

    if (!courseData.courseName || courseData.modules.length === 0) {
      toast.error("Please enter all required fields.");
      return;
    }

    const token = localStorage.getItem('token');
    const request = isEditing
      ? API.put(`/api/courses/${editCourseId}`, courseData, { headers: { Authorization: `Bearer ${token}` } })
      : API.post("/api/courses", courseData, { headers: { Authorization: `Bearer ${token}` } });

    request
      .then(() => {
        fetchCourses();
        resetForm();
        toast.success(
          <div className="flex items-center gap-2">
            <FaCheckCircle className="text-green-500" />
            <span>{isEditing ? "Course updated successfully" : "Course added successfully"}</span>
          </div>
        );
      })
      .catch(err => {
        console.error(err);
        toast.error("Operation failed");
      });
  };

  const resetForm = () => {
    setNewCourseName("");
    setNewModules("");
    setEditCourseId(null);
    setIsEditing(false);
    setShowModal(false);
  };

  const handleEditCourse = (course) => {
    setNewCourseName(course.courseName);
    setNewModules(course.modules.join(', '));
    setEditCourseId(course._id);
    setIsEditing(true);
    setShowModal(true);
  };

  const confirmDelete = (course) => {
    setCourseToDelete(course);
    setShowDeleteModal(true);
  };

  const handleDeleteCourse = () => {
    if (!courseToDelete) return;
    
    const token = localStorage.getItem('token');
    API.delete(`/api/courses/${courseToDelete._id}`, { 
      headers: { Authorization: `Bearer ${token}` } 
    })
      .then(() => {
        fetchCourses();
        setShowDeleteModal(false);
        setCourseToDelete(null);
        toast.success("Course deleted successfully");
      })
      .catch(err => {
        console.error("Error deleting course:", err);
        toast.error("Failed to delete course");
      });
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-IN').format(num || 0);
  };

  if (loading) return <CoursesSkeleton />;

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800">
        <div className="p-6">
          <FadeIn>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Course Management</h2>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-8 text-center max-w-2xl mx-auto">
              <div className="text-red-600 dark:text-red-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-red-800 dark:text-red-200 mb-3">Error Loading Courses</h3>
              <p className="text-red-600 dark:text-red-400 mb-6">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800">
      <ToastContainer 
        position="top-right" 
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
      
      <div className="p-6">
        <SlideUp>
          {/* Header Section */}
          <FadeIn delay={100}>
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                  Course Management
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2 flex items-center gap-2">
                  <FaGraduationCap className="text-blue-500" />
                  Total {courses.length} courses • {courses.reduce((acc, c) => acc + (c.modules?.length || 0), 0)} modules
                </p>
              </div>
              
              <button
                onClick={() => {
                  resetForm();
                  setShowModal(true);
                }}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <FaPlus className="text-lg" />
                <span className="hidden sm:inline">Add New Course</span>
              </button>
            </div>
          </FadeIn>

          {/* Search and Filter Section */}
          <FadeIn delay={200}>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5 mb-8 border border-gray-200 dark:border-gray-700">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1 relative">
                  <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search courses by name or module..."
                    className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <FaTimes
                      onClick={() => setSearchTerm("")}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                    />
                  )}
                </div>
{/*                 
                <div className="flex gap-3">
                  <div className="relative min-w-[140px]">
                    <button
                      onClick={() => handleSort('name')}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-white flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                    >
                      <span>Sort by Name</span>
                      {sortBy === 'name' && (
                        sortOrder === 'asc' ? <FaPlus className="rotate-90" /> : <FaPlus className="-rotate-90" />
                      )}
                    </button>
                  </div>
                  <div className="relative min-w-[140px]">
                    <button
                      onClick={() => handleSort('batches')}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-white flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                    >
                      <span>Sort by Batches</span>
                      {sortBy === 'batches' && (
                        sortOrder === 'asc' ? <FaPlus className="rotate-90" /> : <FaPlus className="-rotate-90" />
                      )}
                    </button>
                  </div>
                </div> */}
              </div>
            </div>
          </FadeIn>

          {/* Stats Cards */}
          <FadeIn delay={250}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all transform hover:scale-105">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <FaGraduationCap className="text-2xl text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Courses</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{courses.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all transform hover:scale-105">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <FaLayerGroup className="text-2xl text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Modules</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {courses.reduce((acc, c) => acc + (c.modules?.length || 0), 0)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all transform hover:scale-105">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <FaChalkboardTeacher className="text-2xl text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Batches</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {courses.reduce((acc, c) => acc + (c.batchCount || 0), 0)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all transform hover:scale-105">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                    <FaUsers className="text-2xl text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Students</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {courses.reduce((acc, c) => acc + (c.studentCount || 0), 0)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>

          {/* Course Cards */}
          <FadeIn delay={300}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.length > 0 ? (
                filteredCourses.map((course, index) => (
                  <SlideUp key={course._id} delay={400 + (index * 100)}>
                    <div className="group bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-2xl transition-all duration-300 hover:scale-105">
                      {/* Card Header with Gradient */}
                      <div className="h-24 bg-gradient-to-r from-blue-500 to-blue-700 relative">
                        <div className="absolute -bottom-12 left-6">
                          <div className="w-20 h-20 rounded-xl bg-white dark:bg-gray-800 shadow-lg flex items-center justify-center border-4 border-white dark:border-gray-800">
                            <FaBook className="text-3xl text-blue-600 dark:text-blue-400" />
                          </div>
                        </div>
                        <div className="absolute top-4 right-4">
                          <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs rounded-full border border-white/30">
                            Active
                          </span>
                        </div>
                      </div>

                      {/* Card Content */}
                      <div className="pt-14 p-6">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                              {course.courseName}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <FaLayerGroup className="text-blue-500 text-sm" />
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {course.modules?.length || 0} Modules
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-3 mt-4">
                          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                            <div className="flex items-center gap-2">
                              <FaChalkboardTeacher className="text-blue-600 dark:text-blue-400" />
                              <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Batches</p>
                                <p className="text-lg font-bold text-gray-900 dark:text-white">
                                  {formatNumber(course.batchCount)}
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                            <div className="flex items-center gap-2">
                              <FaUsers className="text-green-600 dark:text-green-400" />
                              <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Students</p>
                                <p className="text-lg font-bold text-gray-900 dark:text-white">
                                  {formatNumber(course.studentCount)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Modules Preview */}
                        <div className="mt-4">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Key Modules:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {course.modules?.slice(0, 3).map((module, i) => (
                              <span 
                                key={i} 
                                className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 px-2 py-1 rounded-full"
                              >
                                {module}
                              </span>
                            ))}
                            {(course.modules?.length || 0) > 3 && (
                              <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-full">
                                +{course.modules.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                          <button
                            className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors flex items-center gap-2 text-sm font-medium"
                            onClick={() => handleEditCourse(course)}
                          >
                            <FaEdit /> Edit
                          </button>
                          <button
                            className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 transition-colors flex items-center gap-2 text-sm font-medium"
                            onClick={() => confirmDelete(course)}
                          >
                            <FaTrash /> Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </SlideUp>
                ))
              ) : (
                <div className="col-span-full text-center py-16">
                  <FaBook className="text-6xl text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 text-lg">No courses found matching your criteria</p>
                </div>
              )}
            </div>
          </FadeIn>
        </SlideUp>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <SlideUp>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 rounded-t-2xl">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-white">
                    {isEditing ? 'Edit Course' : 'Add New Course'}
                  </h3>
                  <button
                    onClick={resetForm}
                    className="text-white/80 hover:text-white text-2xl transition-colors"
                  >
                    ×
                  </button>
                </div>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleSaveCourse(); }} className="p-8 space-y-6">
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Course Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Full Stack Development"
                      value={newCourseName}
                      onChange={(e) => setNewCourseName(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Modules <span className="text-red-500">*</span>
                      <span className="text-xs text-gray-500 ml-2">(comma separated)</span>
                    </label>
                    <textarea
                      placeholder="e.g., HTML, CSS, JavaScript, React, Node.js"
                      value={newModules}
                      onChange={(e) => setNewModules(e.target.value)}
                      rows="4"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      required
                    />
                    {newModules && (
                      <p className="text-xs text-gray-500 mt-2">
                        {newModules.split(',').filter(m => m.trim()).length} modules entered
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="submit"
                    className="flex-1 py-3 px-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg"
                  >
                    {isEditing ? 'Update Course' : 'Add Course'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </SlideUp>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && courseToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <SlideUp>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="bg-gradient-to-r from-red-500 to-red-600 p-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <FaTrash /> Confirm Deletion
                </h3>
              </div>

              <div className="p-6">
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Are you sure you want to delete the course <span className="font-semibold">"{courseToDelete.courseName}"</span>?
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  This will also affect {courseToDelete.batchCount || 0} batches and {courseToDelete.studentCount || 0} students enrolled in this course.
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={handleDeleteCourse}
                    className="flex-1 py-3 px-4 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg font-medium transition-all transform hover:scale-105 shadow-lg"
                  >
                    Yes, Delete
                  </button>
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setCourseToDelete(null);
                    }}
                    className="flex-1 py-3 px-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </SlideUp>
        </div>
      )}
    </div>
  );
};

export default Courses;