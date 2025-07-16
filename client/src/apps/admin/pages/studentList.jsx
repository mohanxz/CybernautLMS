import React, { useEffect, useState } from "react";
import axios from "axios";
import AdminLeaderboard from "./AdminLeaderboard";

export default function StudentList() {
  const [students, setStudents] = useState([]);
  const [batchOptions, setBatchOptions] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedBatch, setSelectedBatch] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [courseOptions, setCourseOptions] = useState([]);
  const [yearOptions, setYearOptions] = useState([]);

  const [availableModules, setAvailableModules] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [leaderboardModule, setLeaderboardModule] = useState("");
  const [leaderboardBatchId, setLeaderboardBatchId] = useState("");

  const token = localStorage.getItem("token");

  const getCourseName = (batchName) => {
    if (!batchName) return "N/A";
    const courseMap = {
      FS: "Full Stack Development",
      DS: "Data Science",
      DA: "Data Analytics",
      TT: "Tech Trio",
    };
    const parts = batchName.split("-");
    const courseCode = parts[0];
    return courseMap[courseCode] || courseCode;
  };

  useEffect(() => {
    fetchStudents();
  }, [search, selectedBatch, selectedCourse, selectedYear]);

  const fetchStudents = async () => {
    try {
      const res = await axios.get("http://localhost:5002/api/students/my-students", {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          name: search,
          batchId: selectedBatch,
          course: selectedCourse,
          year: selectedYear,
        },
        withCredentials: true,
      });

      const studentsData = res.data.students || [];
      const batches = res.data.batchOptions || [];

      setStudents(studentsData);
      setBatchOptions(batches);

      const courseSet = new Set();
      const yearSet = new Set();

      batches.forEach((batch) => {
        const parts = batch.batchName.split("-");
        if (parts.length >= 2) {
          courseSet.add(parts[0]);
          yearSet.add(parts[1].slice(3)); // "JUL25" → "25"
        }
      });

      setCourseOptions(["All Courses", ...Array.from(courseSet)]);
      setYearOptions(["All Years", ...Array.from(yearSet)]);

      if (res.data.modules) {
        setAvailableModules(res.data.modules);
        setLeaderboardModule(res.data.modules[0] || "");
      }

      if (batches.length > 0) {
        setLeaderboardBatchId(batches[0]._id);
      }
    } catch (err) {
      console.error("Failed to fetch students", err);
    }
  };

  useEffect(() => {
    if (leaderboardModule && leaderboardBatchId) {
      axios
        .get("http://localhost:5002/statistics/leaderboard", {
          headers: { Authorization: `Bearer ${token}` },
          params: { module: leaderboardModule, batchId: leaderboardBatchId },
          withCredentials: true,
        })
        .then((res) => {
          setLeaderboard(res.data);
        })
        .catch((err) => {
          console.error("Leaderboard fetch error:", err);
        });
    }
  }, [leaderboardModule, leaderboardBatchId]);

  return (
    <div className="p-4 bg-white dark:bg-black text-gray-800 dark:text-white min-h-screen transition-all">
      <AdminLeaderboard />
      <div>
        <h2 className="text-2xl font-bold mb-6 text-blue-900 dark:text-white">My Students</h2>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <input
            type="text"
            placeholder="Search by student name..."
            className="border px-4 py-2 rounded w-full shadow-sm bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="border px-4 py-2 rounded w-full shadow-sm bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-white"
            value={selectedCourse}
            onChange={(e) =>
              setSelectedCourse(e.target.value === "All Courses" ? "" : e.target.value)
            }
          >
            {courseOptions.map((course) => (
              <option key={course} value={course}>
                {course}
              </option>
            ))}
          </select>

          <select
            className="border px-4 py-2 rounded w-full shadow-sm bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-white"
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
          >
            <option value="">All Batches</option>
            {batchOptions.map((batch) => (
              <option key={batch._id} value={batch._id}>
                {batch.batchName}
              </option>
            ))}
          </select>

          <select
            className="border px-4 py-2 rounded w-full shadow-sm bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-white"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value === "All Years" ? "" : e.target.value)}
          >
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        {/* Student Table */}
        {students.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400 text-center mt-8">No students found.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg shadow">
            <table className="min-w-full bg-white dark:bg-gray-900">
              <thead>
                <tr className="bg-blue-100 dark:bg-gray-800 text-blue-900 dark:text-gray-200 text-left text-sm">
                  <th className="py-3 px-4">Roll No</th>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Course</th>
                  <th className="py-3 px-4">Batch</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr
                    key={student._id}
                    className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-sm"
                  >
                    <td className="py-3 px-4">{student.rollNo}</td>
                    <td className="py-2 px-4">{student.name}</td>
                    <td className="py-2 px-4">{student.email}</td>
                    <td className="py-2 px-4">{student.phone}</td>
                    <td className="py-2 px-4">{getCourseName(student.batchName)}</td>
                    <td className="py-2 px-4">{student.batchName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
