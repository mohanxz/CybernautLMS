import React, { useEffect, useState, useCallback } from "react";
import API from "../api";
import { FaPlus, FaEdit, FaTimes } from "react-icons/fa";
import { useParams } from "react-router-dom";

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

  const [newQuestion, setNewQuestion] = useState({
    question: "",
    options: { A: "", B: "", C: "", D: "" },
    answer: "A",
  });
  const [finalQuestions, setFinalQuestions] = useState([]);
const [finalModalOpen, setFinalModalOpen] = useState(false);
const [finalNewQuestion, setFinalNewQuestion] = useState({
  question: "", options: { A: "", B: "", C: "", D: "" }, answer: "A"
});
const [finalEditIndex, setFinalEditIndex] = useState(null);

  const [editIndex, setEditIndex] = useState(null);

  const fetchModules = useCallback(async () => {
    const res = await API.get(`/api/admin-batches/${batchId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const payload = JSON.parse(atob(token.split(".")[1]));
    const id = payload.id;
    setAdminId(id);

    const adminModules = res.data.admins.filter(a => a.admin === id).map(a => a.module);
    setModules(adminModules);
    setSelectedModule(adminModules[0]);
  }, [batchId, token]);

  const fetchNotes = useCallback(async () => {
    if (!selectedModule) return;
    try {
      const res = await API.get(`/notes/${batchId}/${selectedModule}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotes(res.data);
      fetchQuizzes(res.data);
    } catch (err) {
      console.error("Failed to fetch notes", err);
    }
  }, [batchId, selectedModule, token]);

  const fetchQuizzes = async (noteList) => {
    const result = {};
    for (let note of noteList) {
      try {
        const { data } = await API.get(`/api/quiz/by-note/${note._id}`);
        result[note._id] = data;
      } catch {
        // skip
      }
    }
    setQuizzes(result);
  };

  useEffect(() => { fetchModules(); }, [fetchModules]);
  useEffect(() => { fetchNotes(); }, [fetchNotes]);
  useEffect(() => {
  if (selectedModule) {
    API.get(`/api/final-assignment/${batchId}/${selectedModule}`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setFinalQuestions(res.data.questions))
      .catch(() => setFinalQuestions([]));
  }
}, [selectedModule, batchId, token]);

  const openQuizModal = async (noteId) => {
    if (quizzes[noteId]) {
      setSelectedNote(noteId);
      setQuizModalOpen(true);
      return;
    }
    try {
      const { data } = await API.post("/api/quiz/create", {
        noteId,
        createdBy: adminId,
      });
      setQuizzes(prev => ({ ...prev, [noteId]: data.quiz }));
      setSelectedNote(noteId);
      setQuizModalOpen(true);
    } catch (err) {
      console.error("Quiz creation failed", err);
    }
  };

  const handleAddOrUpdateQuestion = async () => {
    const quizId = quizzes[selectedNote]?._id;
    if (!quizId) return;
    try {
      if (editIndex !== null) {
        await API.put(`/api/quiz/${quizId}/question/${editIndex}`, newQuestion);
      } else {
        await API.post(`/api/quiz/${quizId}/add-question`, newQuestion);
      }
      const { data } = await API.get(`/api/quiz/${quizId}`);
      setQuizzes(prev => ({ ...prev, [selectedNote]: data }));
      setEditIndex(null);
      setNewQuestion({ question: "", options: { A: "", B: "", C: "", D: "" }, answer: "A" });
    } catch (err) {
      console.error("Failed to add/update question", err);
    }
  };

  const handleEditClick = (q, idx) => {
    setEditIndex(idx);
    setNewQuestion(q);
  };

  const closeModal = () => {
    setQuizModalOpen(false);
    setNewQuestion({ question: "", options: { A: "", B: "", C: "", D: "" }, answer: "A" });
    setEditIndex(null);
  };

  const handleFinalAddOrUpdate = async () => {
  try {
    let updatedQuestions = [...finalQuestions];
    if (finalEditIndex !== null) {
      // Update existing question
      updatedQuestions[finalEditIndex] = finalNewQuestion;
    } else {
      // Add new question
      updatedQuestions.push(finalNewQuestion);
    }

    // Save to backend
    await API.post(`/api/final-assignment/${batchId}/${selectedModule}`, {
      questions: updatedQuestions
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    setFinalQuestions(updatedQuestions);
    setFinalNewQuestion({ question: "", options: { A: "", B: "", C: "", D: "" }, answer: "A" });
    setFinalEditIndex(null);
  } catch (err) {
    console.error("Failed to update final assignment questions", err);
  }
};


  return (
    <div className="p-6 mx-auto text-gray-900 h-screen dark:bg-black dark:text-white">
      <h2 className="text-2xl font-bold mb-6 text-black dark:text-white">
        Quiz Manager – <span className="text-indigo-600 dark:text-indigo-400">{selectedModule}</span>
      </h2>

      {modules.length > 1 && (
        <div className="flex gap-2 mb-4">
          {modules.map(mod => (
            <button
              key={mod}
              onClick={() => setSelectedModule(mod)}
              className={`px-4 py-1 rounded-full border text-sm font-medium transition ${
                selectedModule === mod
                  ? "bg-black text-white border-black"
                  : "bg-white dark:bg-gray-700 text-gray-800 dark:text-white border-gray-300 dark:border-blue-600 hover:bg-gray-100 dark:hover:bg-gray-600"
              }`}
            >
              {mod}
            </button>
          ))}
        </div>
      )}

      {notes.map(note => (
        <div key={note._id} className="bg-white text-black dark:bg-gray-800 dark:text-white shadow p-4 rounded-xl mb-6">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold">Day {note.day}: {note.title}</h3>
            <button
              onClick={() => openQuizModal(note._id)}
              className="bg-black text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-gray-800"
            >
              <FaPlus /> {quizzes[note._id] ? "Manage Quiz" : "Add Quiz"}
            </button>
          </div>
        </div>        
      ))}

      {/* Final Assignment section */}
{selectedModule && (
  <div className="bg-white text-black dark:bg-gray-800 dark:text-white shadow p-4 rounded-xl mb-6">
    <div className="flex justify-between items-center mb-2">
      <h3 className="text-lg font-semibold">
        Final Assignment – {selectedModule}
      </h3>
      <button
        onClick={() => setFinalModalOpen(true)}
        className="bg-indigo-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-indigo-500"
      >
        <FaPlus /> {finalQuestions.length ? "Manage Final Assignment" : "Add Final Assignment"}
      </button>
    </div>
  </div>
)}


      {quizModalOpen && selectedNote && quizzes[selectedNote] && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-start pt-20 z-50">
          <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[80vh] overflow-y-auto p-6 relative">

            <button
              className="absolute top-4 right-4 text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white text-xl"
              onClick={closeModal}
            >
              <FaTimes />
            </button>
            <h3 className="text-xl font-bold mb-4">Quiz for Note</h3>

            <div className="space-y-4">
              {quizzes[selectedNote].questions.map((q, idx) => (
                <div key={idx} className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700">
                  <p className="font-medium mb-1">{idx + 1}. {q.question}</p>
                  {["A", "B", "C", "D"].map(opt => (
                    <p key={opt} className="ml-4 text-sm">
                      {opt}. {q.options[opt]} {q.answer === opt && <strong>(Answer)</strong>}
                    </p>
                  ))}
                  <button
                    className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    onClick={() => handleEditClick(q, idx)}
                  >
                    <FaEdit className="inline mr-1" /> Edit
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-6 border-t border-gray-300 dark:border-gray-700 pt-4">
              <h4 className="font-semibold mb-2">{editIndex !== null ? "Edit Question" : "New Question"}</h4>
              <input
                type="text"
                placeholder="Question"
                className="border w-full p-2 my-1 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                value={newQuestion.question}
                onChange={(e) =>
                  setNewQuestion(prev => ({ ...prev, question: e.target.value }))
                }
              />
              {["A", "B", "C", "D"].map(opt => (
                <input
                  key={opt}
                  type="text"
                  placeholder={`Option ${opt}`}
                  className="border w-full p-2 my-1 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  value={newQuestion.options[opt]}
                  onChange={(e) =>
                    setNewQuestion(prev => ({
                      ...prev,
                      options: { ...prev.options, [opt]: e.target.value },
                    }))
                  }
                />
              ))}
              <select
                className="border p-2 w-full my-2 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                value={newQuestion.answer}
                onChange={(e) =>
                  setNewQuestion(prev => ({ ...prev, answer: e.target.value }))
                }
              >
                {["A", "B", "C", "D"].map(opt => (
                  <option key={opt} value={opt}>Correct: {opt}</option>
                ))}
              </select>
              <button
                onClick={handleAddOrUpdateQuestion}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded w-full"
              >
                {editIndex !== null ? "Update Question" : "Add Question"}
              </button>
            </div>
          </div>
        </div>
      )}

      {finalModalOpen && (
  <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-start pt-20 z-50">
    <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[80vh] overflow-y-auto p-6 relative">
      <button
        className="absolute top-4 right-4"
        onClick={() => setFinalModalOpen(false)}
      ><FaTimes /></button>
      <h3 className="text-xl font-bold mb-4">Final Assignment – {selectedModule}</h3>

      <div className="space-y-4">
        {finalQuestions.map((q, idx) => (
          <div key={idx} className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-800">
            <p className="font-medium mb-1">{idx+1}. {q.question}</p>
            {["A","B","C","D"].map(opt => (
              <p key={opt} className="ml-4 text-sm">
                {opt}. {q.options[opt]} {q.answer === opt && <strong>(Answer)</strong>}
              </p>
            ))}
            <button className="mt-2 text-xs text-blue-600"
              onClick={() => { setFinalEditIndex(idx); setFinalNewQuestion(q); }}
            >
              <FaEdit /> Edit
            </button>
          </div>
        ))}
      </div>

      {/* Add / Edit Form */}
      <div className="mt-6 border-t pt-4">
        <h4 className="mb-2 font-semibold">
          {finalEditIndex !== null ? "Edit Question" : "New Question"}
        </h4>
        <input type="text" placeholder="Question"
          value={finalNewQuestion.question}
          className="border w-full p-2 mb-1"
          onChange={e => setFinalNewQuestion(prev => ({ ...prev, question: e.target.value }))}
        />
        {["A","B","C","D"].map(opt => (
          <input key={opt} type="text" placeholder={`Option ${opt}`}
            value={finalNewQuestion.options[opt]}
            className="border w-full p-2 mb-1"
            onChange={e => setFinalNewQuestion(prev => ({
              ...prev,
              options: { ...prev.options, [opt]: e.target.value }
            }))}
          />
        ))}
        <select className="border p-2 w-full mb-2"
          value={finalNewQuestion.answer}
          onChange={e => setFinalNewQuestion(prev => ({ ...prev, answer: e.target.value }))}
        >
          {["A","B","C","D"].map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        <button className="bg-green-600 text-white px-3 py-1 rounded w-full"
          onClick={handleFinalAddOrUpdate}
        >
          {finalEditIndex !== null ? "Update" : "Add"}
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  );
}
