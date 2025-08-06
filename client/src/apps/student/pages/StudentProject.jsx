import React, { useEffect, useState } from "react";
import axios from "axios";
import API from "../api";
import { FaFileAlt, FaUpload, FaCheckCircle } from "react-icons/fa";
import { toast } from "react-toastify";

const ProjectSkeleton = () => (
  <div className="max-w-4xl mx-auto py-8">
    <div className="h-10 bg-gray-300 rounded w-1/3 mb-8 animate-pulse"></div>
    {[...Array(3)].map((_, i) => (
      <div key={i} className="mb-6 bg-white rounded-lg shadow-lg p-6">
        <div className="h-8 bg-gray-300 rounded w-1/2 mb-4 animate-pulse"></div>
        <div className="h-5 bg-gray-300 rounded w-1/4 mb-6 animate-pulse"></div>
        <div className="h-10 bg-gray-300 rounded w-1/2 animate-pulse"></div>
      </div>
    ))}
  </div>
);

export default function StudentProject() {
  const [modules, setModules] = useState([]);
  const [submissions, setSubmissions] = useState({});
  const [files, setFiles] = useState({});
  const [student, setStudent] = useState(null);
  const [batch, setBatch] = useState(null);
  const [batchName, setBatchName] = useState("");
  const [courseModules, setCourseModules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const studentRes = await axios.get(`${import.meta.env.VITE_LOGIN_API}/auth/student/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const studentData = studentRes.data;
        setStudent(studentData);
        setBatch(studentData.batch);

        const batchRes = await API.get(`/student/batch/by-id/${studentData.batch}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const course = batchRes.data.course;
        setBatchName(batchRes.data.batchName);

        const courseRes = await API.get(`/api/courses/${course}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const mods = courseRes.data.modules;
        setCourseModules(mods);

        // 🔁 Check existence via backend route
        const res = await API.post(
          "/api/project/check-submissions",
          {
            batchName: batchRes.data.batchName,
            studentName: studentData.user.name,
            rollNo: studentData.rollNo,
            modules: mods
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setModules(
          res.data.map((m) => ({
            module: m.module,
            questionUrl: m.questionUrl,
            answerSubmitted: m.answerExists,
          }))
        );
      } catch (error) {
        console.error(error);
        toast.error("Failed to fetch project modules");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);


  const handleFileChange = (module, file) => {
    setFiles((prev) => ({ ...prev, [module]: file }));
  };

  const handleSubmit = async (module) => {
    const file = files[module];
    if (!file || !batch || !student) {
      toast.error("Missing file or data");
      return;
    }

    const fd = new FormData();
    fd.append("file", file);

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${import.meta.env.VITE_ADMIN_API}/upload-project?batch=${batch}&module=${module}&studentName=${student.user.name}&rollNo=${student.rollNo}`,
        fd,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success("Project submitted!");
      setModules((prev) =>
        prev.map((m) =>
          m.module === module ? { ...m, answerSubmitted: true } : m
        )
      );
    } catch (err) {
      console.error(err);
      toast.error("Upload failed");
    }
  };

  if (loading) return <ProjectSkeleton />;

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-8">
        Project Submission
      </h2>

      {modules.map((m) => (
        <div key={m.module} className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          <div className="p-6">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">{m.module}</h3>

            {m.questionUrl ? (
              <a
                href={m.questionUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 underline mb-4"
              >
                <FaFileAlt />
                View Question
              </a>
            ) : (
              <p className="text-gray-500 mb-4">No Question Posted</p>
            )}

            <div className="mt-4">
              {m.answerSubmitted ? (
                <div className="flex items-center gap-2 text-green-600">
                  <FaCheckCircle />
                  <span>Submitted Successfully</span>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => handleFileChange(m.module, e.target.files[0])}
                    disabled={!m.questionUrl}
                    className="flex-1 p-2 border border-gray-300 rounded-md disabled:bg-gray-100"
                  />
                  <button
                    onClick={() => handleSubmit(m.module)}
                    disabled={!m.questionUrl || !files[m.module]}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md font-medium transition-colors whitespace-nowrap"
                  >
                    <FaUpload />
                    Submit Project
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}