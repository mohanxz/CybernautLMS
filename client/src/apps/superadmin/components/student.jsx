import React, { useState, useEffect } from "react";
import API from "../api";
import { toast } from "react-toastify";
import {
  FaEdit,
  FaTrash,
  FaEye,
  FaPlus,
  FaSearch,
  FaFilter,
  FaTimes,
  FaSave,
  FaPhone,
  FaEnvelope,
  FaCalendar,
} from "react-icons/fa";
import { FadeIn, SlideUp } from "../../../shared/LoadingComponents";

const StudentSkeleton = () => (
  <div className="p-4 bg-gradient-to-br from-white via-blue-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 min-h-[90%] animate-pulse">
    <div className="flex justify-between items-center mb-6">
      <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/3"></div>
      <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded w-32"></div>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-gray-800 rounded shadow p-4 text-center border dark:border-gray-700"
        >
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-2/3 mx-auto mb-2"></div>
          <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-1/3 mx-auto"></div>
        </div>
      ))}
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
            {[...Array(7)].map((_, i) => (
              <th key={i} className="py-2">
                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-16"></div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[...Array(5)].map((_, i) => (
            <tr
              key={i}
              className="border-t border-gray-200 dark:border-gray-600"
            >
              {[...Array(7)].map((_, j) => (
                <td key={j} className="py-3">
                  <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-12"></div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const Info = ({ label, value }) => (
  <div className="text-sm">
    <p className="text-gray-500 dark:text-gray-400 font-medium">{label}</p>
    <p className="text-gray-800 dark:text-gray-200 mt-0.5 break-all">
      {value || "-"}
    </p>
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
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    dob: "",
    batch: "",
    course: "",
    address: "",
  });
  const [batches, setBatches] = useState([]);
  const [courses, setCourses] = useState([]);
  const [saving, setSaving] = useState(false);

  // Course code to full name mapping
  const courseMapping = {
    FS: "Full Stack Development",
    DS: "Data Science",
    DA: "Data Analytics",
    TT: "Tech Trio",
    FSD: "Full Stack Development",
    MERN: "MERN Stack",
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    updateFilteredBatches();
  }, [selectedCourse, uniqueBatches]);

  useEffect(() => {
    filterStudents();
  }, [searchText, selectedCourse, selectedBatch, selectedYear, students]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      await Promise.all([fetchStudents(), fetchBatches(), fetchCourses()]);
    } catch (err) {
      console.error("Failed to fetch initial data", err);
      setError("Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await API.get("/api/students", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const studentList = res.data;

      // Sort students by roll number
      const sortedStudents = studentList.sort(
        (a, b) => (a.rollNo || 0) - (b.rollNo || 0),
      );

      setStudents(sortedStudents);
      setFilteredStudents(sortedStudents);

      const courses = [...new Set(studentList.map((s) => s.course))];
      const batches = [...new Set(studentList.map((s) => s.batch))];

      // Extract years from batch names
      const years = [
        ...new Set(
          studentList.map((s) => getYearFromBatchName(s.batch)).filter(Boolean),
        ),
      ].sort((a, b) => b.localeCompare(a));

      setUniqueCourses(courses);
      setUniqueBatches(batches);
      setUniqueYears(years);
      setFilteredBatches(batches);
    } catch (err) {
      console.error("Failed to fetch students", err);
      throw err;
    }
  };

  const fetchBatches = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await API.get("/api/batches", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBatches(res.data);
    } catch (err) {
      console.error("Failed to fetch batches", err);
    }
  };

  const fetchCourses = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await API.get("/api/courses", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCourses(res.data);
    } catch (err) {
      console.error("Failed to fetch courses", err);
    }
  };

  const getYearFromBatchName = (batchName) => {
    if (!batchName) return null;
    const parts = batchName.split("-");
    if (parts.length >= 2) {
      const monthYear = parts[1];
      return monthYear.slice(-2);
    }
    return null;
  };

  const getCourseFromBatchName = (batchName) => {
    if (!batchName) return null;
    const parts = batchName.split("-");
    return parts[0];
  };

  const updateFilteredBatches = () => {
    if (selectedCourse === "All") {
      setFilteredBatches(uniqueBatches);
    } else {
      const courseCode = Object.keys(courseMapping).find(
        (code) => courseMapping[code] === selectedCourse,
      );

      if (courseCode) {
        const courseBatches = uniqueBatches.filter(
          (batch) => getCourseFromBatchName(batch) === courseCode,
        );
        setFilteredBatches(courseBatches);
      } else {
        setFilteredBatches([]);
      }
    }
    setSelectedBatch("All");
  };

  const filterStudents = () => {
    const filtered = students.filter((student) => {
      const nameMatch = student.user?.name
        ?.toLowerCase()
        .includes(searchText.toLowerCase());
      const emailMatch = student.user?.email
        ?.toLowerCase()
        .includes(searchText.toLowerCase());
      const searchMatch = searchText === "" || nameMatch || emailMatch;

      const courseMatch =
        selectedCourse === "All" || student.course === selectedCourse;
      const batchMatch =
        selectedBatch === "All" || student.batch === selectedBatch;

      const studentYear = getYearFromBatchName(student.batch);
      const yearMatch = selectedYear === "All" || studentYear === selectedYear;

      return searchMatch && courseMatch && batchMatch && yearMatch;
    });
    setFilteredStudents(filtered);
  };

  const handleAddClick = () => {
    setModalMode("add");
    setFormData({
      name: "",
      email: "",
      phone: "",
      dob: "",
      batch: "",
      course: "",
      address: "",
    });
    setIsAddEditModalOpen(true);
  };

  const handleEditClick = (student) => {
    setModalMode("edit");
    setSelectedStudent(student);
    setFormData({
      name: student.user?.name || "",
      email: student.user?.email || "",
      phone: student.phone || "",
      dob: student.dob ? new Date(student.dob).toISOString().split("T")[0] : "",
      batch: student.batch || "",
      course: student.course || "",
      address: student.address || "",
    });
    setIsAddEditModalOpen(true);
  };

  const handleViewClick = (student) => {
    setSelectedStudent(student);
    setIsViewModalOpen(true);
  };

  const handleDeleteClick = (student) => {
    setSelectedStudent(student);
    setIsDeleteModalOpen(true);
  };

  const handleFormChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async () => {
    // Validation
    if (
      !formData.name ||
      !formData.email ||
      !formData.phone ||
      !formData.dob ||
      !formData.batch
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    // Phone validation
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(formData.phone.replace(/\D/g, ""))) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem("token");

      if (modalMode === "add") {
        // For add mode, let the backend handle roll number assignment
        const studentData = [
          {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            dob: formData.dob,
            address: formData.address || "Not provided",
            batch: formData.batch,
            course: formData.course || "",
          },
        ];

        console.log("Sending student data:", studentData);

        const res = await API.post("/api/students/save-selected", studentData, {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log("Response from server:", res.data);

        // Check the response to see what roll number was assigned
        if (
          res.data.results &&
          res.data.results.added &&
          res.data.results.added.length > 0
        ) {
          const assignedRoll = res.data.results.added[0].rollNo;
          toast.success(
            ` Student ${formData.name} added successfully! Roll No: ${assignedRoll}`,
          );
        } else {
          toast.success(` Student ${formData.name} added successfully!`);
        }

        if (res.data.credentials && res.data.credentials.length > 0) {
          downloadCredentials(res.data.credentials);
        }
      } else {
        // Edit existing student - keep same roll number
        const updateData = {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          dob: formData.dob,
          address: formData.address || "Not provided",
          batch: formData.batch,
          course: formData.course || "",
          rollNo: selectedStudent.rollNo, // Keep the same roll number
        };

        await API.put(`/api/students/${selectedStudent._id}`, updateData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success(` Student ${formData.name} updated successfully!`);
      }

      // Refresh data
      await fetchStudents();
      setIsAddEditModalOpen(false);
    } catch (err) {
      console.error("Error saving student:", err);
      toast.error(err.response?.data?.error || "Error saving student");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      await API.delete(`/api/students/${selectedStudent._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success(
        ` Student ${selectedStudent.user?.name} deleted successfully!`,
      );
      await fetchStudents();
      setIsDeleteModalOpen(false);
    } catch (err) {
      console.error("Error deleting student:", err);
      toast.error(err.response?.data?.error || "Error deleting student");
    } finally {
      setSaving(false);
    }
  };

  const downloadCredentials = (credentials) => {
    try {
      const csvContent =
        "Name,Email,Password,Roll No\n" +
        credentials
          .map((c) => `${c.name},${c.email},${c.password},${c.rollNo}`)
          .join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "student_credentials.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading credentials:", err);
    }
  };

  const getBatchOptions = () => {
    if (selectedCourse === "All") {
      return batches;
    } else {
      const courseCode = Object.keys(courseMapping).find(
        (code) => courseMapping[code] === selectedCourse,
      );
      return batches.filter(
        (b) => getCourseFromBatchName(b.batchName) === courseCode,
      );
    }
  };

  if (loading) {
    return <StudentSkeleton />;
  }

  if (error) {
    return (
      <div className="p-4 bg-gradient-to-br from-white via-blue-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 min-h-[90%]">
        <FadeIn>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Student Management
            </h1>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
            <div className="text-red-600 dark:text-red-400 mb-4">
              <svg
                className="w-12 h-12 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
              Error Loading Students
            </h3>
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <button
              onClick={fetchInitialData}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
            >
              Try Again
            </button>
          </div>
        </FadeIn>
      </div>
    );
  }

  return (
    <>
      <SlideUp className="p-2 sm:p-4 bg-gradient-to-br from-white via-blue-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 min-h-[90%]">
        <FadeIn delay={100}>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Student Management
            </h1>
            {/* <button
              onClick={handleAddClick}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <FaPlus /> Add Student
            </button> */}
          </div>
        </FadeIn>

        {/* Summary Cards */}
        <FadeIn delay={200}>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-white dark:bg-gray-800 rounded shadow p-4 text-center border dark:border-gray-700 hover:shadow-lg transition-shadow">
              <h4 className="text-sm text-gray-500 dark:text-gray-400">
                Total Students
              </h4>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">
                {students.length}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded shadow p-4 text-center border dark:border-gray-700 hover:shadow-lg transition-shadow">
              <h4 className="text-sm text-gray-500 dark:text-gray-400">
                Total Batches
              </h4>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">
                {uniqueBatches.length}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded shadow p-4 text-center border dark:border-gray-700 hover:shadow-lg transition-shadow">
              <h4 className="text-sm text-gray-500 dark:text-gray-400">
                Total Courses
              </h4>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">
                {uniqueCourses.length}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded shadow p-4 text-center border dark:border-gray-700 hover:shadow-lg transition-shadow">
              <h4 className="text-sm text-gray-500 dark:text-gray-400">
                Active Batches
              </h4>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">
                {
                  batches.filter((b) => new Date(b.startDate) <= new Date())
                    .length
                }
              </p>
            </div>
          </div>
        </FadeIn>

        {/* Filter & Search */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded shadow border dark:border-gray-700">
          <div className="flex flex-col lg:flex-row justify-between items-center mb-4 gap-4">
            <div className="relative w-full lg:w-96">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex flex-wrap gap-3 w-full lg:w-auto">
              {/* Course Filter */}
              <div className="relative min-w-[160px]">
                <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" />
                <select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="w-full pl-10 pr-8 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-white appearance-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="All">All Courses</option>
                  {uniqueCourses.map((course, idx) => (
                    <option key={idx} value={course}>
                      {course}
                    </option>
                  ))}
                </select>
              </div>

              {/* Batch Filter */}
              <div className="relative min-w-[160px]">
                <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" />
                <select
                  value={selectedBatch}
                  onChange={(e) => setSelectedBatch(e.target.value)}
                  className="w-full pl-10 pr-8 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-white appearance-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="All">All Batches</option>
                  {filteredBatches.map((batch, idx) => (
                    <option key={idx} value={batch}>
                      {batch}
                    </option>
                  ))}
                </select>
              </div>

              {/* Year Filter */}
              <div className="relative min-w-[140px]">
                <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" />
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full pl-10 pr-8 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-white appearance-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="All">All Years</option>
                  {uniqueYears.map((year, idx) => (
                    <option key={idx} value={year}>
                      20{year}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Table View - Desktop */}
          <div className="overflow-x-auto hidden md:block">
            <table className="w-full text-sm text-left">
              <thead className="text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th className="py-2 px-2">Roll No</th>
                  <th className="py-2 px-2">Student Name</th>
                  <th className="py-2 px-2">Email</th>
                  <th className="py-2 px-2">Phone</th>
                  <th className="py-2 px-2">Course</th>
                  <th className="py-2 px-2">Batch</th>
                  <th className="py-2 px-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="text-gray-700 dark:text-gray-300">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student, idx) => (
                    <tr
                      key={idx}
                      className="border-t border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="py-3 px-2 font-medium">
                        {student.rollNo}
                      </td>
                      <td className="py-3 px-2">{student.user?.name}</td>
                      <td className="py-3 px-2">{student.user?.email}</td>
                      <td className="py-3 px-2">{student.phone || "-"}</td>
                      <td className="py-3 px-2">{student.course}</td>
                      <td className="py-3 px-2">{student.batch}</td>
                      <td className="py-3 px-2">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleViewClick(student)}
                            className="p-1.5 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
                            title="View"
                          >
                            <FaEye size={14} />
                          </button>
                          <button
                            onClick={() => handleEditClick(student)}
                            className="p-1.5 bg-yellow-100 text-yellow-600 rounded hover:bg-yellow-200 transition-colors"
                            title="Edit"
                          >
                            <FaEdit size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(student)}
                            className="p-1.5 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors"
                            title="Delete"
                          >
                            <FaTrash size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="7"
                      className="text-center py-8 text-gray-500 dark:text-gray-400"
                    >
                      No students found matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Card View - Mobile */}
          <div className="md:hidden grid grid-cols-1 gap-4 mt-4">
            {filteredStudents.length > 0 ? (
              filteredStudents.map((student, idx) => (
                <div
                  key={idx}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        Roll No: {student.rollNo}
                      </span>
                      <h3 className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        {student.user?.name}
                      </h3>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewClick(student)}
                        className="p-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
                      >
                        <FaEye size={14} />
                      </button>
                      <button
                        onClick={() => handleEditClick(student)}
                        className="p-2 bg-yellow-100 text-yellow-600 rounded hover:bg-yellow-200"
                      >
                        <FaEdit size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(student)}
                        className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200"
                      >
                        <FaTrash size={14} />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                    <FaEnvelope className="inline mr-2" /> {student.user?.email}
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                    <FaPhone className="inline mr-2" /> {student.phone || "-"}
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <FaCalendar className="inline mr-2" /> {student.course} -{" "}
                    {student.batch}
                  </p>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No students found matching your filters.
              </div>
            )}
          </div>
        </div>
      </SlideUp>

      {/* View Modal */}
      {isViewModalOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="flex justify-between items-center px-5 py-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                Student Details
              </h3>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition"
              >
                <FaTimes />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold">
                  {selectedStudent.user?.name?.charAt(0) || "?"}
                </div>
                <div>
                  <h4 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                    {selectedStudent.user?.name}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedStudent.user?.email}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <Info label="Roll No" value={selectedStudent.rollNo} />
                <Info label="Course" value={selectedStudent.course} />
                <Info label="Batch" value={selectedStudent.batch} />
                <Info label="Phone" value={selectedStudent.phone || "-"} />
                <Info
                  label="Date of Birth"
                  value={
                    selectedStudent.dob
                      ? new Date(selectedStudent.dob).toLocaleDateString()
                      : "-"
                  }
                />
                <Info label="Address" value={selectedStudent.address || "-"} />
              </div>
            </div>
            <div className="px-5 py-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex justify-end">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isAddEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 w-full max-w-2xl rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center px-5 py-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900 sticky top-0">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                {modalMode === "add" ? "Add New Student" : "Edit Student"}
              </h3>
              <button
                onClick={() => setIsAddEditModalOpen(false)}
                className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition"
              >
                <FaTimes />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter student name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleFormChange}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="student@example.com"
                    disabled={modalMode === "edit"}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleFormChange}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="10-digit mobile number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Date of Birth <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="dob"
                    value={formData.dob}
                    onChange={handleFormChange}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Batch <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="batch"
                    value={formData.batch}
                    onChange={handleFormChange}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Select Batch</option>
                    {getBatchOptions().map((batch) => (
                      <option key={batch._id} value={batch.batchName}>
                        {batch.batchName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleFormChange}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Student address"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  className={`flex-1 py-2 px-4 rounded-lg text-white font-medium flex items-center justify-center gap-2 ${
                    saving
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {saving ? (
                    "Saving..."
                  ) : (
                    <>
                      <FaSave />{" "}
                      {modalMode === "add" ? "Add Student" : "Update Student"}
                    </>
                  )}
                </button>
                <button
                  onClick={() => setIsAddEditModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-xl shadow-xl border border-gray-200 dark:border-gray-700">
            <div className="p-5">
              <div className="flex items-center justify-center mb-4 text-red-600">
                <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
                  <FaTrash size={24} />
                </div>
              </div>

              <h3 className="text-lg font-semibold text-center text-gray-800 dark:text-gray-100 mb-2">
                Confirm Deletion
              </h3>

              <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
                Are you sure you want to delete student{" "}
                <span className="font-semibold text-gray-900 dark:text-white">
                  {selectedStudent.user?.name}
                </span>
                ?
                <br />
                This action cannot be undone.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={handleDelete}
                  disabled={saving}
                  className={`flex-1 py-2 px-4 rounded-lg text-white font-medium ${
                    saving
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  {saving ? "Deleting..." : "Delete"}
                </button>
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Student;
