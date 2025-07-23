import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { FaFilePdf } from "react-icons/fa";

export default function StudentProject() {
  const [student, setStudent] = useState(null);
  const [batch, setBatch] = useState(null); // string
  const [questionUrl, setQuestionUrl] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [file, setFile] = useState(null);

  const fetchStudentData = async () => {
    try {
      const token = localStorage.getItem("token");

      // Step 1: Get student info
      const studentRes = await axios.get("http://localhost:5004/auth/student/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setStudent(studentRes.data);

      // Step 2: Get batch info from 5003
      const batchRes = await axios.get(
        `http://localhost:5003/student/batch/${studentRes.data._id}`
      );

      const { batchName } = batchRes.data;
      setBatch(batchName);

      // Step 3: Get project question if exists
      const questionRes = await axios.get(`http://localhost:5002/project-theory/${studentRes.data.batch}`);
      if (questionRes.data?.projectUrl) {
        setQuestionUrl(questionRes.data.projectUrl);
      }

      // Step 4: Check if already submitted
      const checkRes = await axios.get("http://localhost:5002/check-project-upload", {
        params: {
          batchName,
          studentName: studentRes.data.user.name,
          rollNo: studentRes.data.rollNo,
        },
      });

      setSubmitted(checkRes.data.exists);
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong while fetching data");
    }
  };

  useEffect(() => {
    fetchStudentData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      toast.warning("Please upload a file first.");
      return;
    }

    try {
      const fd = new FormData();
      fd.append("file", file);

      const uploadUrl = `http://localhost:5002/upload-project?batch=${batch}&title=project_${student.user.name}`;

      await axios.post(uploadUrl, fd);
      toast.success("Project submitted successfully!");
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload project");
    }
  };

  return (
    <div className="p-4 max-w-xl mx-auto bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">Project Submission</h2>

      {questionUrl && (
        <div className="mb-4">
          <a
            href={questionUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
          >
            <FaFilePdf className="mr-2" />
            View Project Question
          </a>
        </div>
      )}

      {submitted ? (
        <p className="text-green-600 font-semibold">You have already submitted the project.</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="file"
            accept=".pdf"
            onChange={(e) => setFile(e.target.files[0])}
            className="block w-full border p-2 rounded"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
          >
            Submit Project
          </button>
        </form>
      )}
    </div>
  );
}
