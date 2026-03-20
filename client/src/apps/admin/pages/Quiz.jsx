import React, { useEffect, useState, useCallback } from "react";
import API from "../api";
import { 
  FaPlus, 
  FaEdit, 
  FaTimes, 
  FaFileUpload, 
  FaTrash, 
  FaDownload,
  FaExclamationTriangle,
  FaCheckCircle
} from "react-icons/fa";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";

export default function AdminQuizzes() {
  const { batchId } = useParams();
  const token = localStorage.getItem("token");

  const [notes, setNotes] = useState([]);
  const [quizzes, setQuizzes] = useState({});
  const [selectedNote, setSelectedNote] = useState(null);
  const [quizModalOpen, setQuizModalOpen] = useState(false);
  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState("");
  const [adminId, setAdminId] = useState("");
  const [loading, setLoading] = useState({
    notes: false,
    modules: false,
    upload: false
  });
  const [uploadErrors, setUploadErrors] = useState([]);

  const [newQuestion, setNewQuestion] = useState({
    question: "",
    options: { A: "", B: "", C: "", D: "" },
    answer: "A",
  });

  const [editIndex, setEditIndex] = useState(null);

  /* ---------------- FETCH MODULES ---------------- */
  const fetchModules = useCallback(async () => {
    setLoading(prev => ({ ...prev, modules: true }));
    try {
      const res = await API.get(`/api/admin-batches/${batchId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Safely parse token
      if (!token) {
        toast.error("No authentication token found");
        return;
      }

      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        const id = payload.id;
        setAdminId(id);

        const adminModules = res.data.admins
          .filter((a) => a.admin === id)
          .map((a) => a.module);

        setModules(adminModules);
        if (adminModules.length > 0) {
          setSelectedModule(adminModules[0]);
        }
      } catch (tokenError) {
        console.error("Failed to parse token:", tokenError);
        toast.error("Authentication error");
      }
    } catch (err) {
      console.error("Failed to fetch modules", err);
      toast.error("Failed to load modules");
    } finally {
      setLoading(prev => ({ ...prev, modules: false }));
    }
  }, [batchId, token]);

  /* ---------------- FETCH NOTES ---------------- */
  const fetchNotes = useCallback(async () => {
    if (!selectedModule) return;

    setLoading(prev => ({ ...prev, notes: true }));
    try {
      const res = await API.get(`/notes/${batchId}/${selectedModule}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setNotes(res.data);
      await fetchQuizzes(res.data);
    } catch (err) {
      console.error("Failed to fetch notes", err);
      toast.error("Failed to fetch notes");
    } finally {
      setLoading(prev => ({ ...prev, notes: false }));
    }
  }, [batchId, selectedModule, token]);

  /* ---------------- FETCH QUIZZES ---------------- */
  const fetchQuizzes = async (noteList) => {
    const result = {};

    await Promise.all(
      noteList.map(async (note) => {
        try {
          const { data } = await API.get(`/api/quiz/by-note/${note._id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          result[note._id] = data;
        } catch {
          result[note._id] = null;
        }
      })
    );

    setQuizzes(result);
  };

  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

  useEffect(() => {
    if (selectedModule) {
      fetchNotes();
    }
  }, [selectedModule, fetchNotes]);

  /* ---------------- VALIDATE QUESTION ---------------- */
  const validateQuestion = (question) => {
    if (!question.question.trim()) {
      return "Question cannot be empty";
    }
    
    const options = Object.values(question.options);
    const emptyOptions = options.filter(opt => !opt.trim());
    if (emptyOptions.length > 0) {
      return "All options must be filled";
    }
    
    if (!question.answer || !["A", "B", "C", "D"].includes(question.answer)) {
      return "Please select a valid answer";
    }
    
    return null;
  };

  /* ---------------- OPEN MODAL ---------------- */
  const openQuizModal = (noteId) => {
    setSelectedNote(noteId);
    setQuizModalOpen(true);
    setUploadErrors([]);
  };

  /* ---------------- ADD / UPDATE QUESTION ---------------- */
  const handleAddOrUpdateQuestion = async () => {
    if (!selectedNote) return;

    const validationError = validateQuestion(newQuestion);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      let quizId = quizzes[selectedNote]?._id;

      if (!quizId) {
        const res = await API.post(
          "/api/quiz/create",
          { noteId: selectedNote, createdBy: adminId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        quizId = res.data.quiz._id;
        
        // Update quizzes state with new quiz
        setQuizzes(prev => ({ 
          ...prev, 
          [selectedNote]: { ...res.data.quiz, questions: [] } 
        }));
      }

      if (editIndex !== null) {
        await API.put(
          `/api/quiz/${quizId}/question/${editIndex}`,
          newQuestion,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success("Question updated successfully");
      } else {
        await API.post(
          `/api/quiz/${quizId}/add-question`,
          newQuestion,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success("Question added successfully");
      }

      // Refresh quiz data
      const { data } = await API.get(`/api/quiz/${quizId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setQuizzes((prev) => ({ ...prev, [selectedNote]: data }));

      // Reset form
      setNewQuestion({
        question: "",
        options: { A: "", B: "", C: "", D: "" },
        answer: "A",
      });
      setEditIndex(null);
    } catch (err) {
      console.error("Question operation failed:", err);
      toast.error(err.response?.data?.error || "Operation failed");
    }
  };

  /* ---------------- DELETE QUESTION ---------------- */
  const handleDeleteQuestion = async (noteId, questionIndex) => {
    if (!window.confirm("Are you sure you want to delete this question?")) {
      return;
    }

    try {
      const quizId = quizzes[noteId]?._id;
      if (!quizId) return;

      await API.delete(`/api/quiz/${quizId}/question/${questionIndex}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Refresh quiz data
      const { data } = await API.get(`/api/quiz/${quizId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setQuizzes((prev) => ({ ...prev, [noteId]: data }));
      toast.success("Question deleted successfully");
    } catch (err) {
      console.error("Failed to delete question", err);
      toast.error("Failed to delete question");
    }
  };

  /* ---------------- DOWNLOAD TEMPLATE ---------------- */
  const handleDownloadTemplate = async () => {
    try {
      const response = await API.get("/api/quiz/template", {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob"
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "quiz_template.xlsx");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Template downloaded successfully");
    } catch (err) {
      console.error("Template download failed:", err);
      toast.error("Failed to download template");
    }
  };

  /* ---------------- BULK EXCEL UPLOAD ---------------- */
  const handleExcelUpload = async (file) => {
    if (!file) return;

    setLoading(prev => ({ ...prev, upload: true }));
    setUploadErrors([]);

    try {
      let quizId = quizzes[selectedNote]?._id;

      // Create quiz if not exists
      if (!quizId) {
        const res = await API.post(
          "/api/quiz/create",
          { noteId: selectedNote, createdBy: adminId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        quizId = res.data.quiz._id;
        
        setQuizzes(prev => ({ 
          ...prev, 
          [selectedNote]: { ...res.data.quiz, questions: [] } 
        }));
      }

      const formData = new FormData();
      formData.append("file", file);

      const response = await API.post(
        `/api/quiz/${quizId}/upload-excel`, 
        formData, 
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.errors && response.data.errors.length > 0) {
        setUploadErrors(response.data.errors);
        toast.warning(`Uploaded with ${response.data.errors.length} errors`);
      } else {
        toast.success(`Successfully uploaded ${response.data.added} questions 🚀`);
      }

      // Refresh quiz data
      const { data } = await API.get(`/api/quiz/${quizId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setQuizzes((prev) => ({ ...prev, [selectedNote]: data }));
    } catch (err) {
      console.error("Upload failed:", err);
      toast.error(err.response?.data?.error || "Upload failed");
      if (err.response?.data?.details) {
        setUploadErrors(err.response.data.details);
      }
    } finally {
      setLoading(prev => ({ ...prev, upload: false }));
    }
  };

  /* ---------------- EDIT QUESTION ---------------- */
  const handleEditClick = (question, index) => {
    setEditIndex(index);
    setNewQuestion(question);
  };

  /* ---------------- CLOSE MODAL ---------------- */
  const closeModal = () => {
    setQuizModalOpen(false);
    setSelectedNote(null);
    setEditIndex(null);
    setNewQuestion({
      question: "",
      options: { A: "", B: "", C: "", D: "" },
      answer: "A",
    });
    setUploadErrors([]);
  };

  return (
    <div className="p-4 sm:p-6 mx-auto text-gray-900 dark:bg-black dark:text-white min-h-screen max-w-5xl">
      <h2 className="text-2xl font-bold mb-6 text-black dark:text-white">
        Quiz Manager –{" "}
        <span className="text-indigo-600 dark:text-indigo-400">
          {selectedModule || "Select a module"}
        </span>
      </h2>

      {/* Modules selection */}
      {loading.modules ? (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : modules.length > 1 ? (
        <div className="flex flex-wrap gap-2 mb-6">
          {modules.map((mod) => (
            <button
              key={mod}
              onClick={() => setSelectedModule(mod)}
              className={`px-4 py-2 rounded-full border text-sm font-medium transition ${
                selectedModule === mod
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              {mod}
            </button>
          ))}
        </div>
      ) : modules.length === 1 ? (
        <div className="mb-6 p-3 bg-indigo-50 dark:bg-gray-800 rounded-lg">
          <p className="text-indigo-700 dark:text-indigo-300">
            Module: <span className="font-semibold">{modules[0]}</span>
          </p>
        </div>
      ) : null}

      {/* Notes list */}
      {loading.notes ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : notes.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400">
            No notes found for this module
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {notes.map((note) => (
            <div
              key={note._id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow-md transition"
            >
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold truncate">
                  Day {note.day}: {note.title}
                </h3>
                {quizzes[note._id] && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {quizzes[note._id].questions?.length || 0} questions
                  </p>
                )}
              </div>
              <button
                onClick={() => openQuizModal(note._id)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition whitespace-nowrap w-full sm:w-auto justify-center"
              >
                <FaPlus />
                {quizzes[note._id] ? "Manage Quiz" : "Add Quiz"}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Quiz Modal */}
      {quizModalOpen && selectedNote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start pt-10 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 relative mx-4">
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-900 pb-4 border-b border-gray-200 dark:border-gray-700 mb-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">
                  Quiz for:{" "}
                  <span className="text-indigo-600 dark:text-indigo-400">
                    {notes.find(n => n._id === selectedNote)?.title}
                  </span>
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-xl p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition"
                  aria-label="Close modal"
                >
                  <FaTimes />
                </button>
              </div>
            </div>

            {/* Questions List */}
            <div className="space-y-4 mb-6">
              <h4 className="font-semibold text-lg">Questions</h4>
              {(quizzes[selectedNote]?.questions || []).length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  No questions yet. Add your first question below.
                </p>
              ) : (
                (quizzes[selectedNote]?.questions || []).map((q, idx) => (
                  <div
                    key={idx}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-medium">
                        {idx + 1}. {q.question}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditClick(q, idx)}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-1"
                          title="Edit question"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDeleteQuestion(selectedNote, idx)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-1"
                          title="Delete question"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 text-sm">
                      {["A", "B", "C", "D"].map((opt) => (
                        <div
                          key={opt}
                          className={`p-2 rounded ${
                            q.answer === opt
                              ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                              : "bg-gray-100 dark:bg-gray-700"
                          }`}
                        >
                          <span className="font-medium">{opt}:</span> {q.options[opt]}
                          {q.answer === opt && (
                            <span className="ml-2 text-xs">(Correct)</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Add/Edit Question Form */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h4 className="font-semibold text-lg mb-4">
                {editIndex !== null ? "Edit Question" : "Add New Question"}
              </h4>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Enter your question"
                  className="border border-gray-300 dark:border-gray-600 rounded-lg p-3 w-full dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  value={newQuestion.question}
                  onChange={(e) =>
                    setNewQuestion((prev) => ({ ...prev, question: e.target.value }))
                  }
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {["A", "B", "C", "D"].map((opt) => (
                    <div key={opt} className="flex items-center gap-2">
                      <span className="font-medium w-6">{opt}:</span>
                      <input
                        type="text"
                        placeholder={`Option ${opt}`}
                        className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 flex-1 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500"
                        value={newQuestion.options[opt]}
                        onChange={(e) =>
                          setNewQuestion((prev) => ({
                            ...prev,
                            options: { ...prev.options, [opt]: e.target.value },
                          }))
                        }
                      />
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-4">
                  <span className="font-medium">Correct Answer:</span>
                  <select
                    className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    value={newQuestion.answer}
                    onChange={(e) =>
                      setNewQuestion((prev) => ({ ...prev, answer: e.target.value }))
                    }
                  >
                    {["A", "B", "C", "D"].map((opt) => (
                      <option key={opt} value={opt}>
                        Option {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleAddOrUpdateQuestion}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-3 rounded-lg transition w-full"
                >
                  {editIndex !== null ? "Update Question" : "Add Question"}
                </button>
              </div>
            </div>

            {/* Excel Upload Section */}
            <div className="border-t border-gray-200 dark:border-gray-700 mt-6 pt-4">
              <h4 className="font-semibold text-lg mb-4">Bulk Upload via Excel</h4>
              
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <button
                  onClick={handleDownloadTemplate}
                  className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition"
                >
                  <FaDownload /> Download Template
                </button>
                
                <label className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition cursor-pointer">
                  <FaFileUpload /> 
                  {loading.upload ? "Uploading..." : "Upload Excel"}
                  <input
                    type="file"
                    hidden
                    accept=".xlsx,.xls"
                    onChange={(e) => handleExcelUpload(e.target.files[0])}
                    disabled={loading.upload}
                  />
                </label>
              </div>

              {/* Upload Errors */}
              {uploadErrors.length > 0 && (
                <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200 mb-2">
                    <FaExclamationTriangle />
                    <span className="font-medium">Upload Warnings:</span>
                  </div>
                  <ul className="list-disc list-inside text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                    {uploadErrors.map((error, idx) => (
                      <li key={idx}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
                <FaCheckCircle className="inline mr-1 text-green-500" />
                Excel file should have columns: question, optionA, optionB, optionC, optionD, answer
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}