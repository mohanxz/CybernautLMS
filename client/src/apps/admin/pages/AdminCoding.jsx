// src/pages/AdminCoding.jsx
import React, { useEffect, useState, useCallback } from "react";
import { FaPlus, FaEdit, FaTimes, FaTrash, FaEyeSlash, FaEye } from "react-icons/fa";
import { useParams } from "react-router-dom";
import API from "../api";

export default function AdminCoding() {
  const { batchId } = useParams();
  const token = localStorage.getItem("token");

  const [notes, setNotes] = useState([]);
  const [codingMap, setCodingMap] = useState({});
  const [selectedNote, setSelectedNote] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState("");
  const [adminId, setAdminId] = useState("");

  const [newCoding, setNewCoding] = useState({
    title: "",
    description: "",
    language: "Python",
    testCases: [
      { input: [""], expectedOutput: "", hidden: false }
    ],
  });
  const [editIndex, setEditIndex] = useState(null);

  const fetchModules = useCallback(async () => {
    const res = await API.get(`/api/admin-batches/${batchId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const payload = JSON.parse(atob(token.split(".")[1]));
    setAdminId(payload.id);

    const adminModules = res.data.admins.filter(a => a.admin === payload.id).map(a => a.module);
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
      fetchCodingQuestions(res.data);
    } catch (err) {
      console.error("Failed to fetch notes", err);
    }
  }, [batchId, selectedModule, token]);

  const fetchCodingQuestions = async (noteList) => {
    const map = {};
    for (let note of noteList) {
      try {
        const { data } = await API.get(`/api/coding-questions/by-note/${note._id}`);
        map[note._id] = data;
      } catch {}
    }
    setCodingMap(map);
  };

  useEffect(() => { fetchModules(); }, [fetchModules]);
  useEffect(() => { fetchNotes(); }, [fetchNotes]);

const openModal = (noteId) => {
  setSelectedNote(noteId);
  const codingQuestions = codingMap[noteId] || [];

  if (codingQuestions.length > 0) {
    setEditIndex(0); // Open first question for editing
    setNewCoding(codingQuestions[0]);
  } else {
    setEditIndex(null); // New question mode
    setNewCoding({
      title: "",
      description: "",
      language: "Python",
      testCases: [{ input: [""], expectedOutput: "", hidden: false }],
    });
  }

  setModalOpen(true);
};


  const closeModal = () => {
    setSelectedNote(null);
    setModalOpen(false);
    setEditIndex(null);
    setNewCoding({
      title: "",
      description: "",
      language: "Python",
      testCases: [{ input: [""], expectedOutput: "", hidden: false }],
    });
  };

  const handleTestCaseInputChange = (tcIndex, inputIndex, value) => {
    const updated = [...newCoding.testCases];
    updated[tcIndex].input[inputIndex] = value;
    setNewCoding({ ...newCoding, testCases: updated });
  };

  const addTestCaseInput = (tcIndex) => {
    const updated = [...newCoding.testCases];
    updated[tcIndex].input.push("");
    setNewCoding({ ...newCoding, testCases: updated });
  };

  const removeTestCaseInput = (tcIndex, inputIndex) => {
    const updated = [...newCoding.testCases];
    updated[tcIndex].input.splice(inputIndex, 1);
    setNewCoding({ ...newCoding, testCases: updated });
  };

  const addTestCase = () => {
    setNewCoding(prev => ({
      ...prev,
      testCases: [...prev.testCases, { input: [""], expectedOutput: "", hidden: false }]
    }));
  };

  const removeTestCase = (index) => {
    const updated = [...newCoding.testCases];
    updated.splice(index, 1);
    setNewCoding({ ...newCoding, testCases: updated });
  };

  const toggleHidden = (index) => {
    const updated = [...newCoding.testCases];
    updated[index].hidden = !updated[index].hidden;
    setNewCoding({ ...newCoding, testCases: updated });
  };

  const handleAddOrUpdate = async () => {
    const endpoint = editIndex !== null
      ? `/api/coding-questions/${codingMap[selectedNote][editIndex]._id}`
      : `/api/coding-questions`;

    const method = editIndex !== null ? "put" : "post";

    const payload = {
      ...newCoding,
      noteId: selectedNote,
      createdBy: adminId
    };

    try {
      await API[method](endpoint, payload);
      const { data } = await API.get(`/api/coding-questions/by-note/${selectedNote}`);
      setCodingMap(prev => ({ ...prev, [selectedNote]: data }));
      closeModal();
    } catch (err) {
      console.error("Failed to save coding question", err);
    }
  };

  return (
    <div className="p-6 mx-auto text-gray-900 dark:bg-black dark:text-white">
      <h2 className="text-2xl font-bold mb-6">Coding Manager – <span className="text-indigo-600">{selectedModule}</span></h2>

      {modules.length > 1 && (
        <div className="flex gap-2 mb-4">
          {modules.map(mod => (
            <button
              key={mod}
              onClick={() => setSelectedModule(mod)}
              className={`px-4 py-1 rounded-full border text-sm font-medium transition ${
                selectedModule === mod ? "bg-black text-white border-black" : "bg-white dark:bg-gray-700 text-gray-800 dark:text-white border-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
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
  onClick={() => openModal(note._id)}
  className="bg-black text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-gray-800"
>
  <FaPlus />
  {(codingMap[note._id] && codingMap[note._id].length > 0) ? "Manage Coding" : "Add Coding"}
</button>
          </div>

        </div>
      ))}

      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start pt-20 z-50">
          <div className="bg-white dark:bg-gray-900 text-black dark:text-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 relative">
            <button
              className="absolute top-4 right-4 text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white text-xl"
              onClick={closeModal}
            >
              <FaTimes />
            </button>

            <h3 className="text-xl font-bold mb-4">{editIndex !== null ? "Edit" : "New"} Coding Question</h3>

            <input
              type="text"
              placeholder="Title"
              className="w-full p-2 border my-1 dark:bg-gray-800 dark:border-gray-600"
              value={newCoding.title}
              onChange={(e) => setNewCoding(prev => ({ ...prev, title: e.target.value }))}
            />
            <textarea
              placeholder="Question Description"
              className="w-full p-2 border my-1 dark:bg-gray-800 dark:border-gray-600"
              value={newCoding.description}
              onChange={(e) => setNewCoding(prev => ({ ...prev, description: e.target.value }))}
            />

            <label className="text-sm mt-3 block font-medium">Test Cases:</label>
            {newCoding.testCases.map((tc, tcIndex) => (
              <div key={tcIndex} className="border rounded p-3 mb-4 dark:border-gray-600 bg-gray-50 dark:bg-gray-800">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold">Test Case {tcIndex + 1}</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => toggleHidden(tcIndex)} title="Toggle Hidden" className="text-sm">
                      {tc.hidden ? <FaEyeSlash /> : <FaEye />}
                    </button>
                    <button onClick={() => removeTestCase(tcIndex)} title="Remove Test Case" className="text-red-500">
                      <FaTrash />
                    </button>
                  </div>
                </div>

                {tc.input.map((inp, inpIndex) => (
                  <div key={inpIndex} className="flex items-center gap-2 mb-1">
                    <input
                      type="text"
                      placeholder={`Input ${inpIndex + 1}`}
                      className="flex-1 p-1 border dark:bg-gray-700 dark:border-gray-600"
                      value={inp}
                      onChange={(e) => handleTestCaseInputChange(tcIndex, inpIndex, e.target.value)}
                    />
                    {tc.input.length > 1 && (
                      <button onClick={() => removeTestCaseInput(tcIndex, inpIndex)} className="text-sm text-red-600">
                        <FaTimes />
                      </button>
                    )}
                  </div>
                ))}
                <button onClick={() => addTestCaseInput(tcIndex)} className="text-xs text-blue-500 mb-2">
                  + Add Input
                </button>

                <input
                  type="text"
                  placeholder="Expected Output"
                  className="w-full p-1 border dark:bg-gray-700 dark:border-gray-600"
                  value={tc.expectedOutput}
                  onChange={(e) => {
                    const updated = [...newCoding.testCases];
                    updated[tcIndex].expectedOutput = e.target.value;
                    setNewCoding({ ...newCoding, testCases: updated });
                  }}
                />
              </div>
            ))}
            <button onClick={addTestCase} className="text-sm text-blue-600 dark:text-blue-400 mb-4">
              + Add Test Case
            </button>

            <button
              onClick={handleAddOrUpdate}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded w-full"
            >
              {editIndex !== null ? "Update" : "Add"} Coding Question
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
