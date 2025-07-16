import React, { useState, useEffect } from "react";
import axios from "axios";

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
    const res = await axios.get("http://localhost:5001/api/students");
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


  return (
    <div className="p-4 bg-gradient-to-br from-white via-blue-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 min-h-[90%]">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Student Management</h1>
      </div>

      {/* Summary Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="bg-white dark:bg-gray-800 rounded shadow p-4 text-center border dark:border-gray-700">
          <h4 className="text-sm text-gray-500 dark:text-gray-400">Total Students</h4>
          <p className="text-xl font-semibold text-gray-900 dark:text-white">{filteredStudents.length}</p>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded shadow border dark:border-gray-700">
        <div className="flex justify-between items-center mb-4 gap-4">
          <input
            type="text"
            placeholder="Search students..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="flex-1 px-4 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
          />
          <div className="flex items-center gap-4">
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
        <table className="w-full text-sm text-left">
          <thead className="text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-600">
            <tr>
              <th className="py-2">Student Name</th>
              <th>Email</th>
              <th>Course</th>
              <th>Batch</th>
              <th className="py-2">Roll No</th>
              <th>Phone</th>
              <th>DOB</th>
            </tr>
          </thead>
          <tbody className="text-gray-700 dark:text-gray-300">
  {filteredStudents.length > 0 ? (
    filteredStudents.map((student, idx) => (
      <tr key={idx} className="border-t border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700">
        <td className="py-3">{student.user?.name}</td>
        <td>{student.user?.email}</td>
        <td>{student.course}</td>
        <td>{student.batch}</td>
        <td className="py-3 font-medium">{student.rollNo}</td>
        <td>{student.phone}</td>
        <td>{new Date(student.dob).toLocaleDateString()}</td>
      </tr>
    ))
  ) : (
    <tr>
      <td colSpan="6" className="text-center py-4 text-gray-500 dark:text-gray-400">
        No students found.
      </td>
    </tr>
  )}
</tbody>

        </table>
      </div>
    </div>
  );
};

export default Student;