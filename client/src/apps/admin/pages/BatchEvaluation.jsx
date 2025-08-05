import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import API from "../api"; // Adjust the import based on your API setup
import { useNavigate, useParams } from "react-router-dom";
import { FaPlus, FaEdit, FaUpload } from "react-icons/fa";
import toast from "react-hot-toast";


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

  const fetchBatchModules = useCallback(async () => {
    if (!token) return navigate("/login");

    try {
      const res = await API.get(`/api/admin-batches/${batchId}`, {
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

  const fetchAnswerUrls = async (student, batchName) => {
    try {
      const res = await API.get(`/api/s3-answers/check`, {
        params: {
          batchName,
          studentName: student.user?.name,
          rollNo: student.rollNo,
          module: selectedModule,
        },
        headers: { Authorization: `Bearer ${token}` },
      });
      return { projectAnswerUrl: res.data.projectAnswerUrl };
    } catch {
      return { projectAnswerUrl: null };
    }
  };

  const fetchEvaluation = useCallback(async () => {
    if (!selectedModule) return;

    setLoading(true);
    try {
      const res = await API.get(`/api/batch-evaluation/${batchId}/${selectedModule}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const studentMarksWithUrls = await Promise.all(
        res.data.studentMarks.map(async (s) => {
          const answerUrls = await fetchAnswerUrls(s.student, batchDetails.batchName);
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
  }, [batchId, selectedModule, token, batchDetails.batchName]);

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
      const res = await API.post(
        `/upload-project?batch=${batchId}&title=${selectedModule}`,
        formDataUpload,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const s3path = res.data.s3path;
      setFormData((prev) => ({ ...prev, projectS3Url: s3path }));

      await API.put(`/api/batch-evaluation/${evaluation._id}`, {
        projectS3Url: s3path,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Project uploaded");
    } catch {
      toast.error("Upload failed");
    }
  };

  const saveEvaluation = async () => {
    try {
      await API.put(`/api/batch-evaluation/${evaluation._id}`, {
        projectS3Url: formData.projectS3Url,
        studentMarks: formData.studentMarks.map((s) => ({
          student: s.student._id,
          projectMarks: s.projectMarks,
        })),
      }, {
        headers: { Authorization: `Bearer ${token}` },
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
      await API.post(
        `/api/batch-evaluation`,
        {
          batch: batchId,
          module: selectedModule,
          projectS3Url: "",
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      await fetchEvaluation();
    } catch (err) {
      console.error("Evaluation creation failed:", err);
    }
  };

  useEffect(() => {
    fetchBatchModules();
    // eslint-disable-next-line
  }, [fetchBatchModules]);

  useEffect(() => {
    if (selectedModule) {
      fetchEvaluation();
    }
    // eslint-disable-next-line
  }, [fetchEvaluation]);

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="mb-4">
        <h1 className="text-xl font-bold truncate text-gray-900 dark:text-gray-100">
          {batchDetails.courseName} - {batchDetails.batchName}
        </h1>
      </div>

      <div className="flex overflow-x-auto gap-2 mb-6 border-b pb-2 whitespace-nowrap">
        {modules.map((module) => (
          <button
            key={module}
            onClick={() => setSelectedModule(module)}
            className={`px-4 py-2 rounded-md font-semibold flex-shrink-0 ${
              selectedModule === module
                ? "bg-black text-white dark:bg-white dark:text-black"
                : "bg-gray-200 text-black dark:bg-gray-700 dark:text-gray-100"
            }`}
          >
            {module}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-500 dark:text-gray-400">Loading...</p>
      ) : (
        <div className="p-4 border border-gray-300 dark:border-gray-700 rounded-xl shadow bg-white dark:bg-gray-900 overflow-x-auto">
          {/* Responsive header and action buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
            <h2 className="text-xl font-semibold truncate w-full sm:w-auto text-gray-900 dark:text-gray-100">
              Evaluation - {selectedModule}
            </h2>
            <div className="flex gap-2 w-full sm:w-auto justify-end sm:justify-start">
              {!evaluation && (
                <button
                  onClick={createEvaluation}
                  className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 flex items-center gap-1"
                  title="Add"
                >
                  <FaPlus size={20} />
                  <span className="hidden sm:inline">Add Evaluation</span>
                </button>
              )}

              {evaluation && !editMode && (
                <button
                  onClick={() => setEditMode(true)}
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1"
                  title="Edit"
                >
                  <FaEdit size={18} />
                  <span className="sm:inline">Edit Evaluation</span>
                </button>
              )}
            </div>
          </div>

          {evaluation ? (
            <>
              {editMode && (
                <>
                  <input
                    type="file"
                    accept=".pdf"
                    className="mb-2 block w-full sm:w-auto text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700"
                    onChange={(e) => setProjectFile(e.target.files[0])}
                  />
                  <button
                    onClick={uploadFile}
                    className="mb-2 px-2 py-1 bg-blue-600 dark:bg-blue-500 text-white rounded flex items-center gap-2 w-full sm:w-auto justify-center"
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
                  className="text-blue-600 dark:text-blue-400 underline block mb-2 truncate"
                >
                  View Uploaded Project
                </a>
              )}

              {/* Table view (desktop) */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full min-w-[500px] text-sm border-collapse border border-gray-300 dark:border-gray-600">
                  <thead>
                    <tr>
                      <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-left text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800">
                        Roll
                      </th>
                      <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-left text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800">
                        Name
                      </th>
                      <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-left text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800">
                        Marks
                      </th>
                      <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-left text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800">
                        Answer
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.studentMarks.map((s) => (
                      <tr key={s.student._id} className="border-t border-gray-300 dark:border-gray-600">
                        <td className="px-2 py-1 text-gray-900 dark:text-gray-100">{s.student.rollNo}</td>
                        <td className="px-2 py-1 truncate max-w-[150px] text-gray-900 dark:text-gray-100" title={s.student.user?.name}>
                          {s.student.user?.name}
                        </td>
                        <td className="px-2 py-1 text-gray-900 dark:text-gray-100">
                          {editMode ? (
                            <input
                              type="number"
                              className="w-16 border p-1 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                              value={s.projectMarks}
                              onChange={(e) =>
                                handleMarksChange(s.student._id, "projectMarks", e.target.value)
                              }
                            />
                          ) : (
                            s.projectMarks
                          )}
                        </td>
                        <td className="px-2 py-1">
                          {s.projectAnswerUrl ? (
                            <a
                              href={s.projectAnswerUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 dark:text-blue-400 underline"
                            >
                              View
                            </a>
                          ) : (
                            <span className="text-gray-500 dark:text-gray-400">N/A</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Card view (mobile) */}
              <div className="sm:hidden space-y-4">
                {formData.studentMarks.map((s) => (
                  <div
                    key={s.student._id}
                    className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 shadow-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  >
                    <p className="text-sm">
                      <span className="font-semibold">Roll:</span> {s.student.rollNo}
                    </p>
                    <p className="text-sm truncate" title={s.student.user?.name}>
                      <span className="font-semibold">Name:</span> {s.student.user?.name}
                    </p>
                    <div className="text-sm mt-1">
                      <span className="font-semibold">Marks:</span>{" "}
                      {editMode ? (
                        <input
                          type="number"
                          className="w-20 border rounded p-1 mt-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          value={s.projectMarks}
                          onChange={(e) =>
                            handleMarksChange(s.student._id, "projectMarks", e.target.value)
                          }
                        />
                      ) : (
                        s.projectMarks
                      )}
                    </div>
                    <div className="text-sm mt-1">
                      <span className="font-semibold">Answer:</span>{" "}
                      {s.projectAnswerUrl ? (
                        <a
                          href={s.projectAnswerUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 dark:text-blue-400 underline"
                        >
                          View
                        </a>
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400">N/A</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {editMode && (
                <button
                  onClick={saveEvaluation}
                  className="mt-4 px-4 py-2 bg-green-600 dark:bg-green-500 text-white rounded w-full sm:w-auto block ml-auto"
                >
                  Save Evaluation
                </button>
              )}
            </>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">No evaluation added yet.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default BatchEvaluation;
