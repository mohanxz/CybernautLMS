import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaClipboardList, FaCheckCircle, FaTimesCircle } from "react-icons/fa";


const ReportListSkeleton = () => (
  <div style={{ padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)', marginBottom: '1rem' }}>
    <div style={{ width: '30%', height: '40px', backgroundColor: '#f0f0f0', marginBottom: '1.5rem' }} />
    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
      <div style={{ width: '150px', height: '50px', backgroundColor: '#f0f0f0', borderRadius: '8px' }} />
      <div style={{ width: '150px', height: '50px', backgroundColor: '#f0f0f0', borderRadius: '8px' }} />
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {[...Array(3)].map((_, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', border: '1px solid #e0e0e0', borderRadius: '8px' }}>
          <div>
            <div style={{ width: '100px', height: '25px', backgroundColor: '#f0f0f0', marginBottom: '0.5rem' }} />
            <div style={{ width: '70px', height: '20px', backgroundColor: '#f0f0f0' }} />
          </div>
          <div style={{ width: '80px', height: '40px', backgroundColor: '#f0f0f0', borderRadius: '8px' }} />
        </div>
      ))}
    </div>
  </div>
);

const ReportList = () => {
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [selectedModule, setSelectedModule] = useState("All");
  const [selectedDay, setSelectedDay] = useState("All");
  const [loading, setLoading] = useState(true);

  const [selectedReport, setSelectedReport] = useState(null);
  const [quizDetail, setQuizDetail] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");

        const profileRes = await axios.get("http://localhost:5004/auth/student/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const studentId = profileRes.data._id;

        const res = await axios.get(
          `http://localhost:5003/api/quizreports/quiz-attempts?studentId=${studentId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setReports(res.data);
        setFilteredReports(res.data);
      } catch (err) {
        console.error("Failed to fetch reports:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  useEffect(() => {
    let filtered = [...reports];

    if (selectedModule !== "All") {
      filtered = filtered.filter((r) => r.module === selectedModule);
    }

    if (selectedDay !== "All") {
      filtered = filtered.filter((r) => r.day === parseInt(selectedDay));
    }

    setFilteredReports(filtered);
  }, [selectedModule, selectedDay, reports]);

  const openModal = async (noteId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `http://localhost:5003/api/quizreports/quiz-detail/${noteId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSelectedReport(noteId);
      setQuizDetail(res.data);
      setModalOpen(true);
    } catch (err) {
      console.error("Failed to fetch quiz details:", err);
    }
  };

  const closeModal = () => {
    setSelectedReport(null);
    setQuizDetail(null);
    setModalOpen(false);
  };

  if (loading) return <ReportListSkeleton />;

  const uniqueModules = ["All", ...new Set(reports.map((r) => r.module))];
  const uniqueDays = ["All", ...new Set(reports.map((r) => r.day))];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 0' }}>
      <div style={{ padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
        <div style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FaClipboardList /> Quiz Reports
          </h2>

          {/* Filter Section */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ minWidth: '180px' }}>
              <label htmlFor="module-select" style={{ display: 'block', marginBottom: '0.5rem' }}>Module</label>
              <select
                id="module-select"
                value={selectedModule}
                onChange={(e) => setSelectedModule(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
              >
                {uniqueModules.map((mod, idx) => (
                  <option key={idx} value={mod}>
                    Module: {mod}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ minWidth: '180px' }}>
              <label htmlFor="day-select" style={{ display: 'block', marginBottom: '0.5rem' }}>Day</label>
              <select
                id="day-select"
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
              >
                {uniqueDays.map((d, idx) => (
                  <option key={idx} value={d}>
                    Day: {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filteredReports.length === 0 ? (
            <p style={{ color: '#666' }}>No reports found.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {filteredReports.map((report, index) => (
                <div
                  key={index}
                  style={{ border: '1px solid #e0e0e0', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderRadius: '8px' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1.125rem', marginBottom: '0.25rem' }}>
                        Module: {report.module}
                      </h3>
                      <p style={{ fontSize: '0.875rem', color: '#666' }}>Day {report.day}</p>
                    </div>
                    <button
                      onClick={() => openModal(report.noteId)}
                      style={{
                        backgroundColor: 'black',
                        color: 'white',
                        textTransform: 'none',
                        padding: '0.0.5rem 1rem',
                        borderRadius: '4px',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {modalOpen && (
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
              <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', maxWidth: '800px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e0e0e0', paddingBottom: '1rem', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1.5rem' }}>Quiz Review</h3>
                  <button onClick={closeModal} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>
                    &times;
                  </button>
                </div>
                <div style={{ padding: '1rem 0' }}>
                  {quizDetail && (
                    <>
                      <p style={{ marginBottom: '1rem' }}>
                        Score: {quizDetail.score} / {quizDetail.total}
                      </p>

                      {quizDetail.detail.map((item, idx) => {
                        const { question, options, selected, correct } = item;

                        return (
                          <div key={idx} style={{ borderBottom: '1px solid #e0e0e0', padding: '1rem 0', marginBottom: '1rem' }}>
                            <p style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
                              {idx + 1}. {question}
                            </p>
                            {["A", "B", "C", "D"].map((opt) => (
                              <div
                                key={opt}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  padding: '0.75rem',
                                  borderRadius: '4px',
                                  border: `1px solid ${
                                    selected === opt
                                      ? (opt === correct ? 'green' : 'red')
                                      : (opt === correct ? 'lightgreen' : '#ccc')
                                  }`,
                                  backgroundColor: selected === opt
                                    ? (opt === correct ? '#e6ffe6' : '#ffe6e6')
                                    : (opt === correct ? '#f0fff0' : '#f9f9f9'),
                                  marginBottom: '0.5rem',
                                }}
                              >
                                <span style={{ fontWeight: 'bold', marginRight: '0.5rem' }}>{opt}.</span>
                                <span>{options[opt]}</span>
                                {selected === opt && (
                                  <span style={{ marginLeft: 'auto' }}>
                                    {opt === correct ? (
                                      <FaCheckCircle style={{ color: 'green' }} />
                                    ) : (
                                      <FaTimesCircle style={{ color: 'red' }} />
                                    )}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </>
                  )}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid #e0e0e0' }}>
                  <button onClick={closeModal} style={{ backgroundColor: '#007bff', color: 'white', padding: '0.5rem 1rem', borderRadius: '4px', border: 'none', cursor: 'pointer' }}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportList;
