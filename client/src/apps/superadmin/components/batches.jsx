import React, { useEffect, useState } from "react";
import API from "../api";
import { toast } from "react-toastify";
import {
  FaUpload,
  FaUserPlus,
  FaDownload,
  FaEdit,
  FaEye,
  FaPlus,
  FaUserGraduate,
  FaTimes,
  FaSave,
  FaSearch,
  FaFilter,
  FaCalendarAlt,
  FaChalkboardTeacher,
  FaUsers,
  FaBook,
  FaClock,
  FaCheckCircle,
  FaGraduationCap,
  FaLayerGroup,
  FaUniversity,
  FaExclamationTriangle
} from "react-icons/fa";
import { MdOutlineMenuBook } from "react-icons/md";
import { GridLoading, CardSkeleton, FadeIn, SlideUp } from "../../../shared/LoadingComponents";

const BatchesSkeleton = () => (
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
        {[...Array(4)].map((_, i) => (
          <div key={i} className="border dark:border-gray-700 p-6 rounded-xl shadow bg-white dark:bg-gray-800">
            <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-3"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-2/3 mb-4"></div>
            <div className="flex justify-end gap-2 mt-4">
              <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-16"></div>
              <div className="h-8 bg-yellow-300 rounded w-16"></div>
              <div className="h-8 bg-green-300 rounded w-16"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const Batches = () => {
  const [batches, setBatches] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);
  const [showModal2, setShowModal2] = useState({
    show: false,
    course: null,
    batchId: null,
    batchName: "",
  });
  const [showAddStudentModal, setShowAddStudentModal] = useState({
    show: false,
    batchId: null,
    batchName: "",
    course: null,
  });
  const [form, setForm] = useState({ course: "", startDate: "", admins: [] });
  const [editForm, setEditForm] = useState({
    batchName: "",
    course: "",
    startDate: "",
    admins: [],
  });
  const [courses, setCourses] = useState([]);
  const [staff, setStaff] = useState([]);
  const [modules, setModules] = useState([]);
  const [editModules, setEditModules] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("All");
  const [selectedYear, setSelectedYear] = useState("All");
  const [uniqueCourses, setUniqueCourses] = useState([]);
  const [uniqueYears, setUniqueYears] = useState([]);
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  const [students, setStudents] = useState([]);
  const [selected, setSelected] = useState({});
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [generatedBatchName, setGeneratedBatchName] = useState("");

  const [viewBatch, setViewBatch] = useState(null);
  const [uploadResults, setUploadResults] = useState(null);
  const [stats, setStats] = useState({
    totalBatches: 0,
    totalStudents: 0,
    activeBatches: 0,
    totalCourses: 0
  });

  // Single student form state
  const [studentForm, setStudentForm] = useState({
    name: "",
    email: "",
    phone: "",
    dob: "",
  });

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        await Promise.all([fetchBatches(), fetchCourses(), fetchStaff()]);
      } catch (error) {
        toast.error("Failed to load initial data");
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    // Calculate stats whenever batches change
    const active = batches.filter(b => new Date(b.startDate) <= new Date()).length;
    const students = batches.reduce((acc, b) => acc + (b.studentCount || 0), 0);
    const courseSet = new Set(batches.map(b => b.course?.courseName).filter(Boolean));
    
    setStats({
      totalBatches: batches.length,
      totalStudents: students,
      activeBatches: active,
      totalCourses: courseSet.size
    });
  }, [batches]);

  const fetchCourses = () => {
    const token = localStorage.getItem("token");
    API.get("/api/courses", {
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => setCourses(res.data));
  };

  const fetchStaff = () => {
    const token = localStorage.getItem("token");
    API.get("/api/admins", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        console.log("========== STAFF DATA ==========");
        console.log("Received Admins - Full Data:", res.data);
        res.data.forEach((admin) => {
          console.log(
            `Admin ID: ${admin._id}, Name: ${admin.user?.name}, Specialisation: ${admin.specialisation}`,
          );
        });
        console.log("================================");
        setStaff(res.data);
      })
      .catch((err) => console.error("Failed to fetch admins:", err));
  };

  const fetchBatches = () => {
    const token = localStorage.getItem("token");
    API.get("/api/batches", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        console.log("========== BATCHES DATA ==========");
        console.log("Received Batches:", res.data);
        setBatches(res.data);
        const courses = [
          ...new Set(res.data.map((b) => b.course?.courseName).filter(Boolean)),
        ];
        setUniqueCourses(courses);

        const years = [
          ...new Set(
            res.data
              .map((b) => {
                if (b.batchName) {
                  const parts = b.batchName.split("-");
                  if (parts.length >= 2) {
                    const monthYear = parts[1];
                    const year = monthYear.slice(-2);
                    return year;
                  }
                }
                return null;
              })
              .filter(Boolean),
          ),
        ].sort((a, b) => b.localeCompare(a));

        setUniqueYears(years);
        console.log("================================");
      })
      .catch((err) => console.error("Error fetching batches:", err));
  };

  const generateBatchName = async (courseId, startDate) => {
    if (!courseId || !startDate) return "";

    const course = courses.find((c) => c._id === courseId);
    if (!course) return "";

    const [year, month] = startDate.split("-");
    const shortMonth = new Date(startDate)
      .toLocaleString("default", { month: "short" })
      .toUpperCase();
    const shortYear = year.slice(-2);
    const prefix = course.courseName
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join("");

    try {
      const token = localStorage.getItem("token");
      const res = await API.get(
        `/api/batches/count?courseId=${courseId}&month=${month}&year=${year}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const count = res.data.count;
      const name = `${prefix}-${shortMonth}${shortYear}-B${count + 1}`;
      setGeneratedBatchName(name);
      return name;
    } catch (err) {
      console.error("Error generating batch name", err);
      return "";
    }
  };

  const handleCourseChange = async (id) => {
    const course = courses.find((c) => c._id === id);
    setForm((f) => ({ ...f, course: id, admins: [] }));
    setModules(course?.modules || []);
    if (form.startDate) {
      await generateBatchName(id, form.startDate);
    }
  };

  const handleStartDateChange = async (date) => {
    setForm((f) => ({ ...f, startDate: date }));
    if (form.course) {
      await generateBatchName(form.course, date);
    }
  };

  const handleEditClick = (batch) => {
    setEditingBatch(batch);

    const adminsArray = batch.admins.map((adminEntry) => {
      const userId =
        typeof adminEntry.admin === "object"
          ? adminEntry.admin._id
          : adminEntry.admin;

      const adminDoc = staff.find((a) => a.user?._id === userId);

      return {
        module: adminEntry.module,
        admin: adminDoc?._id || "",
      };
    });

    setEditForm({
      batchName: batch.batchName,
      course: batch.course._id,
      startDate: new Date(batch.startDate).toISOString().split("T")[0],
      admins: adminsArray,
    });

    const course = courses.find((c) => c._id === batch.course._id);
    setEditModules(course?.modules || []);

    setShowEditModal(true);
  };

  const handleEditCourseChange = (id) => {
    const course = courses.find((c) => c._id === id);
    setEditForm((f) => ({ ...f, course: id, admins: [] }));
    setEditModules(course?.modules || []);
  };

  const handleEditSubmit = async () => {
    try {
      const token = localStorage.getItem("token");

      const validAdmins = editForm.admins.filter(
        (a) => a.admin && a.admin !== "",
      );

      if (validAdmins.length === 0) {
        toast.error("Please select at least one admin");
        return;
      }

      const payload = {
        batchName: editForm.batchName,
        course: editForm.course,
        startDate: editForm.startDate,
        admins: validAdmins,
      };

      console.log("Updating batch with payload:", payload);

      await API.put(`/api/batches/${editingBatch._id}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success(
        <div className="flex items-center gap-2">
          <FaCheckCircle className="text-green-500" />
          <span>Batch updated successfully!</span>
        </div>
      );
      fetchBatches();
      setShowEditModal(false);
      setEditingBatch(null);
      setEditForm({ batchName: "", course: "", startDate: "", admins: [] });
      setEditModules([]);
    } catch (err) {
      console.error("Error updating batch:", err);
      toast.error("❌ Failed to update batch. Please try again.");
    }
  };

  const handleSubmit = async () => {
    try {
      const finalBatchName = await generateBatchName(
        form.course,
        form.startDate,
      );
      const payload = { ...form, batchName: finalBatchName };
      const token = localStorage.getItem("token");
      await API.post("/api/batches", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success(
        <div className="flex items-center gap-2">
          <FaCheckCircle className="text-green-500" />
          <span>Batch created successfully!</span>
        </div>
      );
      fetchBatches();
      setForm({ course: "", startDate: "", admins: [] });
      setModules([]);
      setGeneratedBatchName("");
      setShowModal(false);
    } catch (err) {
      console.error("Error creating batch:", err);
      toast.error("❌ Failed to create batch. Please try again.");
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append("file", file);
    
    setLoading(true);
    setUploadResults(null);
    
    try {
      const token = localStorage.getItem("token");
      const res = await API.post("/api/upload/upload", formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
      });
      
      console.log("Upload response:", res.data);
      
      // Clean the data properly
      const cleanedStudents = res.data.students.map((stu) => ({
        name: stu.name?.text || stu.name || "",
        email: stu.email?.text || stu.email || "",
        phone: stu.phone?.text || stu.phone || "",
        dob: stu.dob || null,
        address: stu.address?.text || stu.address || ""
      })).filter(stu => stu.email && stu.email.trim() !== ""); // Remove entries without email
      
      setStudents(cleanedStudents);

      // Auto-select all valid students
      const autoSelected = {};
      cleanedStudents.forEach((stu) => {
        if (stu.email) autoSelected[stu.email] = true;
      });
      setSelected(autoSelected);

      toast.success(`✅ ${cleanedStudents.length} students loaded from Excel`);
    } catch (err) {
      console.error("Upload error:", err);
      toast.error(err.response?.data?.error || "Error uploading file");
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (email) => {
    const cleanEmail = typeof email === "object" ? email.text : email;
    setSelected((prev) => ({ ...prev, [cleanEmail]: !prev[cleanEmail] }));
  };

  const toggleSelectAll = () => {
    const allSelected = students.every(stu => selected[stu.email]);
    const newSelected = {};
    students.forEach(stu => {
      newSelected[stu.email] = !allSelected;
    });
    setSelected(newSelected);
  };

  const [added, setAdded] = useState(false);

  const handleSave = async () => {
    // Get the selected students and format them properly
    const selectedList = students
      .filter((stu) => selected[stu.email])
      .map((stu) => ({
        name: stu.name,
        email: stu.email,
        phone: stu.phone,
        dob: stu.dob,
        batch: showModal2.batchId,
        course: showModal2.course,
        address: stu.address || "N/A"
      }));

    if (selectedList.length === 0) {
      toast.warning("Please select at least one student");
      return;
    }

    console.log("Sending bulk upload data:", selectedList);

    setSaving(true);
    setUploadResults(null);
    
    try {
      const token = localStorage.getItem("token");
      const res = await API.post("/api/students/save-selected", selectedList, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      console.log("Bulk upload response:", res.data);
      
      // Store credentials if any
      if (res.data.credentials && res.data.credentials.length > 0) {
        setCredentials(res.data.credentials);
      }
      
      // Store results for display
      if (res.data.results) {
        setUploadResults(res.data.results);
        
        const { added, skipped, errors } = res.data.results;
        
        // Show appropriate toast messages
        if (added.length > 0) {
          toast.success(`✅ ${added.length} students added successfully!`);
        }
        
        if (skipped.length > 0) {
          toast.info(`⚠️ ${skipped.length} students skipped (already exist in this batch)`);
        }
        
        if (errors.length > 0) {
          toast.warning(`⚠️ ${errors.length} students had issues`);
          console.warn("Upload errors:", errors);
        }
      } else {
        toast.success(`✅ ${selectedList.length} Students Added Successfully`);
      }
      
      setAdded(true);
      
      // Refresh batches to update student count
      fetchBatches();
    } catch (err) {
      console.error("Error saving students:", err);
      toast.error(err.response?.data?.error || "Error saving students");
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadCSV = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await API.post(
        "/api/students/download-credentials",
        credentials,
        {
          responseType: "blob",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "student_credentials.csv");
      document.body.appendChild(link);
      link.click();
      toast.success("Credentials downloaded successfully");
    } catch (err) {
      toast.error("Failed to download CSV");
      console.error(err);
    }
  };

  // Handle single student form input change
  const handleStudentFormChange = (e) => {
    setStudentForm({
      ...studentForm,
      [e.target.name]: e.target.value,
    });
  };

  // Handle single student submission
  const handleAddSingleStudent = async () => {
    // Validate form
    if (
      !studentForm.name ||
      !studentForm.email ||
      !studentForm.phone ||
      !studentForm.dob
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(studentForm.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    // Phone validation
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(studentForm.phone.replace(/\D/g, ""))) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem("token");

      // Format the student data exactly as the backend expects
      const studentData = [
        {
          name: studentForm.name,
          email: studentForm.email,
          phone: studentForm.phone,
          dob: studentForm.dob,
          batch: showAddStudentModal.batchId,
          course: showAddStudentModal.course,
          address: "N/A"
        },
      ];

      console.log("Sending single student data:", studentData);

      const res = await API.post("/api/students/save-selected", studentData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("Response:", res.data);
      
      if (res.data.credentials && res.data.credentials.length > 0) {
        setCredentials(res.data.credentials);
      }
      
      toast.success(`✅ Student ${studentForm.name} added successfully!`);

      // Reset form and close modal
      setStudentForm({ name: "", email: "", phone: "", dob: "" });
      setShowAddStudentModal({
        show: false,
        batchId: null,
        batchName: "",
        course: null,
      });

      // Refresh batches to update student count
      fetchBatches();
    } catch (err) {
      console.error("Error adding student:", err);
      toast.error(err.response?.data?.error || "Error adding student");
    } finally {
      setSaving(false);
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

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-IN').format(num || 0);
  };

  const getFilteredAndSortedBatches = () => {
    let filtered = batches.filter((b) => {
      const batchYear = getYearFromBatchName(b.batchName);
      return (
        (selectedCourse === "All" || b.course?.courseName === selectedCourse) &&
        (selectedYear === "All" || batchYear === selectedYear) &&
        b.batchName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });

    filtered.sort((a, b) => {
      let aVal, bVal;
      
      if (sortBy === 'name') {
        aVal = a.batchName || '';
        bVal = b.batchName || '';
      } else if (sortBy === 'date') {
        aVal = new Date(a.startDate);
        bVal = new Date(b.startDate);
      } else if (sortBy === 'students') {
        aVal = a.studentCount || 0;
        bVal = b.studentCount || 0;
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return filtered;
  };

  if (loading) return <BatchesSkeleton />;

  const filteredBatches = getFilteredAndSortedBatches();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800">
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-[9999]">
        <div id="toast-container"></div>
      </div>

      <div className="p-6">
        <SlideUp>
          {/* Header Section */}
          <FadeIn delay={100}>
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                  Batch Management
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2 flex items-center gap-2">
                  <FaGraduationCap className="text-blue-500" />
                  {filteredBatches.length} batches • {stats.totalStudents} students enrolled
                </p>
              </div>
              
              <button
                onClick={() => setShowModal(true)}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <FaPlus className="text-lg" />
                <span className="hidden sm:inline">Add New Batch</span>
              </button>
            </div>
          </FadeIn>

          {/* Stats Cards */}
          <FadeIn delay={150}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all transform hover:scale-105">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <FaUniversity className="text-2xl text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Batches</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatNumber(stats.totalBatches)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all transform hover:scale-105">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <FaUsers className="text-2xl text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Students</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatNumber(stats.totalStudents)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all transform hover:scale-105">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                    <FaClock className="text-2xl text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Active Batches</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatNumber(stats.activeBatches)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all transform hover:scale-105">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <FaBook className="text-2xl text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Courses</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatNumber(stats.totalCourses)}</p>
                  </div>
                </div>
              </div>
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
                    placeholder="Search batches..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  {searchQuery && (
                    <FaTimes
                      onClick={() => setSearchQuery("")}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                    />
                  )}
                </div>
                
                <div className="flex gap-3">
                  <div className="relative min-w-[160px]">
                    <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" />
                    <select
                      value={selectedCourse}
                      onChange={(e) => setSelectedCourse(e.target.value)}
                      className="w-full pl-10 pr-8 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-white appearance-none cursor-pointer focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="All">All Courses</option>
                      {uniqueCourses.map((course, idx) => (
                        <option key={idx} value={course}>
                          {course}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="relative min-w-[140px]">
                    <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" />
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      className="w-full pl-10 pr-8 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-white appearance-none cursor-pointer focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="All">All Years</option>
                      {uniqueYears.map((year, idx) => (
                        <option key={idx} value={year}>
                          20{year}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="relative min-w-[140px]">
                    <button
                      onClick={() => handleSort('date')}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-white flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                    >
                      <span>Sort by Date</span>
                      {sortBy === 'date' && (
                        sortOrder === 'asc' ? <FaFilter className="rotate-180" /> : <FaFilter />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>

          {/* Batch Cards */}
          <FadeIn delay={250}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredBatches.length > 0 ? (
                filteredBatches.map((batch, index) => {
                  const isActive = new Date(batch.startDate) <= new Date();
                  return (
                    <SlideUp key={batch._id} delay={300 + (index * 100)}>
                      <div className="group bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
                        {/* Card Header with Gradient */}
                        <div className="h-24 bg-gradient-to-r from-blue-500 to-blue-700 relative">
                          <div className="absolute -bottom-12 left-6">
                            <div className="w-20 h-20 rounded-xl bg-white dark:bg-gray-800 shadow-lg flex items-center justify-center border-4 border-white dark:border-gray-800">
                              <FaGraduationCap className="text-3xl text-blue-600 dark:text-blue-400" />
                            </div>
                          </div>
                          <div className="absolute top-4 right-4 flex gap-2">
                            {isActive && (
                              <span className="px-3 py-1 bg-green-500/90 backdrop-blur-sm text-white text-xs rounded-full border border-white/30 flex items-center gap-1">
                                <FaCheckCircle className="text-xs" /> Active
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Card Content */}
                        <div className="pt-14 p-6">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                                {batch.batchName}
                              </h3>
                              <div className="flex items-center gap-2 mt-1">
                                <FaBook className="text-blue-500 text-sm" />
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  {batch.course?.courseName}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Stats Grid */}
                          <div className="grid grid-cols-2 gap-3 mt-4">
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                              <div className="flex items-center gap-2">
                                <FaCalendarAlt className="text-blue-600 dark:text-blue-400" />
                                <div>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">Start Date</p>
                                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {formatDate(batch.startDate)}
                                  </p>
                                </div>
                              </div>
                            </div>
                            
                            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                              <div className="flex items-center gap-2">
                                <FaUsers className="text-green-600 dark:text-green-400" />
                                <div>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">Students</p>
                                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {formatNumber(batch.studentCount)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Admins Section */}
                          <div className="mt-4">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                              <FaChalkboardTeacher className="text-blue-500" />
                              Assigned Admins:
                            </p>
                            <div className="space-y-2">
                              {batch.admins.slice(0, 2).map((admin, idx) => (
                                <div key={idx} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 p-2 rounded-lg">
                                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                    {admin.module}:
                                  </span>
                                  <span className="text-xs text-gray-800 dark:text-gray-200">
                                    {admin.admin?.name || "N/A"}
                                  </span>
                                </div>
                              ))}
                              {batch.admins.length > 2 && (
                                <div className="text-xs text-blue-600 dark:text-blue-400 text-center py-1">
                                  +{batch.admins.length - 2} more admins
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <button
                              onClick={() => setViewBatch(batch)}
                              className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                            >
                              <FaEye /> View
                            </button>
                            <button
                              onClick={() => handleEditClick(batch)}
                              className="flex-1 px-3 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                            >
                              <FaEdit /> Edit
                            </button>
                            <button
                              onClick={() => {
                                // Get the course ID properly
                                const courseId = batch.course?._id || batch.course;
                                console.log("Opening bulk upload for:", {
                                  batch: batch._id,
                                  course: courseId,
                                  batchName: batch.batchName
                                });
                                
                                setShowModal2({
                                  show: true,
                                  course: courseId,
                                  batchId: batch._id,
                                  batchName: batch.batchName
                                });
                                setStudents([]);
                                setSelected({});
                                setCredentials([]);
                                setUploadResults(null);
                                setAdded(false);
                              }}
                              className="flex-1 px-3 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                            >
                              <FaUpload /> Bulk
                            </button>
                            <button
                              onClick={() => {
                                console.log("Opening add student modal for batch:", batch);
                                const courseId = batch.course?._id || batch.course;
                                
                                setShowAddStudentModal({
                                  show: true,
                                  batchId: batch._id,
                                  batchName: batch.batchName,
                                  course: courseId,
                                });
                                setStudentForm({ name: "", email: "", phone: "", dob: "" });
                                setCredentials([]);
                              }}
                              className="flex-1 px-3 py-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-800 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                            >
                              <FaUserGraduate /> Single
                            </button>
                          </div>
                        </div>
                      </div>
                    </SlideUp>
                  );
                })
              ) : (
                <div className="col-span-full text-center py-16">
                  <FaGraduationCap className="text-6xl text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 text-lg">No batches found matching your criteria</p>
                </div>
              )}
            </div>
          </FadeIn>
        </SlideUp>
      </div>

      {/* View Batch Modal */}
      {viewBatch && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <SlideUp>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 rounded-t-2xl">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-white">Batch Details</h3>
                  <button
                    onClick={() => setViewBatch(null)}
                    className="text-white/80 hover:text-white text-2xl transition-colors"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-blue-700 flex items-center justify-center text-white text-2xl font-bold">
                    {viewBatch.batchName?.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{viewBatch.batchName}</h2>
                    <p className="text-gray-600 dark:text-gray-400">{viewBatch.course?.courseName}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FaCalendarAlt className="text-blue-500" />
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Start Date</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {new Date(viewBatch.startDate).toLocaleDateString('en-IN', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FaUsers className="text-green-500" />
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Total Students</p>
                        <p className="font-medium text-gray-900 dark:text-white">{viewBatch.studentCount}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-2">
                      <FaChalkboardTeacher className="text-purple-500" />
                      Assigned Admins
                    </p>
                    <div className="space-y-2">
                      {viewBatch.admins.map((admin, idx) => (
                        <div key={idx} className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded-lg">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{admin.module}:</span>
                          <span className="text-sm text-gray-900 dark:text-white">{admin.admin?.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setViewBatch(null)}
                    className="px-6 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </SlideUp>
        </div>
      )}

      {/* Batch Creation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <SlideUp>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 rounded-t-2xl">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-white">Create New Batch</h3>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-white/80 hover:text-white text-2xl transition-colors"
                  >
                    ×
                  </button>
                </div>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="p-8 space-y-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-sm text-blue-800 dark:text-blue-200 flex items-center gap-2">
                    <FaCheckCircle className="text-blue-500" />
                    <span className="font-semibold">Batch Name:</span> {generatedBatchName || "Select course and date"}
                  </p>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Select Course <span className="text-red-500">*</span>
                    </label>
                    <select
                      onChange={(e) => handleCourseChange(e.target.value)}
                      value={form.course}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="">Choose a course</option>
                      {courses.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.courseName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Start Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={form.startDate}
                      onChange={(e) => handleStartDateChange(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Assign Admins by Module
                    </label>
                    <div className="space-y-3 max-h-80 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      {modules.length > 0 ? (
                        modules.map((mod, i) => (
                          <div key={i} className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <span className="w-1/3 text-sm font-medium text-gray-700 dark:text-gray-300">
                              {mod}
                            </span>
                            <select
                              onChange={(e) => {
                                const updated = [...form.admins];
                                updated[i] = { module: mod, admin: e.target.value };
                                setForm((f) => ({ ...f, admins: updated }));
                              }}
                              value={form.admins[i]?.admin || ""}
                              className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">Select Admin</option>
                              {staff
                                .filter((s) => s.specialisation?.includes(mod))
                                .map((s) => (
                                  <option key={s._id} value={s._id}>
                                    {s.user?.name}
                                  </option>
                                ))}
                            </select>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 text-center py-4">Please select a course first</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="submit"
                    className="flex-1 py-3 px-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg"
                  >
                    Create Batch
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
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

      {/* Edit Batch Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <SlideUp>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl">
              <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 p-6 rounded-t-2xl">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-white">Edit Batch</h3>
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingBatch(null);
                      setEditForm({ batchName: "", course: "", startDate: "", admins: [] });
                      setEditModules([]);
                    }}
                    className="text-white/80 hover:text-white text-2xl transition-colors"
                  >
                    ×
                  </button>
                </div>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleEditSubmit(); }} className="p-8 space-y-6">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
                    <FaEdit className="text-yellow-500" />
                    <span className="font-semibold">Editing:</span> {editForm.batchName}
                  </p>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Course
                    </label>
                    <select
                      onChange={(e) => handleEditCourseChange(e.target.value)}
                      value={editForm.course}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Course</option>
                      {courses.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.courseName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={editForm.startDate}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, startDate: e.target.value }))
                      }
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Assign Admins by Module
                    </label>
                    <div className="space-y-3 max-h-80 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      {editModules.map((mod, i) => {
                        const existingAdminEntry = editForm.admins.find(
                          (a) => a.module === mod,
                        );
                        const existingAdminId = existingAdminEntry?.admin || "";

                        return (
                          <div key={i} className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <span className="w-1/3 text-sm font-medium text-gray-700 dark:text-gray-300">
                              {mod}
                            </span>
                            <select
                              value={existingAdminId}
                              onChange={(e) => {
                                const updatedAdmins = [...editForm.admins];
                                const existingIndex = updatedAdmins.findIndex(
                                  (a) => a.module === mod,
                                );

                                if (existingIndex >= 0) {
                                  updatedAdmins[existingIndex] = {
                                    module: mod,
                                    admin: e.target.value,
                                  };
                                } else {
                                  updatedAdmins.push({
                                    module: mod,
                                    admin: e.target.value,
                                  });
                                }

                                setEditForm((f) => ({ ...f, admins: updatedAdmins }));
                              }}
                              className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">Select Admin</option>
                              {staff
                                .filter((s) => s.specialisation?.includes(mod))
                                .map((s) => (
                                  <option key={s._id} value={s._id}>
                                    {s.user?.name}
                                  </option>
                                ))}
                            </select>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="submit"
                    className="flex-1 py-3 px-6 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg"
                  >
                    Update Batch
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingBatch(null);
                      setEditForm({ batchName: "", course: "", startDate: "", admins: [] });
                      setEditModules([]);
                    }}
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

      {/* Bulk Add Students Modal */}
      {showModal2.show && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <SlideUp>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-purple-700 p-6 rounded-t-2xl z-10">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <FaUpload /> Bulk Upload Students
                    </h3>
                    <p className="text-purple-100 text-sm mt-1">
                      Batch: {showModal2.batchName}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowModal2({ show: false, course: null, batchId: null, batchName: "" });
                      setStudents([]);
                      setSelected({});
                      setCredentials([]);
                      setUploadResults(null);
                      setAdded(false);
                    }}
                    className="text-white/80 hover:text-white text-2xl transition-colors"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="p-8">
                {/* Upload Section */}
                <div className="flex justify-center mb-8">
                  <label
                    htmlFor="file-upload"
                    className="flex items-center gap-3 px-8 py-4 text-white font-medium bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg shadow-lg hover:from-purple-700 hover:to-purple-800 cursor-pointer transition-all transform hover:scale-105"
                  >
                    <FaUpload /> {loading ? "Uploading..." : "Upload Excel File"}
                  </label>
                  <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    onChange={handleUpload}
                    accept=".xlsx, .xls, .csv"
                  />
                </div>

                {/* Upload Results Summary */}
                {uploadResults && (
                  <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <FaCheckCircle className="text-green-500 text-xl" />
                        <div>
                          <p className="text-sm text-green-600 dark:text-green-400">Added</p>
                          <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                            {uploadResults.added?.length || 0}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <FaExclamationTriangle className="text-yellow-500 text-xl" />
                        <div>
                          <p className="text-sm text-yellow-600 dark:text-yellow-400">Skipped</p>
                          <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                            {uploadResults.skipped?.length || 0}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <FaTimes className="text-red-500 text-xl" />
                        <div>
                          <p className="text-sm text-red-600 dark:text-red-400">Errors</p>
                          <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                            {uploadResults.errors?.length || 0}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Students Table */}
                {students.length > 0 && (
                  <>
                    <div className="mb-4 flex justify-between items-center">
                      <p className="text-gray-600 dark:text-gray-400">
                        {students.length} students loaded from file
                      </p>
                      <button
                        onClick={toggleSelectAll}
                        className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
                      >
                        {students.every(stu => selected[stu.email]) ? 'Deselect All' : 'Select All'}
                      </button>
                    </div>

                    <div className="overflow-x-auto mb-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow">
                      <table className="min-w-full text-sm">
                        <thead className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
                          <tr>
                            <th className="p-4 text-left w-16">Select</th>
                            <th className="p-4 text-left">Name</th>
                            <th className="p-4 text-left">Email</th>
                            <th className="p-4 text-left">Phone</th>
                            <th className="p-4 text-left">DOB</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800">
                          {students.map((stu, i) => (
                            <tr
                              key={i}
                              className="border-t border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                            >
                              <td className="p-4 text-center">
                                <input
                                  type="checkbox"
                                  className="w-5 h-5 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                                  onChange={() => toggleSelect(stu.email)}
                                  checked={!!selected[stu.email]}
                                />
                              </td>
                              <td className="p-4 font-medium">{stu.name || 'N/A'}</td>
                              <td className="p-4">{stu.email}</td>
                              <td className="p-4">{stu.phone || 'N/A'}</td>
                              <td className="p-4">
                                {stu.dob
                                  ? new Date(stu.dob).toLocaleDateString()
                                  : "N/A"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <button
                        onClick={handleSave}
                        disabled={saving || added}
                        className={`flex-1 py-3 text-lg font-semibold text-white rounded-xl transition flex items-center justify-center gap-2 ${
                          saving || added
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                        }`}
                      >
                        <FaSave />{" "}
                        {saving
                          ? "Saving..."
                          : added
                            ? "Students Added"
                            : `Add Selected (${Object.values(selected).filter(Boolean).length})`}
                      </button>

                      <button
                        onClick={() => {
                          setStudents([]);
                          setSelected({});
                          setAdded(false);
                          setUploadResults(null);
                        }}
                        className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-xl transition"
                      >
                        Clear All
                      </button>
                    </div>

                    {/* Credentials Download */}
                    {credentials.length > 0 && (
                      <div className="mt-6">
                        <button
                          onClick={handleDownloadCSV}
                          className="w-full py-3 text-lg font-semibold text-white rounded-xl bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 transition flex items-center justify-center gap-2"
                        >
                          <FaDownload /> Download Credentials CSV ({credentials.length} students)
                        </button>
                      </div>
                    )}

                    {/* Upload Results Details */}
                    {uploadResults && (uploadResults.skipped?.length > 0 || uploadResults.errors?.length > 0) && (
                      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">Upload Details:</h4>
                        
                        {uploadResults.skipped?.length > 0 && (
                          <div className="mb-3">
                            <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400 mb-2">Skipped Students:</p>
                            <ul className="text-sm text-gray-600 dark:text-gray-400 list-disc pl-5">
                              {uploadResults.skipped.map((item, idx) => (
                                <li key={idx}>{item.email}: {item.reason}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {uploadResults.errors?.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">Errors:</p>
                            <ul className="text-sm text-gray-600 dark:text-gray-400 list-disc pl-5">
                              {uploadResults.errors.map((item, idx) => (
                                <li key={idx}>{item.email}: {item.reason}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}

                {/* No Students State */}
                {students.length === 0 && !loading && (
                  <div className="text-center py-12">
                    <FaUpload className="text-5xl text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">
                      Upload an Excel file to add students in bulk
                    </p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                      Supported formats: .xlsx, .xls, .csv
                    </p>
                  </div>
                )}
              </div>
            </div>
          </SlideUp>
        </div>
      )}

      {/* Add Single Student Modal */}
      {showAddStudentModal.show && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <SlideUp>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
              <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-t-2xl">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <FaUserGraduate /> Add Single Student
                    </h3>
                    <p className="text-green-100 text-sm mt-1">
                      Batch: {showAddStudentModal.batchName}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      setShowAddStudentModal({
                        show: false,
                        batchId: null,
                        batchName: "",
                        course: null,
                      })
                    }
                    className="text-white/80 hover:text-white text-2xl transition-colors"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="p-6">
                <form onSubmit={(e) => { e.preventDefault(); handleAddSingleStudent(); }} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={studentForm.name}
                      onChange={handleStudentFormChange}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
                      placeholder="Enter student name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={studentForm.email}
                      onChange={handleStudentFormChange}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
                      placeholder="student@example.com"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={studentForm.phone}
                      onChange={handleStudentFormChange}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
                      placeholder="10-digit mobile number"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Date of Birth <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="dob"
                      value={studentForm.dob}
                      onChange={handleStudentFormChange}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={saving}
                      className={`flex-1 py-3 px-4 rounded-lg text-white font-medium flex items-center justify-center gap-2 ${
                        saving
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                      }`}
                    >
                      {saving ? (
                        "Adding..."
                      ) : (
                        <>
                          <FaSave /> Add Student
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setShowAddStudentModal({
                          show: false,
                          batchId: null,
                          batchName: "",
                          course: null,
                        })
                      }
                      className="px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>

                {credentials.length > 0 && (
                  <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <p className="text-sm text-green-800 dark:text-green-200 mb-3">
                      Student added successfully! Download credentials:
                    </p>
                    <button
                      onClick={handleDownloadCSV}
                      className="w-full py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white rounded-lg flex items-center justify-center gap-2"
                    >
                      <FaDownload /> Download Credentials
                    </button>
                  </div>
                )}
              </div>
            </div>
          </SlideUp>
        </div>
      )}
    </div>
  );
};

export default Batches;