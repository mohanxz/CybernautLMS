import React, { useEffect, useState } from 'react';
import axios from 'axios';
import API from '../api';
import { useNavigate } from 'react-router-dom';
import CalendarWidget from "../widgets/CalendarWidget";
import NotesWidget from '../widgets/NotesWidget';
import CourseProgressWidget from '../widgets/CourseProgressWidget';
import Quotes from '../widgets/Quotes';
import { FadeIn, SlideUp, LoadingSpinner } from "../../../shared/LoadingComponents";

function StudentHome() {
  const [student, setStudent] = useState(null);
  const [date, setDate] = useState(new Date());
  const [latestNote, setLatestNote] = useState(null);
  const [progress, setProgress] = useState({ coding: 0, quiz: 0, assignment: 0 });
  const [reports, setReports] = useState([]);
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('token');
        if (!token) return navigate('/');

        await new Promise(resolve => setTimeout(resolve, 800));
        
        const res = await axios.get('http://localhost:5004/auth/student/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStudent(res.data);
      } catch (err) {
        setError('Failed to load student data');
        console.error('Failed to load student:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, [navigate]);

  useEffect(() => {
    const allQuotes = Quotes();
    const randomIndex = Math.floor(Math.random() * allQuotes.length);
    setQuote(allQuotes[randomIndex]);
  }, []);

  useEffect(() => {
    const fetchLatestNote = async () => {
      try {
        if (!student?.batch) return;
        const token = localStorage.getItem('token');

        const batchRes = await API.get(`/student/batch/by-id/${student.batch}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const batch = batchRes.data;
        let latest = null;
        let maxDay = -1;

        for (const adminObj of batch.admins || []) {
          const moduleName = adminObj.module;

          const notesRes = await API.get(`/notes/${batch._id}/${moduleName}`, {
            headers: { Authorization: `Bearer ${token}` }
          });

          const notes = Array.isArray(notesRes.data) ? notesRes.data : notesRes.data.notes || [];
          const latestModuleNote = notes.reduce((acc, note) => {
            if ((note.day || 0) > (acc?.day || 0)) return note;
            return acc;
          }, null);

          if (latestModuleNote && latestModuleNote.day > maxDay) {
            latest = latestModuleNote;
            maxDay = latestModuleNote.day;
          }
        }

        setLatestNote(latest);
      } catch (err) {
        console.error("Error fetching latest note:", err);
      }
    };

    const fetchProgress = async () => {
      try {
        if (!student?._id) return;
        const res = await API.get(`/api/progress/${student._id}`);
        setProgress(res.data);
      } catch (err) {
        console.error("Failed to fetch progress:", err);
      }
    };

    const fetchReports = async () => {
      try {
        if (!student?._id) return;
        const res = await API.get(`/api/reports/${student._id}`);
        setReports(res.data);
      } catch (err) {
        console.error("Failed to fetch reports:", err);
      }
    };

    if (student) {
      fetchLatestNote();
      fetchProgress();
      fetchReports();
    }
  }, [student]);

  if (!student) return <p className="text-center mt-6 text-gray-500 dark:text-gray-400">Loading...</p>;

  if (loading) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900 min-h-screen p-6">
        <div className="max-w-screen mx-auto">
          <div className="mb-8">
            <div className="text-center md:text-left">
              <div className="h-10 bg-gray-300 rounded w-3/4 mb-3 animate-pulse"></div>
              <div className="h-8 bg-gray-300 rounded w-1/2 mb-4 animate-pulse"></div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg">
                <div className="h-5 bg-gray-300 rounded w-full mb-2 animate-pulse"></div>
                <div className="h-5 bg-gray-300 rounded w-3/4 animate-pulse"></div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="h-32 bg-gray-300 rounded-xl animate-pulse"></div>
            <div className="h-32 bg-gray-300 rounded-xl animate-pulse"></div>
            <div className="h-32 bg-gray-300 rounded-xl animate-pulse"></div>
            <div className="h-32 bg-gray-300 rounded-xl animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900 min-h-screen p-6">
        <div className="max-w-screen mx-auto">
          <div className="text-center">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
              <div className="text-red-600 dark:text-red-400 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">Error Loading Dashboard</h3>
              <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen p-6">
      <div className="max-w-screen mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
              Welcome back, {student.user?.name}!
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
              Here's your learning progress and today's activities
            </p>
            {quote && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border-l-4 border-blue-500 shadow-sm">
                <div className="text-gray-700 dark:text-gray-300 italic">
                  <span className="text-base">"{quote.text}"</span>
                  <span className="block text-sm text-gray-500 dark:text-gray-400 mt-2 font-medium">— {quote.author}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Progress & Activities */}
          <div className="lg:col-span-2 space-y-8">
            {/* Course Progress Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                <div className="w-2 h-6 bg-blue-500 rounded-full mr-3"></div>
                Course Progress Overview
              </h2>
              <CourseProgressWidget progress={Math.round((progress.assignment + progress.quiz + progress.coding) / 3)} />
            </div>

            {/* Performance Metrics */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                <div className="w-2 h-6 bg-green-500 rounded-full mr-3"></div>
                Performance Metrics
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 rounded-xl p-6 text-center border border-blue-200 dark:border-blue-700">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-white font-bold text-lg">A</span>
                  </div>
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-300 block">{progress.assignment}%</span>
                  <p className="text-sm text-blue-700 dark:text-blue-400 mt-2 font-medium">Assignments</p>
                </div>
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900 dark:to-yellow-800 rounded-xl p-6 text-center border border-yellow-200 dark:border-yellow-700">
                  <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-white font-bold text-lg">Q</span>
                  </div>
                  <span className="text-2xl font-bold text-yellow-600 dark:text-yellow-300 block">{progress.quiz}%</span>
                  <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-2 font-medium">Quizzes</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800 rounded-xl p-6 text-center border border-purple-200 dark:border-purple-700">
                  <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-white font-bold text-lg">C</span>
                  </div>
                  <span className="text-2xl font-bold text-purple-600 dark:text-purple-300 block">{progress.coding}%</span>
                  <p className="text-sm text-purple-700 dark:text-purple-400 mt-2 font-medium">Coding Tasks</p>
                </div>
              </div>
            </div>

            {/* Latest Activity */}
            {latestNote && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                  <div className="w-2 h-6 bg-orange-500 rounded-full mr-3"></div>
                  Latest Activity
                </h2>
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900 dark:to-indigo-900 rounded-xl p-6 border border-blue-200 dark:border-blue-700">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Day {latestNote.day}: {latestNote.title}
                      </h3>
                      <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">Latest lesson available</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold">{latestNote.day}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <a
                      href={latestNote.meetlink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm font-medium"
                    >
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z"/>
                      </svg>
                      Join Meet
                    </a>
                    <a
                      href={latestNote.quizlink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 text-sm font-medium"
                    >
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd"/>
                        <path fillRule="evenodd" d="M4 5a2 2 0 012-2h8a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 3a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/>
                      </svg>
                      Take Quiz
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Academic Performance */}
            {reports.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                  <div className="w-2 h-6 bg-red-500 rounded-full mr-3"></div>
                  Academic Performance
                </h2>
                <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-600">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-4 text-left font-semibold text-gray-900 dark:text-white">Module</th>
                        <th className="px-6 py-4 text-left font-semibold text-gray-900 dark:text-white">Day</th>
                        <th className="px-6 py-4 text-center font-semibold text-gray-900 dark:text-white">Code</th>
                        <th className="px-6 py-4 text-center font-semibold text-gray-900 dark:text-white">Quiz</th>
                        <th className="px-6 py-4 text-center font-semibold text-gray-900 dark:text-white">Assignment</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                      {[...reports]
                        .sort((a, b) => b.day - a.day)
                        .map((report, idx) => (
                          <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">{report.module}</td>
                            <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{report.day}</td>
                            {report.marksObtained.map((mark, i) => (
                              <td className="px-6 py-4 text-center" key={i}>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  mark === -2
                                    ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                                    : mark === -1
                                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                                    : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                }`}>
                                  {mark === -2 ? "Not Submitted" : mark === -1 ? "Pending" : mark}
                                </span>
                              </td>
                            ))}
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-1 space-y-8">
            {/* Calendar Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                <div className="w-2 h-6 bg-indigo-500 rounded-full mr-3"></div>
                Calendar
              </h2>
              <CalendarWidget date={date} setDate={setDate} />
            </div>

            {/* Reminders Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                <div className="w-2 h-6 bg-pink-500 rounded-full mr-3"></div>
                Reminders
              </h2>
              <NotesWidget studentId={student._id} />
            </div>

            {/* Quick Stats */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 h-[300px] p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                <div className="w-2 h-6 bg-teal-500 rounded-full mr-3"></div>
                Quick Stats
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Reports</span>
                  <span className="text-lg font-bold text-teal-600 dark:text-teal-400">{reports.length}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Average Score</span>
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {Math.round((progress.assignment + progress.quiz + progress.coding) / 3)}%
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Current Day</span>
                  <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                    {latestNote ? latestNote.day : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentHome;