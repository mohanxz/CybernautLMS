import React, { useEffect, useState } from "react";
import API from "../api";
import { FaPlus } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import fullstack from '../assets/fullstack.jpg';
import dataanalytics from '../assets/dataanalytics.jpg';
import { GridLoading, CardSkeleton, FadeIn, SlideUp, LoadingSpinner } from "../../../shared/LoadingComponents";




const CoursesSkeleton = () => (
  <div className="p-6 bg-gray-50 dark:bg-gray-900 space-y-8 h-[89vh] animate-pulse">
    <div className="flex justify-between items-center">
      <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/3"></div>
      <div className="h-10 bg-blue-400 rounded w-32"></div>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="border dark:border-gray-700 p-4 rounded-lg shadow bg-white dark:bg-gray-800">
          <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="flex justify-end gap-2 mt-4">
            <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-16"></div>
            <div className="h-8 bg-red-300 rounded w-16"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newCourseName, setNewCourseName] = useState("");
  const [newModules, setNewModules] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editCourseId, setEditCourseId] = useState(null);
  const [courseToDelete, setCourseToDelete] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


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

  const fetchCourses = async () => {
    try {
      const res = await API.get("/api/courses");
      if (Array.isArray(res.data)) setCourses(res.data);
    } catch (err) {
      console.error("Error fetching courses:", err);
      throw err;
    }
  };

  const handleSaveCourse = () => {
    const courseData = {
      courseName: newCourseName.trim(),
      modules: newModules.split(',').map(mod => mod.trim()),
    };

    if (!courseData.courseName || courseData.modules.length === 0) {
      toast.error("Please enter all required fields.");
      return;
    }

    const request = isEditing
      ? API.put(`/api/courses/${editCourseId}`, courseData)
      : API.post("/api/courses", courseData);

    request
      .then(() => {
        fetchCourses();
        resetForm();
        toast.success(isEditing ? "Course updated" : "Course added");
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

  const handleDeleteCourse = (id) => {
    if (!window.confirm("Are you sure you want to delete this course?")) return;
    API.delete(`/api/courses/${id}`)
      .then(() => {
        fetchCourses();
        toast.success("Course deleted");
      })
      .catch(err => {
        console.error("Error deleting course:", err);
        toast.error("Failed to delete course");
      });
  };

  if (loading) return <CoursesSkeleton />;

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 space-y-8 h-[89vh] text-blue-900">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Course Management</h1>
        <button
          onClick={() => {
            resetForm(); // Ensure clean form
            setShowModal(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
        >
          <FaPlus /> Add New Course
        </button>
      </div>

      {/* Course Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map(course => (
          <div key={course._id} className="border dark:border-gray-700 p-4 rounded-lg shadow bg-white dark:bg-gray-800">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">{course.courseName}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Modules: {course.modules.join(', ')}</p>
                <p className="mt-2 text-sm text-gray-700 dark:text-gray-300"><strong>Students:</strong> {course.students}</p>
              </div>
              <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 px-2 py-1 rounded-full">Active</span>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
                onClick={() => handleEditCourse(course)}
              >
                Edit
              </button>
              <button
                className="px-3 py-1 text-sm bg-red-200 text-red-800 rounded hover:bg-red-300"
                onClick={() => handleDeleteCourse(course._id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
  <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40">
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md space-y-4">
      <h2 className="text-xl font-bold text-blue-700 dark:text-blue-300">
        {isEditing ? "Edit Course" : "Add New Course"}
      </h2>
      <input
        type="text"
        placeholder="Course Name"
        value={newCourseName}
        onChange={(e) => setNewCourseName(e.target.value)}
        className="w-full border border-gray-300 dark:border-gray-600 px-3 py-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
      />
      <input
        type="text"
        placeholder="Modules (comma separated)"
        value={newModules}
        onChange={(e) => setNewModules(e.target.value)}
        className="w-full border border-gray-300 dark:border-gray-600 px-3 py-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
      />
      <div className="flex justify-end gap-4">
        <button
          onClick={() => setShowModal(false)}
          className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white rounded hover:bg-gray-400 dark:hover:bg-gray-500"
        >
          Cancel
        </button>
        <button
          onClick={handleSaveCourse}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
        >
          {isEditing ? "Update Course" : "Add Course"}
        </button>
      </div>
    </div>
  </div>
)}


      <ToastContainer />
    </div>
  );
};

export default Courses;
