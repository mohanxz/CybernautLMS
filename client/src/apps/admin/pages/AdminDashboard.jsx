import React, { useEffect, useState } from "react";
import API from "../api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [assignmentStats, setAssignmentStats] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState(null);
  const [selectedModule, setSelectedModule] = useState(null);
  const [availableModules, setAvailableModules] = useState([]);
  const [selectedType, setSelectedType] = useState("Assignment");

  const token = localStorage.getItem("token");

  useEffect(() => {
    API.get("/api/dashboard/lecturer", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        setData(res.data);
        if (res.data?.batches?.length > 0) {
          setSelectedBatchId(res.data.batches[0]._id);
        }
      })
      .catch((err) => console.error("Dashboard fetch error:", err));
  }, []);

  useEffect(() => {
    if (!data) return;

    const batch = data.batches.find((b) => b._id === selectedBatchId);
    const modules = batch?.modulesHandled || [];

    setAvailableModules(modules);

    if (!modules.includes(selectedModule)) {
      setSelectedModule(modules[0] || null);
    }
  }, [selectedBatchId, data]);

  useEffect(() => {
    if (selectedBatchId && selectedModule && selectedType) {
      API.get(
        `/statistics/marks?batchId=${selectedBatchId}&module=${selectedModule}&type=${selectedType}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
        .then((res) => setAssignmentStats(res.data || []))
        .catch((err) =>
          console.error("Error fetching assignment stats:", err)
        );
    }
  }, [selectedBatchId, selectedModule, selectedType]);

  if (!data)
    return (
      <div className="p-8 dark:text-white dark:bg-black">
        Loading dashboard...
      </div>
    );

  const { stats, batches } = data;

  // ✅ Active Batches (based on status or fallback)
  const activeBatches = batches.filter(
    (b) => !b.endDate || new Date(b.endDate) >= new Date()
  );

  return (
    <div className="p-4 bg-white dark:bg-black text-black dark:text-white h-[85vh] flex-1 transition-all">

      {/* Header */}
      <h2 className="text-2xl font-bold mb-6 text-blue-900 dark:text-blue-400">
        Welcome back, Dr. {stats?.name || "Admin"}
      </h2>

      {/* ✅ Quick Stats (UPDATED) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[
          {
            title: "My Courses",
            value: stats?.courseCount || 0,
          },
          {
            title: "Total Students",
            value: stats?.totalStudents || 0,
          },
          {
            title: "Active Batches",
            value: activeBatches.length,
          },
        ].map((item, i) => (
          <div
            key={i}
            className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md border dark:border-gray-700"
          >
            <p className="text-sm text-gray-500 dark:text-gray-300">
              {item.title}
            </p>
            <p className="text-3xl font-bold text-blue-700 dark:text-blue-400">
              {item.value}
            </p>
            {item.subtitle && (
              <p className="text-xs text-gray-400">{item.subtitle}</p>
            )}
          </div>
        ))}
      </div>

      {/* Batch + Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

        {/* Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border dark:border-gray-700 lg:col-span-2">
          <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300">
              Submission Stats
            </h3>

            <div className="flex gap-3 flex-wrap">
              <select
                value={selectedBatchId}
                onChange={(e) => setSelectedBatchId(e.target.value)}
                className="border dark:border-gray-600 bg-white dark:bg-gray-700 rounded px-2 py-1 text-sm"
              >
                {batches.map((batch) => (
                  <option key={batch._id} value={batch._id}>
                    {batch.batchName} ({batch.courseName})
                  </option>
                ))}
              </select>

              {availableModules.length > 1 && (
                <select
                  value={selectedModule}
                  onChange={(e) => setSelectedModule(e.target.value)}
                  className="border dark:border-gray-600 bg-white dark:bg-gray-700 rounded px-2 py-1 text-sm"
                >
                  {availableModules.map((mod, i) => (
                    <option key={i} value={mod}>
                      {mod}
                    </option>
                  ))}
                </select>
              )}

              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="border dark:border-gray-600 bg-white dark:bg-gray-700 rounded px-2 py-1 text-sm"
              >
                <option value="Assignment">Assignment</option>
                <option value="Coding">Coding</option>
                <option value="Quiz">Quiz</option>
              </select>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={assignmentStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* My Batches */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border dark:border-gray-700">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-4">
            My Batches
          </h3>

          <ul className="space-y-4">
            {batches.map((batch) => (
              <li
                key={batch._id}
                className="rounded-xl border-l-4 border-blue-500 bg-gray-50 dark:bg-gray-700 p-4"
              >
                <div className="text-lg font-semibold">
                  {batch.courseName} - {batch.batchName}
                </div>

                <div className="text-sm mt-1">
                  Modules:{" "}
                  {batch.modulesHandled?.length
                    ? batch.modulesHandled.join(", ")
                    : "None"}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}