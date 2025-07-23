// components/EvaluateCodeModal.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import CodeEval from "./CodeEval";

export default function EvaluateCodeModal({ data, onClose, module }) {
  const backendBase = 'http://localhost:5002';
  const [marks, setMarks] = useState({});
  const [submittingStudentId, setSubmittingStudentId] = useState(null);
  const [checkOutputData, setCheckOutputData] = useState(null);


const handleMarksChange = (studentId, value) => {
  const numericValue = Number(value);
  if (numericValue > 10) {
    toast.error("Marks cannot exceed 10");
    setMarks(prev => ({ ...prev, [studentId]: 0 }));
  } else {
    setMarks(prev => ({ ...prev, [studentId]: numericValue }));
  }
};


  const handleCheckOutput = async (studentId) => {
    try {
      const res = await axios.get(`${backendBase}/api/codeEval/${data.noteId}/${studentId}`);
      setCheckOutputData({ ...res.data, studentId });
    } catch (err) {
      console.error("Failed to fetch submission", err);
      toast.error("Failed to fetch code");
    }
  };

  const handleEvaluateCode = async (studentId) => {
    const rawMark = marks[studentId];
    const mark = parseInt(rawMark);

    if (isNaN(mark) || mark < 0 || mark > 10) {
      console.log("Invalid mark:", rawMark);
      toast.error("Please enter a valid mark between 0 and 10");
      return;
    }

    setSubmittingStudentId(studentId);

    try {
      const payload = {
        studentId,
        noteId: data.noteId,
        module,
        codingMark: mark,
      };

      await axios.post(`${backendBase}/api/codeEval/save`, payload);
      toast.success("Coding mark saved");
    } catch (err) {
      console.error("Error submitting code mark", err);
      toast.error("Failed to evaluate code submission");
    } finally {
      setSubmittingStudentId(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 pt-24">
      <div className="bg-white rounded-xl w-full max-w-5xl p-6 relative dark:bg-black dark:text-white">
        <button className="absolute top-4 right-6 text-xl" onClick={onClose}>✕</button>
        <h2 className="text-2xl font-bold mb-6 text-indigo-600">
          Evaluate Code – {data?.title || 'Coding Question'}
        </h2>

        {checkOutputData ? (
          <CodeEval
  onClose={() => setCheckOutputData(null)}
  sourceCode={checkOutputData.code}
  languageId={checkOutputData.language}
  noteId={data.noteId} // ✅ Add this line so test cases can be fetched
/>

        ) : (
          <>
            {data?.submissions?.length === 0 ? (
              <p>No code submissions found.</p>
            ) : (
              <table className="w-full table-auto border border-gray-300 dark:border-gray-600">
                <thead className="bg-blue-100 dark:bg-gray-700">
                  <tr>
                    <th className="p-2 border">Roll No</th>
                    <th className="p-2 border">Name</th>
                    <th className="p-2 border">Check Output</th>
                    <th className="p-2 border">Marks</th>
                    <th className="p-2 border">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.submissions.map((sub) => (
                    <tr key={sub.studentId} className="text-sm">
                      <td className="p-2 border text-center">{sub.rollNo}</td>
                      <td className="p-2 border">{sub.name}</td>
                      <td className="p-2 border text-center">
                        <button
                          className="bg-blue-600 text-white px-2 py-1 rounded text-xs"
                          onClick={() => handleCheckOutput(sub.studentId)}
                        >
                          Check Output
                        </button>
                      </td>
                      <td className="p-2 border text-center dark:text-black">
                        <input
                          type="number"
                          min={0}
                          max={10}
                          value={marks[sub.studentId] || ''}
                          onChange={(e) =>
                            handleMarksChange(sub.studentId, e.target.value)
                          }
                          className="w-16 p-1 border rounded"
                        />
                      </td>
                      <td className="p-2 border text-center">
                        <button
                          onClick={() => handleEvaluateCode(sub.studentId)}
                          disabled={
                            submittingStudentId === sub.studentId ||
                            marks[sub.studentId] === undefined
                          }
                          className={`px-3 py-1 text-white rounded ${
                            submittingStudentId === sub.studentId
                              ? 'bg-gray-400 cursor-not-allowed'
                              : 'bg-green-600 hover:bg-green-700'
                          }`}
                        >
                          {submittingStudentId === sub.studentId
                            ? 'Saving...'
                            : 'Save'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </div>
    </div>
  );
}
