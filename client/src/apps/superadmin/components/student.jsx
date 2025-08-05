import React, { useState, useEffect } from "react";
import API from "../api";
import { TableLoading, FadeIn, SlideUp, LoadingSpinner } from "../../../shared/LoadingComponents";

const StudentSkeleton = () => (
  <div className="p-4 bg-gradient-to-br from-white via-blue-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 min-h-[90%] animate-pulse">
    <div className="flex justify-between items-center mb-6">
      <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/3"></div>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4">
      <div className="bg-white dark:bg-gray-800 rounded shadow p-4 text-center border dark:border-gray-700">
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-2/3 mx-auto mb-2"></div>
        <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-1/3 mx-auto"></div>
      </div>
    </div>
    <div className="bg-white dark:bg-gray-800 p-4 rounded shadow border dark:border-gray-700 mb-4">
      <div className="flex flex-wrap gap-4 items-center">
        <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded flex-1 min-w-[200px]"></div>
        <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded w-32"></div>
        <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded w-32"></div>
        <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded w-32"></div>
      </div>
    </div>
    <div className="bg-white dark:bg-gray-800 p-4 rounded shadow border dark:border-gray-700">
      <table className="w-full text-sm text-left">
        <thead className="text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-600">
          <tr>
            <th className="py-2"><div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-16"></div></th>
            <th className="py-2"><div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-24"></div></th>
            <th><div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-20"></div></th>
            <th><div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-16"></div></th>
            <th><div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-16"></div></th>
            <th><div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-16"></div></th>
            <th><div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-16"></div></th>
          </tr>
        </thead>
        <tbody className="text-gray-700 dark:text-gray-300">
          {[...Array(5)].map((_, i) => (
            <tr key={i} className="border-t border-gray-200 dark:border-gray-600">
              <td className="py-3"><div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-12"></div></td>
              <td className="py-3"><div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-20"></div></td>
              <td><div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-16"></div></td>
              <td><div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-12"></div></td>
              <td><div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-12"></div></td>
              <td><div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-12"></div></td>
              <td><div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-12"></div></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="md:hidden grid grid-cols-1 gap-4 mt-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
            <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-1"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full mb-1"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2 mb-1"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/3"></div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const Student = () => {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("All");
  const [selectedBatch, setSelectedBatch] = useState("All");
  const [selectedYear, setSelectedYear] = useState("All");
  const [uniqueCourses, setUniqueCourses] = useState([]);
  const [uniqueBatches, setUniqueBatches] = useState([]);
  const [uniqueYears, setUniqueYears] = useState([]);
  const [filteredBatches, setFilteredBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  // Helper function to extract year from batch name
  const getYearFromBatchName = (batchName) => {
    if (!batchName) return null;
    const parts = batchName.split("-");
    if (parts.length >= 2) {
      const monthYear = parts[1];
      return monthYear.slice(-2); // Get last 2 characters
    }
    return null;
  };

  // Helper function to get course prefix from batch name
  const getCourseFromBatchName = (batchName) => {
    if (!batchName) return null;
    const parts = batchName.split("-");
    return parts[0]; // First part is course code (FS, DS, etc.)
  };

  // Course code to full name mapping
  const courseMapping = {
    "FS": "Full Stack Development",
    "DS": "Data Science", 
    "DA": "Data Analytics",
    "TT": "Tech Trio"
  };

  const fetchStudents = async () => {
  try {
    setLoading(true);
    setError(null);
    // Add a small delay to show loading animation
    await new Promise(resolve => setTimeout(resolve, 800));
    const token = localStorage.getItem("token");
    const res = await API.get("/api/students", {
      headers: { Authorization: `Bearer ${token}` }
    });
    const studentList = res.data;

    setStudents(studentList);
    setFilteredStudents(studentList);

    const courses = [...new Set(studentList.map((s) => s.course))];
    const batches = [...new Set(studentList.map((s) => s.batch))];

    // Extract years from batch names
    const years = [
      ...new Set(studentList.map(s => getYearFromBatchName(s.batch)).filter(Boolean))
    ].sort((a, b) => b.localeCompare(a)); // Sort descending

    setUniqueCourses(courses);
    setUniqueBatches(batches);
    setUniqueYears(years);
    setFilteredBatches(batches); // Initially show all batches
  } catch (err) {
    console.error("Failed to fetch students", err);
    setError("Failed to load students. Please try again.");
  } finally {
    setLoading(false);
  }
};

// Update filtered batches when course selection changes
useEffect(() => {
  updateFilteredBatches();
}, [selectedCourse, uniqueBatches]);

useEffect(() => {
  filterStudents();
}, [searchText, selectedCourse, selectedBatch, selectedYear, students]);

const updateFilteredBatches = () => {
  if (selectedCourse === "All") {
    setFilteredBatches(uniqueBatches);
  } else {
    // Find the course code for the selected course
    const courseCode = Object.keys(courseMapping).find(
      code => courseMapping[code] === selectedCourse
    );
    
    if (courseCode) {
      const courseBatches = uniqueBatches.filter(batch => 
        getCourseFromBatchName(batch) === courseCode
      );
      setFilteredBatches(courseBatches);
    } else {
      setFilteredBatches([]);
    }
  }
  
  // Reset batch selection when course changes
  setSelectedBatch("All");
};

const filterStudents = () => {
  const filtered = students.filter((student) => {
    const nameMatch = student.user?.name
      ?.toLowerCase()
      .includes(searchText.toLowerCase());
    const courseMatch = selectedCourse === "All" || student.course === selectedCourse;
    const batchMatch = selectedBatch === "All" || student.batch === selectedBatch;
    
    // Year filter logic
    const studentYear = getYearFromBatchName(student.batch);
    const yearMatch = selectedYear === "All" || studentYear === selectedYear;

    return nameMatch && courseMatch && batchMatch && yearMatch;
  });
  setFilteredStudents(filtered);
};


  if (loading) {
    return (
      <StudentSkeleton />
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-gradient-to-br from-white via-blue-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 min-h-[90%]">
        <FadeIn>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Student Management</h1>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
            <div className="text-red-600 dark:text-red-400 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">Error Loading Students</h3>
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <button 
              onClick={fetchStudents}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
            >
              Try Again
            </button>
          </div>
        </FadeIn>
      </div>
    );
  }

  if (loading) return <StudentSkeleton />;

  return (
    <SlideUp className="p-2 sm:p-4 bg-gradient-to-br from-white via-blue-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 min-h-[90%]">
      <FadeIn delay={100}>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Student Management</h1>
        </div>
      </FadeIn>

      {/* Summary Card */}
      <FadeIn delay={200}>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-white dark:bg-gray-800 rounded shadow p-4 text-center border dark:border-gray-700 hover:shadow-lg transition-shadow duration-300">
            <h4 className="text-sm text-gray-500 dark:text-gray-400">Total Students</h4>
            <p className="text-xl font-semibold text-gray-900 dark:text-white">{filteredStudents.length}</p>
          </div>
        </div>
      </FadeIn>

      {/* Filter & Search */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded shadow border dark:border-gray-700">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-2 sm:gap-4">
          <input
            type="text"
            placeholder="Search students..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full sm:flex-1 px-4 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
          />
          <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-4 w-full sm:w-auto">
  {/* Course Dropdown */}
  <div className="relative">
    <select
      value={selectedCourse}
      onChange={(e) => setSelectedCourse(e.target.value)}
      className="appearance-none px-4 py-2 pr-8 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <option value="All">All Courses</option>
      {uniqueCourses.map((course, idx) => (
        <option key={idx} value={course}>{course}</option>
      ))}
    </select>
    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500 dark:text-gray-400">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  </div>

  {/* Batch Dropdown */}
  <div className="relative">
    <select
      value={selectedBatch}
      onChange={(e) => setSelectedBatch(e.target.value)}
      className="appearance-none px-4 py-2 pr-8 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <option value="All">All Batches</option>
      {filteredBatches.map((batch, idx) => (
        <option key={idx} value={batch}>{batch}</option>
      ))}
    </select>
    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500 dark:text-gray-400">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  </div>

  {/* Year Dropdown */}
  <div className="relative">
    <select
      value={selectedYear}
      onChange={(e) => setSelectedYear(e.target.value)}
      className="appearance-none px-4 py-2 pr-8 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <option value="All">All Years</option>
      {uniqueYears.map((year, idx) => (
        <option key={idx} value={year}>20{year}</option>
      ))}
    </select>
    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500 dark:text-gray-400">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  </div>
</div>

        </div>

        {/* Table */}
        <table className="w-full text-sm text-left hidden md:table">
          <thead className="text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-600">
            <tr>
              <th className="py-2 whitespace-nowrap">Roll No</th>
              <th className="py-2 whitespace-nowrap">Student Name</th>
              <th className="whitespace-nowrap">Email</th>
              <th>Course</th>
              <th>Batch</th>
              <th>Phone</th>
              <th>DOB</th>
            </tr>
          </thead>
          <tbody className="text-gray-700 dark:text-gray-300">
  {filteredStudents.length > 0 ? (
    filteredStudents.map((student, idx) => (
      <tr key={idx} className="border-t border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700">
        <td className="py-3 font-medium">{student.rollNo}</td>
        <td className="py-3">{student.user?.name}</td>
        <td>{student.user?.email}</td>
        <td>{student.course}</td>
        <td>{student.batch}</td>
        <td>{student.phone}</td>
        <td>{new Date(student.dob).toLocaleDateString()}</td>
      </tr>
    ))
  ) : (
    <tr>
      <td colSpan="7" className="text-center py-4 text-gray-500 dark:text-gray-400">
        No students found.
      </td>
    </tr>
  )}
</tbody>

        </table>

        {/* Card View for Mobile */}
        <div className="md:hidden grid grid-cols-1 gap-4 mt-4">
          {filteredStudents.length > 0 ? (
            filteredStudents.map((student, idx) => (
              <div key={idx} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">Roll No: {student.rollNo}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{new Date(student.dob).toLocaleDateString()}</span>
                </div>
                <p className="text-lg font-bold text-blue-600 dark:text-blue-400 mb-1">{student.user?.name}</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">{student.user?.email}</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">Course: {student.course}</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">Batch: {student.batch}</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">Phone: {student.phone}</p>
              </div>
            ))
          ) : (
            <div className="text-center py-4 text-gray-500 dark:text-gray-400">
              No students found.
            </div>
          )}
        </div>
      </div>
    </SlideUp>
  );
};

export default Student;