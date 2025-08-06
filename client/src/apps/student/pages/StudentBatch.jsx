import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import api from "../api";
import { FaVideo, FaQuestionCircle, FaFileAlt, FaUpload, FaCheckCircle, FaCode } from 'react-icons/fa';

import { toast } from 'react-toastify';

const SkeletonLoader = () => (
  <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 0' }}>
    <div style={{ width: '50%', height: '40px', backgroundColor: '#e0e0e0', marginBottom: '1.5rem' }} />
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
      <div style={{ width: '100px', height: '40px', backgroundColor: '#e0e0e0', borderRadius: '20px' }} />
      <div style={{ width: '100px', height: '40px', backgroundColor: '#e0e0e0', borderRadius: '20px' }} />
      <div style={{ width: '100px', height: '40px', backgroundColor: '#e0e0e0', borderRadius: '20px' }} />
    </div>
    <div style={{ marginBottom: '2.5rem' }}>
      <div style={{ width: '25%', height: '30px', backgroundColor: '#e0e0e0', marginBottom: '1rem' }} />
      <div style={{ padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
        <div style={{ width: '75%', height: '30px', backgroundColor: '#e0e0e0', marginBottom: '1rem' }} />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
          <div style={{ width: '120px', height: '40px', backgroundColor: '#e0e0e0' }} />
          <div style={{ width: '120px', height: '40px', backgroundColor: '#e0e0e0' }} />
          <div style={{ width: '120px', height: '40px', backgroundColor: '#e0e0e0' }} />
        </div>
        <div style={{ height: '40px', backgroundColor: '#e0e0e0' }} />
      </div>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
      {[...Array(2)].map((_, i) => (
        <div key={i} style={{ padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
          <div style={{ width: '75%', height: '30px', backgroundColor: '#e0e0e0', marginBottom: '1rem' }} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
            <div style={{ width: '120px', height: '40px', backgroundColor: '#e0e0e0' }} />
            <div style={{ width: '120px', height: '40px', backgroundColor: '#e0e0e0' }} />
            <div style={{ width: '120px', height: '40px', backgroundColor: '#e0e0e0' }} />
          </div>
          <div style={{ height: '40px', backgroundColor: '#e0e0e0' }} />
        </div>
      ))}
    </div>
  </div>
);

export default function StudentBatch() {
  const { batchId } = useParams();
  const [student, setStudent] = useState(null);
  const [batch, setBatch] = useState(null);
  const [notesMap, setNotesMap] = useState({});
  const [activeModule, setActiveModule] = useState(null);
  const [reports, setReports] = useState([]);
  const [quizzesMap, setQuizzesMap] = useState({});
  const [codingQuestionsMap, setCodingQuestionsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${import.meta.env.VITE_LOGIN_API}/auth/student/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStudent(res.data);
      } catch (err) {
        console.error(err);
        navigate('/');
      }
    };
    fetchStudent();
  }, [navigate]);

  useEffect(() => {
    const fetchBatchAndNotes = async () => {
      try {
        if (!student) return; // ⛳ wait for student before proceeding
        setLoading(true);

        const res = await api.get(`/student/batch/by-id/${batchId}`);
        setBatch(res.data);

        const token = localStorage.getItem('token');
        const allNotes = {};
        let latestModule = null;
        let maxOverallDay = -1;

        for (const adminObj of res.data.admins) {
          const moduleName = adminObj.module;
          const noteRes = await api.get(`/notes/${batchId}/${moduleName}`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          const notes = Array.isArray(noteRes.data) ? noteRes.data : noteRes.data.notes || [];
          const maxDay = Math.max(...notes.map(note => note.day || 0));

          if (maxDay > maxOverallDay) {
            maxOverallDay = maxDay;
            latestModule = moduleName;
          }

          allNotes[moduleName] = {
            today: notes.filter(note => note.day === maxDay),
            others: notes.filter(note => note.day !== maxDay)
          };
        }

        const quizMap = {};
        for (const module in allNotes) {
          for (const note of [...allNotes[module].today, ...allNotes[module].others]) {
            try {
              const res = await api.get(`/api/quiz/by-note/${note._id}`);
              if (res.data?._id) {
                quizMap[note._id] = res.data;
              }
            } catch {
              console.warn("No quiz uploaded for this note");
            }
          }
        }

        const codingMap = {};
        for (const module in allNotes) {
          for (const note of [...allNotes[module].today, ...allNotes[module].others]) {
            try {
              const res = await api.get(`/api/coding-question/by-note/${note._id}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              if (res.data?._id) {
                const codingQuestion = res.data;

                // Fetch submission status only when student is available
                const statusRes = await API.get(
                  `/api/coding/submission-status/${note._id}/${student._id}`,
                  { headers: { Authorization: `Bearer ${token}` } }
                );

                codingMap[note._id] = {
                  ...codingQuestion,
                  submitted: statusRes.data.submitted,
                };
              }
            } catch {
              console.warn("No coding question or submission status for this note");
            }
          }
        }

        setCodingQuestionsMap(codingMap);
        setNotesMap(allNotes);
        setQuizzesMap(quizMap);
        if (latestModule) setActiveModule(latestModule);
      } catch (err) {
        console.error('Error loading batch or notes:', err);
      } finally {
        setLoading(false);
      }
    };

    if (batchId && student) fetchBatchAndNotes();
  }, [batchId, student]);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        if (!student?._id) return;
        const res = await api.get(`/api/reports/${student._id}`);
        setReports(res.data);
      } catch (err) {
        console.error("Error fetching reports:", err);
      }
    };

    if (student) fetchReports();
  }, [student]);

  const getAssignmentMark = (module, day) => {
    const match = reports.find(r => r.module === module && r.day === day);
    return match ? match.marksObtained?.[2] ?? -2 : -2;
  };

  const getQuizMark = (module, day) => {
    const match = reports.find(r => r.module === module && r.day === day);
    return match ? match.marksObtained?.[1] ?? -2 : -2;
  };

  const renderNoteCard = (note, student, batchId, module, large = false, index = 0) => {
    const assignmentMark = getAssignmentMark(module, note.day);
    const quizMark = getQuizMark(module, note.day);

    const viewAssignment = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_ADMIN_API}/assignment-question/${encodeURIComponent(batch.batchName)}/${encodeURIComponent(module)}/${encodeURIComponent(note.title)}`);
        if (res.data?.url) {
          window.open(res.data.url, '_blank');
        } else {
          toast.info("Assignment link not found");
        }
      } catch (err) {
        console.error("Error fetching assignment link:", err);
        toast.error("Failed to fetch assignment link");
      }
    };

    return (
      <div
        key={note._id}
        style={{
          padding: '1rem',
          borderRadius: '12px',
          boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          transition: 'all 0.3s ease-in-out',
          ':hover': { boxShadow: '0 8px 16px rgba(0,0,0,0.2)' },
        }}
      >
        <h4 style={{ color: '#333' }}>Day {note.day}: {note.title}</h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
          <button
            onClick={() => window.open(note.meetlink, '_blank')}
            style={{
              backgroundColor: 'black',
              color: 'white',
              fontSize: '0.875rem',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <FaVideo />
            Join Meet
          </button>

          {!quizzesMap[note._id] ? (
            <button
              disabled
              style={{
                color: '#666',
                borderColor: '#ccc',
                fontSize: '0.875rem',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                border: '1px solid',
                cursor: 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <FaQuestionCircle />
              No Quiz Available
            </button>
          ) : quizMark >= 0 ? (
            <button
              disabled
              style={{
                backgroundColor: '#4CAF50',
                color: 'white',
                fontSize: '0.875rem',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                border: 'none',
                cursor: 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <FaCheckCircle />
              Submitted
            </button>
          ) : (
            <button
              onClick={() => navigate(`/student/quiz/attempt/${note._id}`)}
              style={{
                backgroundColor: 'black',
                color: 'white',
                fontSize: '0.875rem',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <FaQuestionCircle />
              Attempt Quiz
            </button>
          )}

          {codingQuestionsMap[note._id] ? (
            codingQuestionsMap[note._id].submitted ? (
              <button
                disabled
                style={{
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  fontSize: '0.875rem',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  border: 'none',
                  cursor: 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <FaCheckCircle />
                Submitted
              </button>
            ) : (
              <button
                onClick={() => navigate(`/student/code/attempt/${note._id}/${student._id}`)}
                style={{
                  backgroundColor: 'black',
                  color: 'white',
                  fontSize: '0.875rem',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <FaCode />
                Attempt Coding
              </button>
            )
          ) : (
            <button
              disabled
              style={{
                color: '#666',
                borderColor: '#ccc',
                fontSize: '0.875rem',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                border: '1px solid',
                cursor: 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <FaCode />
              No Coding Question
            </button>
          )}

          <button
            onClick={viewAssignment}
            style={{
              backgroundColor: 'black',
              color: 'white',
              fontSize: '0.875rem',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <FaFileAlt />
            View Assignment
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
          {assignmentMark === -2 ? (
            <>
              <input
                type="file"
                accept="application/pdf"
                onChange={e => note.file = e.target.files[0]}
                style={{ flexGrow: 1, padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
              />
              <button
                title="Upload Answer"
                onClick={async () => {
                  if (!note.file) {
                    toast.warn('Please choose a PDF');
                    return;
                  }

                  const fd = new FormData();
                  fd.append('file', note.file);

                  try {
                    await axios.post(
                      `${import.meta.env.VITE_ADMIN_API}/notes/upload/${encodeURIComponent(batch.batchName)}/${module}/${encodeURIComponent(note.title)}/${encodeURIComponent(student.user.name)}/${student._id}/${student.rollNo}/${note.day}`,
                      fd
                    );
                    toast.success('Answer uploaded successfully');
                  } catch (err) {
                    console.error(err);
                    toast.error('Upload failed');
                  }
                }}
                style={{
                  backgroundColor: 'black',
                  color: 'white',
                  padding: '0.5rem',
                  borderRadius: '4px',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <FaUpload />
              </button>
            </>
          ) : assignmentMark === -1 ? (
            <p style={{ color: 'orange', fontWeight: 'bold' }}>Submitted (Pending Evaluation)</p>
          ) : (
            <p style={{ color: 'green', fontWeight: 'bold' }}>Mark: {assignmentMark}</p>
          )}
        </div>
      </div>
    );
  };

  if (loading) return <SkeletonLoader />;

  if (!student || !batch) {
    return <p className="text-center mt-6 text-gray-500">Loading...</p>;
  }

  const currentModuleNotes = notesMap[activeModule] || { today: [], others: [] };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 0' }}>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '2rem', color: '#333' }}>
          My Batch: <span style={{ color: '#1976d2' }}>{batch.batchName}</span>
        </h2>
      </div>

      <div style={{ marginBottom: '2rem', borderBottom: '1px solid #e0e0e0', display: 'flex', overflowX: 'auto' }}>
        {Object.keys(notesMap).map(module => (
          <button
            key={module}
            onClick={() => setActiveModule(module)}
            style={{
              padding: '0.75rem 1rem',
              border: 'none',
              backgroundColor: activeModule === module ? '#f0f0f0' : 'transparent',
              borderBottom: activeModule === module ? '2px solid #1976d2' : 'none',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 'bold',
              color: activeModule === module ? '#1976d2' : '#333',
              whiteSpace: 'nowrap',
            }}
          >
            {module}
          </button>
        ))}
      </div>

      <div style={{ marginBottom: '2.5rem' }}>
        {currentModuleNotes.today.length > 0 && (
          <div style={{ marginBottom: '2.5rem' }}>
            <h3 style={{ color: 'green', marginBottom: '1rem' }}>Latest Note</h3>
            {currentModuleNotes.today.map((note, index) =>
              renderNoteCard(note, student, batchId, activeModule, true, index)
            )}
          </div>
        )}

        {currentModuleNotes.others.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            {currentModuleNotes.others.map((note, index) =>
              renderNoteCard(note, student, batchId, activeModule, false, index)
            )}
          </div>
        )}

        {currentModuleNotes.today.length === 0 && currentModuleNotes.others.length === 0 && (
          <p style={{ color: '#666' }}>No notes uploaded yet.</p>
        )}
      </div>
    </div>
  );
}