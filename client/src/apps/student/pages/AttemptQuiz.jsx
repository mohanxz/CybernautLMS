import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {toast} from "react-toastify";

const AttemptQuiz = () => {
  const { noteId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [timer, setTimer] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Fetch quiz
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`http://localhost:5003/api/quiz/${noteId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setQuiz(res.data);
        setAnswers(new Array(res.data.questions.length).fill(null));
        setTimer(res.data.questions.length * 60); // 60s per question
      } catch (err) {
        alert("Quiz not found.");
        navigate("/");
      }
    };
    fetchQuiz();
  }, [noteId, navigate]);

  // Fullscreen mode on load
  useEffect(() => {
    const enterFullScreen = async () => {
      try {
        await document.documentElement.requestFullscreen();
      } catch (err) {
        console.error("Fullscreen failed:", err);
      }
    };
    enterFullScreen();
  }, []);

  // Auto-submit on fullscreen exit or refresh/back
  useEffect(() => {
    const handleFullScreenExit = () => {
      if (!document.fullscreenElement && !submitting) {
        handleSubmit();
      }
    };

    const handleUnload = (e) => {
      e.preventDefault();
      handleSubmit();
    };

    document.addEventListener("fullscreenchange", handleFullScreenExit);
    window.addEventListener("beforeunload", handleUnload);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullScreenExit);
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, [answers, quiz, submitting]);

  // Timer countdown
  useEffect(() => {
    if (timer <= 0) {
      handleSubmit();
      return;
    }
    const t = setTimeout(() => setTimer(timer - 1), 1000);
    return () => clearTimeout(t);
  }, [timer]);

  const handleSelect = (index, option) => {
    const updated = [...answers];
    updated[index] = option;
    setAnswers(updated);
  };

  const handleSubmit = async () => {
    if (submitting || !quiz) return;
    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `http://localhost:5003/api/quiz/submit/${noteId}`,
        { answers },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Quiz submitted successfully!");
      navigate("/student/reports");
    } catch (err) {
      console.error("Submission error:", err);
      toast.error("Error submitting quiz.");
      setSubmitting(false);
    }
  };

  if (!quiz) return <div className="text-center mt-10 text-white">Loading Quiz...</div>;

  const q = quiz.questions[currentQ];
  if (!q || !q.options) return <div className="text-white">Invalid question format.</div>;

  const formatTime = () => {
    const mins = String(Math.floor(timer / 60)).padStart(2, "0");
    const secs = String(timer % 60).padStart(2, "0");
    return `${mins}:${secs}`;
  };

  return (
    <div className="container" style={{ padding: '2rem' }}>
      <div className="card" style={{ backgroundColor: 'white', color: 'black', borderRadius: '12px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)', padding: '1.5rem' }}>
        <div className="card-content">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e0e0e0', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.5rem' }}>
              Question {currentQ + 1} of {quiz.questions.length}
            </h2>
            <h3 style={{ fontSize: '1.25rem', color: 'red' }}>
              Time Left: {formatTime()}
            </h3>
          </div>

        {/* Question */}
        <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{q.question}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {["A", "B", "C", "D"].map((opt) => (
                <button
                  key={opt}
                  onClick={() => handleSelect(currentQ, opt)}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    textAlign: 'left',
                    border: `1px solid ${answers[currentQ] === opt ? '#1976d2' : '#ccc'}`,
                    borderRadius: '4px',
                    backgroundColor: answers[currentQ] === opt ? 'black' : '#f5f5f5',
                    color: answers[currentQ] === opt ? 'white' : 'black',
                    cursor: 'pointer',
                    transition: 'background-color 0.3s, border-color 0.3s',
                  }}
                >
                  {opt}. {q.options?.[opt] || ""}
                </button>
              ))}
            </div>
          </div>

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1.5rem', borderTop: '1px solid #e0e0e0' }}>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => setCurrentQ(currentQ - 1)}
                disabled={currentQ === 0}
                style={{
                  backgroundColor: 'black',
                  color: 'white',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  cursor: currentQ === 0 ? 'not-allowed' : 'pointer',
                  opacity: currentQ === 0 ? 0.3 : 1,
                  border: 'none',
                }}
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentQ(currentQ + 1)}
                disabled={currentQ === quiz.questions.length - 1}
                style={{
                  backgroundColor: 'black',
                  color: 'white',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  cursor: currentQ === quiz.questions.length - 1 ? 'not-allowed' : 'pointer',
                  opacity: currentQ === quiz.questions.length - 1 ? 0.3 : 1,
                  border: 'none',
                }}
              >
                Next
              </button>
            </div>
            <button
              onClick={handleSubmit}
              style={{
                backgroundColor: '#4CAF50',
                color: 'white',
                fontWeight: 'bold',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                border: 'none',
              }}
            >
              Submit Quiz
            </button>
          </div>

        <div style={{ marginTop: '1.5rem' }}>
            <h4 style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>Jump to:</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {quiz.questions.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentQ(idx)}
                  style={{
                    minWidth: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    fontWeight: 'bold',
                    backgroundColor: idx === currentQ
                      ? 'black'
                      : answers[idx]
                      ? '#4CAF50'
                      : 'white',
                    color: idx === currentQ || answers[idx]
                      ? 'white'
                      : 'black',
                    border: `1px solid ${
                      idx === currentQ
                        ? 'black'
                        : answers[idx]
                        ? '#4CAF50'
                        : '#ccc'
                    }`,
                    cursor: 'pointer',
                  }}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttemptQuiz;