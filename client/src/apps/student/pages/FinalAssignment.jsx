import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaPlayCircle } from "react-icons/fa";


const FinalAssignment = () => {
  const [modules, setModules] = useState([]);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchModules = async () => {
      try {
        const res = await axios.get("http://localhost:5003/api/final-quiz/available", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setModules(res.data);
      } catch (err) {
        console.error(err);
        alert("Failed to load modules");
      }
    };

    fetchModules();
  }, []);

  const handleAttempt = (module) => {
    window.location.href = `/student/final-quiz/${module}`;
  };

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem 0' }}>
      <h2 style={{ fontSize: '2rem', marginBottom: '2rem', color: '#333' }}>
        Final Assignment
      </h2>
      {modules.length === 0 ? (
        <p style={{ color: '#666' }}>No modules found</p>
      ) : (
        modules.map((m) => (
          <div key={m.module} style={{ marginBottom: '1.5rem', boxShadow: '0 4px 8px rgba(0,0,0,0.1)', borderRadius: '8px', backgroundColor: 'white' }}>
            <div style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: '#333' }}>{m.module}</h3>
              {m.hasQuiz ? (
                <button
                  onClick={() => handleAttempt(m.module)}
                  disabled={m.attempted}
                  style={{
                    marginTop: '1rem',
                    backgroundColor: m.attempted ? '#9e9e9e' : '#4CAF50',
                    color: 'white',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '4px',
                    border: 'none',
                    cursor: m.attempted ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <FaPlayCircle />
                  {m.attempted ? "Quiz Attempted" : "Attempt Quiz"}
                </button>
              ) : (
                <p style={{ color: '#666', marginTop: '0.5rem' }}>No quiz available</p>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default FinalAssignment;
