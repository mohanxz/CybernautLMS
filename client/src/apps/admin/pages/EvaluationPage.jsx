import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import API from '../api'; // Adjust the import based on your API setup

export default function EvaluateSubmissions() {
  const { batch, module, title, day } = useParams();
  const [submissions, setSubmissions] = useState([]);
  const [marks, setMarks] = useState({});
  const [loading, setLoading] = useState(true);
  

  const fetchSubmissions = async () => {
    try {
      const res = await axios.get(`${backendBase}/evaluate/${batch}/${module}/${title}/${day}`);
      setSubmissions(res.data);
    } catch (err) {
      console.error('Failed to load submissions:', err);
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [batch, module, title, day]);

  const handleMarkChange = (studentId, value) => {
    setMarks((prev) => ({ ...prev, [studentId]: value }));
  };

  const handleEvaluate = async (studentId) => {
    const mark = parseInt(marks[studentId]);
    if (isNaN(mark) || mark < 0 || mark > 100) {
      alert('Please enter a valid mark between 0 and 100');
      return;
    }

    try {
      await axios.post(`${backendBase}/evaluate`, {
        studentId,
        module,
        day,
        mark,
      });
      fetchSubmissions();
    } catch (err) {
      console.error('Failed to submit evaluation:', err);
      alert('Error submitting marks.');
    }
  };

  if (loading)
    return (
      <p className="text-center mt-8 text-gray-500 dark:text-gray-400">
        Loading submissions...
      </p>
    );

  return (
    <div className="p-6 max-w-5xl mx-auto text-gray-900 dark:text-white transition-colors duration-300">
      <h2 className="text-2xl font-bold mb-6 text-blue-800 dark:text-blue-300">
        Pending Assignment Evaluation – {decodeURIComponent(title)}
      </h2>

      {submissions.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-400">
          No submissions found yet.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full table-auto border border-gray-300 dark:border-gray-700 shadow-md">
            <thead className="bg-blue-100 dark:bg-gray-800">
              <tr>
                
                <th className="p-3 border dark:border-gray-700">Roll No</th>
                <th className="p-3 border dark:border-gray-700">Student Name</th>
                <th className="p-3 border dark:border-gray-700">Download Link</th>
                <th className="p-3 border dark:border-gray-700">Marks</th>
                <th className="p-3 border dark:border-gray-700">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900">
              {submissions.map((sub, index) => (
                <tr
                  key={index}
                  className="text-sm even:bg-gray-50 even:dark:bg-gray-800"
                >
                  <td className="p-3 border dark:border-gray-700">
                    {sub.studentRoll}
                  </td>
                  <td className="p-3 border dark:border-gray-700">
                    {sub.studentName}
                  </td>
                  <td className="p-3 border text-center dark:border-gray-700">
                    <a
                      href={sub.answerLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      View PDF
                    </a>
                  </td>
                  <td className="p-3 border text-center dark:border-gray-700">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      className="w-20 p-1 border rounded dark:bg-gray-700 dark:border-gray-600"
                      value={marks[sub.studentId] || ''}
                      onChange={(e) =>
                        handleMarkChange(sub.studentId, e.target.value)
                      }
                    />
                  </td>
                  <td className="p-3 border text-center dark:border-gray-700">
                    <button
                      className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                      onClick={() => handleEvaluate(sub.studentId)}
                    >
                      Evaluate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
