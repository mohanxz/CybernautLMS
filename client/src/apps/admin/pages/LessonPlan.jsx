import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { FaPlus, FaEdit, FaFlask, FaLink, FaFilePdf } from 'react-icons/fa';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function LessonPlan() {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', meetlink: '', assignmentlink: '', day: '' });
  const [pdfFile, setPdfFile] = useState(null);
  const [adminId, setAdminId] = useState(null);
  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState('');
  const [notes, setNotes] = useState([]);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showEvalModal, setShowEvalModal] = useState(false);
  const [evalData, setEvalData] = useState(null);
  const [batchDetails, setBatchDetails] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submittingStudentId, setSubmittingStudentId] = useState(null);


  const backendBase = 'http://localhost:5002';
  const token = localStorage.getItem('token');

  const fetchBatchModule = useCallback(async () => {
    try {
      const res = await axios.get(`${backendBase}/api/admin-batches/${batchId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const batch = res.data;
      setBatchDetails({ batchName: batch.batchName, courseName: batch.course.courseName });

      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentAdminId = payload.id;
      const adminModules = batch.admins.filter(a => a.admin === currentAdminId).map(a => a.module);

      if (!adminModules.length) return navigate('/unauthorized');

      setAdminId(currentAdminId);
      setModules(adminModules);
      setSelectedModule(adminModules[0]);
    } catch (e) {
      console.error(e);
      navigate('/login');
    }
  }, [batchId, navigate, token]);

  const fetchNotes = useCallback(async () => {
    if (!selectedModule) return;
    try {
      const res = await axios.get(`${backendBase}/notes/${batchId}/${selectedModule}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const sorted = res.data.sort((a, b) => b.day - a.day);
      setNotes(sorted);
    } catch (e) { console.error(e); }
  }, [batchId, selectedModule, token]);

  useEffect(() => { fetchBatchModule(); }, [fetchBatchModule]);
  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  const openModalForAdd = () => {
    setEditingNoteId(null);
    setForm({ title: '', meetlink: '', assignmentlink: '', day: '' });
    setPdfFile(null);
    setShowModal(true);
  };

  const openModalForEdit = note => {
    setForm({
      title: note.title, meetlink: note.meetlink, assignmentlink: note.assignmentlink, day: note.day
    });
    setEditingNoteId(note._id);
    setPdfFile(null);
    setShowModal(true);
  };

  const openEvalModal = async (note) => {
    try {
      const res = await axios.get(`${backendBase}/evaluate/${batchId}/${selectedModule}/${note.title}/${note.day}`);
      setEvalData({ title: note.title, day: note.day, submissions: res.data });
      setShowEvalModal(true);
    } catch (err) {
      console.error("Failed to load submissions", err);
    }
  };

  const handleSubmit = async () => {
  if (!form.title || !form.day) return alert('Please fill title and day');
  setSubmitting(true);
  try {
    let assignmentS3Url = '';

    if (pdfFile) {
      const fd = new FormData();
      fd.append('file', pdfFile);

      const uploadRes = await axios.post(
        `${backendBase}/upload-assignment?batch=${batchId}&module=${selectedModule}&title=${form.title}`,
        fd,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      assignmentS3Url = uploadRes.data.s3path;
    }

    const payload = {
      ...form,
      batch: batchId,
      module: selectedModule,
      admin: adminId,
      assignmentS3Url,
    };

    if (editingNoteId) {
      await axios.put(`${backendBase}/notes/${editingNoteId}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } else {
      await axios.post(`${backendBase}/notes`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
    }

    toast.success("Note saved successfully");
    setShowModal(false);
    fetchNotes();
  } catch (e) {
    console.error(e);
    toast.error(
      e.response?.data?.error?.includes("already exists")
        ? `Day ${form.day} already exists for this batch`
        : e.response?.data?.error || 'Error saving note'
    );
  } finally {
    setSubmitting(false);
  }
};


  const handleEvaluate = async (studentId, marks, setMarks) => {
  const mark = parseInt(marks[studentId]);
  if (isNaN(mark) || mark < 0 || mark > 10) {
    toast.error("Please enter a valid mark between 0 and 10");
    return;
  }

  setSubmittingStudentId(studentId);
  try {
    await axios.post(`${backendBase}/evaluate`, {
      studentId,
      module: selectedModule,
      day: evalData.day,
      mark
    });
    const res = await axios.get(`${backendBase}/evaluate/${batchId}/${selectedModule}/${evalData.title}/${evalData.day}`);
    setEvalData(prev => ({ ...prev, submissions: res.data }));
  } catch (err) {
    console.error("Error submitting marks", err);
    toast.error("Failed to evaluate submission");
  } finally {
    setSubmittingStudentId(null);
  }
};

  return (
    <div className=" mx-auto p-6 text-gray-900 dark:text-white bg-white dark:bg-black w-full min-h-screen">
      {/* Module switch buttons */}
{modules.length > 1 && (
  <div className="flex gap-3 mb-6">
    {modules.map(mod => (
      <button
        key={mod}
        onClick={() => setSelectedModule(mod)}
        className={`px-4 py-1 rounded-full border text-sm font-medium transition-all ${
          selectedModule === mod ? 'bg-black text-white border-black' : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-100'
        }`}
      >
        {mod}
      </button>
    ))}
  </div>
)}

{/* Page heading and Add Note button */}
<div className="flex justify-between items-center mb-10">
  <h2 className="text-2xl font-bold text-gray-900 dark: text-white">
    Lesson Plan: <span className="text-blue-600">{batchDetails.batchName}</span> <span className="text-gray-500 text-base">({batchDetails.courseName})</span> – <span className="text-indigo-600">{selectedModule}</span>
  </h2>
  <button
    onClick={openModalForAdd}
    className="flex items-center gap-2 px-5 py-2 text-white bg-black rounded-lg hover:bg-gray-800 transition"
  >
    <FaPlus /> Add Note
  </button>
</div>

{/* Latest note display */}
{notes.length > 0 && (
  <div className="bg-white shadow-sm border rounded-xl p-6 mb-8 dark:bg-blue-200">
    <div className="flex justify-between items-center">
      <h3 className="text-lg font-semibold text-gray-800">Day {notes[0].day}: {notes[0].title}</h3>
      <a
        href={notes[0].meetlink}
        target="_blank"
        rel="noreferrer"
        className="text-sm px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
      >
        Join Meet
      </a>
    </div>

    <div className="text-sm mt-4 grid grid-cols-1 md:grid-cols-3 gap-20">
      {notes[0].assignmentlink && (
        <a href={notes[0].assignmentlink} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-2 bg-black text-white rounded hover:bg-gray-800">
          <FaLink className="text-sm" /> Assignment
        </a>
      )}
      {notes[0].assignmentS3Url && (
        <a href={notes[0].assignmentS3Url} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-2 bg-black text-white rounded hover:bg-gray-800">
          <FaFilePdf className="text-sm" />Assignment PDF
        </a>
      )}
    </div>

    <div className="flex gap-4 mt-6">
      <button
        onClick={() => openEvalModal(notes[0])}
        className="flex items-center justify-center gap-2 w-32 px-3 py-2 bg-black text-white rounded hover:bg-gray-800 text-sm"
      >
        <FaFlask className="text-sm" /> Evaluate
      </button>
      <button
        onClick={() => openModalForEdit(notes[0])}
        className="flex items-center justify-center gap-2 w-32 px-3 py-2 bg-black text-white rounded hover:bg-gray-800 text-sm"
      >
        <FaEdit className="text-sm" /> Edit
      </button>
    </div>
  </div>
)}

{/* Older notes display */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  {notes.slice(1).map(note => (
    <div
      key={note._id}
      className="bg-white p-5 rounded-lg border hover:shadow-sm cursor-pointer dark:bg-blue-200 text-black"
      onClick={() => setNotes(prev => {
        const updated = [...prev];
        const idx = updated.findIndex(n => n._id === note._id);
        if (idx > -1) {
          const [moved] = updated.splice(idx, 1);
          updated.unshift(moved);
        }
        return updated;
      })}
    >
      <div className="flex justify-between items-center">
        <div>
          <p className="font-semibold text-gray-800">Day {note.day}: {note.title}</p>
          <p className="text-xs text-gray-600">{new Date(note.createdAt).toLocaleDateString()}</p>
        </div>
        <div className="flex flex-col gap-2 items-end">
          <button
            onClick={e => { e.stopPropagation(); openModalForEdit(note); }}
            className="flex items-center justify-center gap-2 w-32 px-3 py-2 bg-black text-white rounded hover:bg-gray-800 text-sm"
          >
            <FaEdit className="text-sm" /> Edit
          </button>
          <button
            onClick={e => { e.stopPropagation(); openEvalModal(note); }}
            className="flex items-center justify-center gap-2 w-32 px-3 py-2 bg-black text-white rounded hover:bg-gray-800 text-sm"
          >
            <FaFlask className="text-sm" /> Evaluate
          </button>
        </div>
      </div>
    </div>
  ))}
</div>

      
      {/* Evaluation Modal */}
      {showEvalModal && evalData && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-start pt-20 z-50 dark:bg-blue text-white">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl p-8 relative dark:bg-black">
            <button
              className="absolute top-4 right-4 text-gray-600 hover:text-black text-xl"
              onClick={() => setShowEvalModal(false)}
            >✕</button>
            <h2 className="text-2xl font-bold mb-6 text-blue-800">
              Pending Assignment Evaluation – {decodeURIComponent(evalData.title)}
            </h2>
            {evalData.submissions.length === 0 ? (
              <p className="text-gray-600">No submissions found yet.</p>
            ) : (
              <EvaluationTable
                submissions={evalData.submissions}
                handleEvaluate={handleEvaluate}
              />
            )}
          </div>
        </div>
      )}

      {/* Add/Edit Note Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-start pt-20 z-50 dark:bg-black text-black">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-8 relative">
            <button
              className="absolute top-4 right-4 text-gray-600 hover:text-black text-xl"
              onClick={() => setShowModal(false)}
            >✕</button>
            <h3 className="text-2xl font-bold mb-6 text-gray-900">{editingNoteId ? 'Edit' : 'Add'} Note – {selectedModule}</h3>

            <div className="space-y-4">
              <input className="w-full border p-3 rounded-lg" placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              <input className="w-full border p-3 rounded-lg" placeholder="Meet Link" value={form.meetlink} onChange={e => setForm({ ...form, meetlink: e.target.value })} />
              <input className="w-full border p-3 rounded-lg" placeholder="External Assignment Link" value={form.assignmentlink} onChange={e => setForm({ ...form, assignmentlink: e.target.value })} />
              <input type="number" className="w-full border p-3 rounded-lg" placeholder="Day" value={form.day} onChange={e => setForm({ ...form, day: e.target.value })} />
              <input type="file" accept="application/pdf" className="w-full border p-2 rounded-lg bg-gray-100" onChange={e => setPdfFile(e.target.files[0])} />
              <button
  onClick={handleSubmit}
  className={`w-full text-white py-3 rounded-lg transition ${
    submitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-black hover:bg-gray-800'
  }`}
  disabled={submitting}
>
  {submitting
    ? (editingNoteId ? 'Updating...' : 'Adding...')
    : (editingNoteId ? 'Update Note' : 'Add Note')}
</button>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EvaluationTable({ submissions, handleEvaluate }) {
  const [marks, setMarks] = useState({});

  return (
    <table className="w-full table-auto border border-gray-300 shadow">
      <thead className="bg-blue-100">
        <tr>
          <th className="p-3 border">#</th>
          <th className="p-3 border">Student Name</th>
          <th className="p-3 border">Download Link</th>
          <th className="p-3 border">Marks</th>
          <th className="p-3 border">Action</th>
        </tr>
      </thead>
      <tbody>
        {submissions.map((sub, index) => (
          <tr key={index} className="text-sm">
            <td className="p-3 border text-center">{index + 1}</td>
            <td className="p-3 border">{sub.studentName}</td>
            <td className="p-3 border text-center">
              <a href={sub.answerLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View PDF</a>
            </td>
            <td className="p-3 border text-center dark:text-black">
              <input
                type="number"
                min={0}
                max={100}
                className="w-20 p-1 border rounded"
                value={marks[sub.studentId] || ''}
                onChange={(e) => setMarks(prev => ({ ...prev, [sub.studentId]: e.target.value }))}
              />
            </td>
            <td className="p-3 border text-center">
              <button
  className={`px-3 py-1 rounded text-white ${
    submittingStudentId === sub.studentId ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'
  }`}
  disabled={submittingStudentId === sub.studentId}
  onClick={() => handleEvaluate(sub.studentId, marks, setMarks)}
>
  {submittingStudentId === sub.studentId ? 'Saving...' : 'Evaluate'}
</button>

            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
