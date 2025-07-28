import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaFileAlt, FaUpload, FaCheckCircle } from "react-icons/fa";
import { toast } from "react-toastify";

export default function StudentProject() {
  const [modules, setModules] = useState([]);
  const [submissions, setSubmissions] = useState({});
  const [files, setFiles] = useState({});
  const [student, setStudent] = useState(null);
  const [batch, setBatch] = useState(null);
  const [batchName, setBatchName] = useState("");
  const [courseModules, setCourseModules] = useState([]);

  useEffect(() => {
  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      const studentRes = await axios.get("http://localhost:5004/auth/student/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const studentData = studentRes.data;
      setStudent(studentData);
      setBatch(studentData.batch);

      const batchRes = await axios.get(`http://localhost:5003/student/batch/by-id/${studentData.batch}`);
      const course = batchRes.data.course;
      setBatchName(batchRes.data.batchName);

      const courseRes = await axios.get(`http://localhost:5003/api/courses/${course}`);
      const mods = courseRes.data.modules;
      setCourseModules(mods);

      // 🔁 Check existence via backend route
      const res = await axios.post("http://localhost:5003/api/project/check-submissions", {
        batchName: batchRes.data.batchName,
        studentName: studentData.user.name,
        rollNo: studentData.rollNo,
        modules: mods
      });

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
      await axios.post(
        `http://localhost:5002/upload-project?batch=${batch}&module=${module}&studentName=${student.user.name}&rollNo=${student.rollNo}`,
        fd
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

  return (
    <div className="p-6 dark:bg-gray-900 min-h-screen">
      <h2 className="text-2xl font-bold mb-4 text-black dark:text-white">
        Project Submission
      </h2>

      {modules.map((m) => (
        <div
          key={m.module}
          className="border-b border-gray-300 pb-4 mb-4 dark:text-white"
        >
          <h3 className="text-xl font-semibold mb-2">{m.module}</h3>

          {m.questionUrl ? (
            <a
              href={m.questionUrl}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 underline"
            >
              <FaFileAlt className="inline mr-2" /> View Question
            </a>
          ) : (
            <p className="text-gray-500">No Question Posted</p>
          )}

          <div className="mt-3">
            {m.answerSubmitted ? (
              <p className="text-green-600 flex items-center gap-2">
                <FaCheckCircle /> Submitted Successfully
              </p>
            ) : (
              <>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => handleFileChange(m.module, e.target.files[0])}
                  className="mb-2"
                  disabled={!m.questionUrl}
                />
                <button
                  onClick={() => handleSubmit(m.module)}
                  className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 disabled:opacity-50"
                  disabled={!m.questionUrl}
                >
                  <FaUpload /> Submit Project
                </button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
