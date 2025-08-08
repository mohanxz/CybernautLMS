import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import API from "../api"; // Adjust the import path as necessary
import { toast } from "react-toastify";

const FinalQuiz = () => {
  const { module } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [timer, setTimer] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const res = await API.get(`/api/final-quiz/${module}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setQuiz(res.data);
        
        setAnswers(new Array(res.data.questions.length).fill(null));
        setTimer(res.data.questions.length * 60); // 60s per question
      } catch (err) {
        toast.error("Quiz not available.");
        navigate("/student/theory");
      }
    };

    fetchQuiz();
  }, [module, token, navigate]);

  useEffect(() => {
    if (timer <= 0) return;

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  const handleAnswerChange = (value) => {
    const newAnswers = [...answers];
    newAnswers[currentQ] = value;
    setAnswers(newAnswers);
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      await API.post(
        `/api/final-quiz/submit/${module}`,
        { answers },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Quiz submitted successfully!");
      navigate("/student/theory");
    } catch (err) {
      toast.error("Submission failed.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!quiz) return <div className="text-center mt-10 text-gray-600">Loading quiz...</div>;

  const currentQuestion = quiz.questions[currentQ];
  // Always convert options object to array for rendering
  const optionEntries = currentQuestion && currentQuestion.options
    ? Object.entries(currentQuestion.options)
    : [];

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {module} - Final Quiz
            </h1>
            <div className="text-right">
              <div className={`text-2xl font-bold ${timer <= 60 ? 'text-red-600' : 'text-blue-600'}`}>
                {formatTime(timer)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Time Remaining</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
              <span>Question {currentQ + 1} of {quiz.questions.length}</span>
              <span>{Math.round(((currentQ + 1) / quiz.questions.length) * 100)}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentQ + 1) / quiz.questions.length) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Question */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {currentQuestion.question}
            </h2>

            <div className="space-y-3">
              {optionEntries.map(([key, option]) => (
                <label
                  key={key}
                  className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                    answers[currentQ] === key
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${currentQ}`}
                    value={key}
                    checked={answers[currentQ] === key}
                    onChange={(e) => handleAnswerChange(e.target.value)}
                    className="mr-3 text-blue-600"
                  />
                  <span className="text-gray-900 dark:text-white">{option}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <button
              onClick={() => setCurrentQ(Math.max(0, currentQ - 1))}
              disabled={currentQ === 0}
              className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-400 transition-colors"
            >
              Previous
            </button>

            <div className="flex space-x-2">
              {quiz.questions.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentQ(idx)}
                  className={`w-10 h-10 rounded-lg font-medium transition-all duration-200 ${
                    idx === currentQ
                      ? 'bg-blue-600 text-white'
                      : answers[idx] !== null
                      ? 'bg-green-100 text-green-800 border border-green-300'
                      : 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>

            {currentQ === quiz.questions.length - 1 ? (
              <button
                onClick={handleSubmit}
                disabled={submitting || answers.some(a => a === null)}
                className="px-6 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-700 transition-colors font-medium"
              >
                {submitting ? "Submitting..." : "Submit Quiz"}
              </button>
            ) : (
              <button
                onClick={() => setCurrentQ(Math.min(quiz.questions.length - 1, currentQ + 1))}
                disabled={currentQ === quiz.questions.length - 1}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
              >
                Next
              </button>
            )}
          </div>

          {/* Answer Summary */}
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium">Progress:</span> {answers.filter(a => a !== null).length} of {quiz.questions.length} questions answered
            </div>
            {answers.some(a => a === null) && (
              <div className="text-sm text-orange-600 dark:text-orange-400 mt-1">
                Please answer all questions before submitting.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinalQuiz;