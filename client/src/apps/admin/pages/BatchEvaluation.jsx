import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { FaPlus, FaEdit, FaUpload } from "react-icons/fa";
import toast from "react-hot-toast";

const backendBase = "http://localhost:5002";

const BatchEvaluation = () => {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState(null);
  const [batchDetails, setBatchDetails] = useState({ batchName: "", courseName: "" });
  const [adminId, setAdminId] = useState(null);

  const [evaluation, setEvaluation] = useState(null);
  const [formData, setFormData] = useState({ projectS3Url: "", studentMarks: [] });
  const [projectFile, setProjectFile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);

  // ✅ Load modules that this admin is handling
  const fetchBatchModules = useCallback(async () => {
    if (!token) return navigate("/login");

    try {
      const res = await axios.get(`${backendBase}/api/admin-batches/${batchId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const batch = res.data;
      setBatchDetails({ batchName: batch.batchName, courseName: batch.course.courseName });

      const payload = JSON.parse(atob(token.split(".")[1]));
      const currentAdminId = payload.id;

      const adminModules = batch.admins
        .filter((a) => a.admin === currentAdminId)
        .map((a) => a.module);

      if (!adminModules.length) return navigate("/unauthorized");

      setAdminId(currentAdminId);
      setModules(adminModules);
      setSelectedModule(adminModules[0]);
    } catch (err) {
      console.error("Failed to fetch batch modules:", err);
      navigate("/login");
    }
  }, [batchId, navigate, token]);

  // ✅ Fetch evaluation per selected module
  const fetchEvaluation = useCallback(async () => {
    if (!selectedModule) return;

    setLoading(true);
    try {
      const res = await axios.get(`${backendBase}/api/batch-evaluation/${batchId}/${selectedModule}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const studentMarksWithUrls = await Promise.all(
  res.data.studentMarks.map(async (s) => {
    const answerUrls = await fetchAnswerUrls(s.student, batchDetails.batchName); // ✅ pass batch name
    return { ...s, ...answerUrls };
  })
);

      setEvaluation(res.data);
      setFormData({
        projectS3Url: res.data.projectS3Url || "",
        studentMarks: studentMarksWithUrls || [],
      });
    } catch (err) {
      if (err.response?.status === 404) {
        setEvaluation(null);
      } else {
        toast.error("Failed to load evaluation");
      }
    } finally {
      setLoading(false);
    }
  }, [batchId, selectedModule, token]);

  // ✅ Fix the signature
const fetchAnswerUrls = async (student, batchName) => {
  try {
    const res = await axios.get(`${backendBase}/api/s3-answers/check`, {
      params: {
        batchName,
        studentName: student.user?.name,
        rollNo: student.rollNo,
        module: selectedModule
      },
    });

    return { projectAnswerUrl: res.data.projectAnswerUrl };
  } catch {
    return { projectAnswerUrl: null };
  }
};


  const handleMarksChange = (studentId, field, value) => {
    const updated = formData.studentMarks.map((s) =>
      s.student._id === studentId ? { ...s, [field]: value } : s
    );
    setFormData((prev) => ({ ...prev, studentMarks: updated }));
  };

  const uploadFile = async () => {
    if (!projectFile) return toast.error("No file selected");

    const formDataUpload = new FormData();
    formDataUpload.append("file", projectFile);

    try {
      const res = await axios.post(
        `${backendBase}/upload-project?batch=${batchId}&title=${selectedModule}`,
        formDataUpload,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      const s3path = res.data.s3path;
      setFormData((prev) => ({ ...prev, projectS3Url: s3path }));

      await axios.put(`${backendBase}/api/batch-evaluation/${evaluation._id}`, {
        projectS3Url: s3path,
      });

      toast.success("Project uploaded");
    } catch {
      toast.error("Upload failed");
    }
  };

  const saveEvaluation = async () => {
    try {
      await axios.put(`${backendBase}/api/batch-evaluation/${evaluation._id}`, {
        projectS3Url: formData.projectS3Url,
        studentMarks: formData.studentMarks.map((s) => ({
          student: s.student._id,
          projectMarks: s.projectMarks,
        })),
      });
      toast.success("Saved");
      setEditMode(false);
      fetchEvaluation();
    } catch {
      toast.error("Save failed");
    }
  };

  const createEvaluation = async () => {
  try {
    await axios.post(`${backendBase}/api/batch-evaluation`, {
      batch: batchId,
      module: selectedModule,
      projectS3Url: ""
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    // ✅ Refetch data immediately
    await fetchEvaluation();
  } catch (err) {
    console.error("Evaluation creation failed:", err);
  }
};

  useEffect(() => {
    fetchBatchModules();
  }, [fetchBatchModules]);

  useEffect(() => {
    if (selectedModule) {
      fetchEvaluation();
    }
  }, [fetchEvaluation]);

  return (
    <div className="p-6">
      <div className="mb-4">
        <h1 className="text-xl font-bold">
          {batchDetails.courseName} - {batchDetails.batchName}
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b pb-2">
        {modules.map((module) => (
          <button
            key={module}
            onClick={() => setSelectedModule(module)}
            className={`px-4 py-2 rounded-md font-semibold ${
              selectedModule === module
                ? "bg-black text-white"
                : "bg-gray-200 text-black"
            }`}
          >
            {module}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <div className="p-4 border rounded-xl shadow bg-white">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-semibold">Evaluation - {selectedModule}</h2>

            {!evaluation && (
              <button onClick={createEvaluation} className="text-green-600 hover:text-green-800" title="Add">
                <FaPlus size={20} />
              </button>
            )}

            {evaluation && !editMode && (
              <button onClick={() => setEditMode(true)} className="text-blue-600 hover:text-blue-800" title="Edit">
                <FaEdit size={18} />
              </button>
            )}
          </div>

          {evaluation ? (
            <>
              {editMode && (
                <>
                  <input
                    type="file"
                    accept=".pdf"
                    className="mb-2"
                    onChange={(e) => setProjectFile(e.target.files[0])}
                  />
                  <button
                    onClick={uploadFile}
                    className="mb-2 px-2 py-1 bg-blue-600 text-white rounded flex items-center gap-2"
                  >
                    <FaUpload /> Upload Project PDF
                  </button>
                </>
              )}

              {formData.projectS3Url && (
                <a
                  href={formData.projectS3Url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline block mb-2"
                >
                  View Uploaded Project
                </a>
              )}

              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th>Roll</th>
                    <th>Name</th>
                    <th>Marks</th>
                    <th>Answer</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.studentMarks.map((s) => (
                    <tr key={s.student._id} className="border-t">
                      <td>{s.student.rollNo}</td>
                      <td>{s.student.user?.name}</td>
                      <td>
                        {editMode ? (
                          <input
                            type="number"
                            className="w-16 border p-1 rounded"
                            value={s.projectMarks}
                            onChange={(e) =>
                              handleMarksChange(s.student._id, "projectMarks", e.target.value)
                            }
                          />
                        ) : (
                          s.projectMarks
                        )}
                      </td>
                      <td>
                        {s.projectAnswerUrl ? (
                          <a
                            href={s.projectAnswerUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 underline"
                          >
                            View
                          </a>
                        ) : (
                          <span className="text-gray-500">N/A</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {editMode && (
                <button
                  onClick={saveEvaluation}
                  className="mt-4 px-4 py-2 bg-green-600 text-white rounded"
                >
                  Save Evaluation
                </button>
              )}
            </>
          ) : (
            <p className="text-gray-500">No evaluation added yet.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default BatchEvaluation;
