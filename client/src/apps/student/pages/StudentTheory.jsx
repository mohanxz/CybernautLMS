import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaFileAlt, FaUpload, FaCheckCircle } from "react-icons/fa";
import { toast } from "react-toastify";

export default function StudentTheory() {
  const [questionUrl, setQuestionUrl] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [file, setFile] = useState(null);
  const [student, setStudent] = useState(null);
  const [batch, setBatch] = useState(null);

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:5004/auth/student/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStudent(res.data);
        setBatch(res.data.batch);

        const batchRes = await axios.get(`http://localhost:5002/project-theory/${res.data.batch}`);
        if (batchRes.data?.theoryUrl) setQuestionUrl(batchRes.data.theoryUrl);

        const key = `${res.data.user.name.trim()}_${res.data.rollNo}`;
        try {
          const headRes = await axios.head(`https://your-bucket.s3.amazonaws.com/${key}/theory/answer.pdf`);
          setSubmitted(headRes.status === 200);
        } catch {
          setSubmitted(false);
        }
      } catch (error) {
        console.error("Error fetching student/theory data:", error);
        toast.error("Something went wrong. Try again.");
      }
    };

    fetchStudent();
  }, []);

  const handleSubmit = async () => {
    if (!file || !batch || !student) {
      toast.error("Missing file or student data");
      return;
    }

    const fd = new FormData();
    fd.append("file", file);

    try {
      await axios.post(
        `http://localhost:5002/upload-project?batch=${batch}&title=theory_${student.user.name}`,
        fd
      );
      toast.success("Theory submitted!");
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      toast.error("Upload failed");
    }
  };

  return (
    <div className="p-6 dark:bg-gray-900 min-h-screen">
      <h2 className="text-2xl font-bold mb-4 text-black dark:text-white">Theory Submission</h2>

      {questionUrl ? (
        <a href={questionUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline">
          <FaFileAlt className="inline mr-2" /> View Theory Question
        </a>
      ) : (
        <p className="text-gray-500">No Theory Posted Yet</p>
      )}

      <div className="mt-6">
        {submitted ? (
          <p className="text-green-600 flex items-center gap-2">
            <FaCheckCircle /> Submitted Successfully
          </p>
        ) : (
          <>
            <input
              type="file"
              accept="application/pdf"
              onChange={e => setFile(e.target.files[0])}
              className="mb-3"
            />
            <button
              onClick={handleSubmit}
              className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2"
            >
              <FaUpload /> Submit Theory
            </button>
          </>
        )}
      </div>
    </div>
  );
}
