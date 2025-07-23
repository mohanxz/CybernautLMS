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

  const fetchStudentData = async () => {
    try {
      const token = localStorage.getItem("token");

      // Step 1: Get student info
      const studentRes = await axios.get("http://localhost:5004/auth/student/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setStudent(studentRes.data);

      // Step 2: Get batch info
      const batchRes = await axios.get(
        `http://localhost:5003/student/batch/${studentRes.data._id}`
      );
      const { batchName } = batchRes.data;
      setBatch(batchName);

      // Step 3: Get theory question
      const questionRes = await axios.get(
        `http://localhost:5002/project-theory/${studentRes.data.batch}`
      );
      if (questionRes.data?.theoryUrl) {
        setQuestionUrl(questionRes.data.theoryUrl);
      }

      // Step 4: Check if already submitted
      const checkRes = await axios.get("http://localhost:5002/check-project-upload", {
        params: {
          batchName,
          studentName: studentRes.data.user.name,
          rollNo: studentRes.data.rollNo,
          title: `theory_${studentRes.data.user.name}`,
        },
      });

      setSubmitted(checkRes.data.exists);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to fetch data");
    }
  };

  useEffect(() => {
    fetchStudentData();
  }, []);

  const handleSubmit = async () => {
    if (!file || !batch || !student) {
      toast.error("Please select a file");
      return;
    }

    const fd = new FormData();
    fd.append("file", file);

    try {
      await axios.post(
        `http://localhost:5002/upload-project?batch=${batch}&title=theory_${student.user.name}`,
        fd
      );
      toast.success("Theory uploaded!");
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
        <a
          href={questionUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center px-4 py-2 bg-black text-white rounded mb-4"
        >
          <FaFileAlt className="mr-2" /> View Theory Question
        </a>
      ) : (
        <p className="text-gray-500">No Theory Posted Yet</p>
      )}

      <div className="mt-4">
        {submitted ? (
          <p className="text-green-600 flex items-center gap-2">
            <FaCheckCircle /> Already Submitted
          </p>
        ) : (
          <>
            <input
              type="file"
              accept="application/pdf"
              onChange={e => setFile(e.target.files[0])}
              className="mb-3 block"
            />
            <button
              onClick={handleSubmit}
              className="inline-flex items-center px-4 py-2 bg-black text-white rounded"
            >
              <FaUpload className="mr-2" /> Submit Theory
            </button>
          </>
        )}
      </div>
    </div>
  );
}
