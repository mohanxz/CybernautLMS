import React, { useState, useEffect } from "react";
import { FaSearch } from "react-icons/fa";
import AdminLayout from "../components/AdminLayout";
import { useParams } from "react-router-dom";
import axios from "axios";

const ReportPage = () => {
  const { batchId } = useParams();
  const [search, setSearch] = useState("");
  const [selectedDay, setSelectedDay] = useState("All");
  const [selectedModule, setSelectedModule] = useState("All");
  const [selectedMarksFilter, setSelectedMarksFilter] = useState("All");
  const [reports, setReports] = useState([]);
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchReports();
  }, [batchId]);

  const fetchReports = async () => {
    try {
      const res = await axios.get(`http://localhost:5002/api/reports/batch/${batchId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      });
      setReports(res.data);
    } catch (err) {
      console.error("Error fetching reports", err);
    }
  };

  const days = ["All", ...Array.from(new Set(reports.map((r) => `Day ${r.day}`)))];
  const moduleOptions = ["All", ...Array.from(new Set(reports.map((r) => r.module)))];

  const getMarksStatus = (marksObtained) => {
    if (!marksObtained || marksObtained.length === 0) return "Not uploaded";
    if (marksObtained.some((mark) => mark === -2)) return "Not uploaded";
    if (marksObtained.some((mark) => mark === -1)) return "Not Evaluated";
    if (marksObtained.every((mark) => mark >= 0)) return "Evaluated";
    return "Not uploaded";
  };

  const filtered = reports.filter((s) => {
    const studentName = s.student?.user?.name || "Unknown";
    const matchesName = studentName.toLowerCase().includes(search.toLowerCase());
    const matchesDay = selectedDay === "All" || `Day ${s.day}` === selectedDay;
    const matchesModule = selectedModule === "All" || s.module === selectedModule;
    const marksStatus = getMarksStatus(s.marksObtained);
    const matchesMarks = selectedMarksFilter === "All" || marksStatus === selectedMarksFilter;
    return matchesName && matchesDay && matchesModule && matchesMarks;
  });

  return (
    <div className="px-4 py-6 bg-white dark:bg-black min-h-screen transition-all">
      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 px-4">
        {/* Search */}
        <div className="relative w-full md:max-w-md">
          <input
            type="text"
            placeholder="Search Student"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full py-3 pl-12 pr-4 border rounded-full shadow-sm focus:outline-none text-gray-800 dark:text-white dark:bg-gray-900 dark:border-gray-700"
          />
          <FaSearch className="absolute left-4 top-3.5 text-gray-400" />
        </div>

        {/* Day Filter */}
        <div className="flex flex-col">
          <label className="mb-1 text-sm font-semibold text-gray-700 dark:text-gray-300">Select Day:</label>
          <select
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value)}
            className="border rounded-lg px-4 py-2 text-gray-800 dark:text-white dark:bg-gray-900 dark:border-gray-700"
          >
            {days.map((day) => (
              <option key={day} value={day}>
                {day}
              </option>
            ))}
          </select>
        </div>

        {/* Marks Filter */}
        <div className="flex flex-col">
          <label className="mb-1 text-sm font-semibold text-gray-700 dark:text-gray-300">Filter by Marks:</label>
          <select
            value={selectedMarksFilter}
            onChange={(e) => setSelectedMarksFilter(e.target.value)}
            className="border rounded-lg px-4 py-2 text-gray-800 dark:text-white dark:bg-gray-900 dark:border-gray-700"
          >
            <option value="All">All</option>
            <option value="Not uploaded">Not uploaded</option>
            <option value="Not Evaluated">Not Evaluated</option>
            <option value="Evaluated">Evaluated</option>
          </select>
        </div>

        {/* Module Filter */}
        <div className="flex flex-col">
          <label className="mb-1 text-sm font-semibold text-gray-700 dark:text-gray-300">Filter Module:</label>
          <select
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            className="border rounded-lg px-4 py-2 text-gray-800 dark:text-white dark:bg-gray-900 dark:border-gray-700"
          >
            {moduleOptions.map((module) => (
              <option key={module} value={module}>
                {module}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Legend */}
      <div className="text-sm text-gray-600 dark:text-gray-400 text-center mb-4">
        <span className="font-semibold">Note:</span>
        <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 px-2 py-0.5 rounded text-xs font-semibold mx-2">NU</span> = Not Uploaded,
        <span className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300 px-2 py-0.5 rounded text-xs font-semibold mx-2">NE</span> = Not Evaluated
      </div>

      {/* Table View for Desktop */}
      <div className="hidden sm:block overflow-x-auto">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg overflow-hidden">
          <table className="min-w-full text-sm text-gray-800 dark:text-gray-200">
            <thead className="bg-black text-white">
              <tr>
                <th className="p-4 text-left font-semibold">Student Name</th>
                <th className="p-4 text-left font-semibold">Module</th>
                <th className="p-4 text-left font-semibold">Day</th>
                <th className="p-4 text-left font-semibold">Coding</th>
                <th className="p-4 text-left font-semibold">Quiz</th>
                <th className="p-4 text-left font-semibold">Assignment</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? (
                filtered.map((s, idx) => {
                  const studentName = s.student?.user?.name || "Unknown";
                  const renderBadge = (val) => {
                    if (val === -1)
                      return <span className="badge bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">NE</span>;
                    if (val === -2)
                      return <span className="badge bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300">NU</span>;
                    return <span className="text-sm font-semibold">{val}</span>;
                  };

                  return (
                    <tr
                      key={idx}
                      className={`${
                        idx % 2 === 0 ? "bg-gray-50 dark:bg-gray-800" : "bg-white dark:bg-gray-900"
                      } hover:bg-blue-50 dark:hover:bg-gray-700 transition`}
                    >
                      <td className="p-4 font-medium">{studentName}</td>
                      <td className="p-4 font-semibold">{s.module}</td>
                      <td className="p-4">{`Day ${s.day}`}</td>
                      <td className="p-4">{renderBadge(s.marksObtained?.[0] ?? 0)}</td>
                      <td className="p-4">{renderBadge(s.marksObtained?.[1] ?? 0)}</td>
                      <td className="p-4">{renderBadge(s.marksObtained?.[2] ?? 0)}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-6 text-gray-500 dark:text-gray-400">
                    No matching records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Card View for Mobile */}
      <div className="sm:hidden space-y-4">
        {filtered.length > 0 ? (
          filtered.map((s, idx) => {
            const studentName = s.student?.user?.name || "Unknown";
            const renderBadge = (val) => {
              if (val === -1)
                return <span className="badge bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">NE</span>;
              if (val === -2)
                return <span className="badge bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300">NU</span>;
              return <span className="text-sm font-semibold">{val}</span>;
            };

            return (
              <div
                key={idx}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow rounded-lg p-4 space-y-2"
              >
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-semibold">Name:</span> {studentName}
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-semibold">Module:</span> {s.module}
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-semibold">Day:</span> Day {s.day}
                </div>
                <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300">
                  <div>
                    <span className="font-semibold">Coding:</span>{" "}
                    {renderBadge(s.marksObtained?.[0] ?? 0)}
                  </div>
                  <div>
                    <span className="font-semibold">Quiz:</span>{" "}
                    {renderBadge(s.marksObtained?.[1] ?? 0)}
                  </div>
                  <div>
                    <span className="font-semibold">Assignment:</span>{" "}
                    {renderBadge(s.marksObtained?.[2] ?? 0)}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center text-gray-500 dark:text-gray-400 text-sm py-4">
            No matching records found.
          </div>
        )}
      </div>

    </div>
  );
};

export default ReportPage;
