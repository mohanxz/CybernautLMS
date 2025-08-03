import React, { useEffect, useState } from 'react';
import axios from 'axios';
import API from '../api';
import { toast } from 'react-toastify';

const CertificatePage = () => {
  const [data, setData] = useState([]);
  const [filteredBatch, setFilteredBatch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'eligible', 'ineligible', 'all'
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);

  const formatMark = (mark) => {
  if (mark === -2) return "NU";
  if (mark === -1) return "NE";
  return mark;
};


  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await API.get('/api/certificates/eligible');
        setData(res.data);
        console.log("Fetched data:", res.data);

      } catch (err) {
        console.error(err);
        toast.error('Failed to fetch student data');
      }
    };
    fetchData();
  }, []);

  const allBatches = data.map(d => ({
    id: d.batch.id,
    name: d.batch.name,
    course: d.batch.course
  }));

  const filteredData = data.filter(d =>
    !filteredBatch || d.batch.id === filteredBatch
  );

  const handleToggle = (id) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  const handleGenerate = async () => {
    if (selected.length === 0) {
      toast.warn('No students selected');
      return;
    }
    setLoading(true);
    try {
      await API.post('/api/superadmin/generate', { students: selected });
      toast.success('Certificates generated!');
      setSelected([]);
    } catch (err) {
      console.error(err);
      toast.error('Certificate generation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <h2 className="text-xl font-bold mb-6 text-gray-800 dark:text-white">
        Certificate Generation Panel
      </h2>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <select
          className="border rounded p-2 dark:bg-gray-800 dark:text-white"
          onChange={e => setFilteredBatch(e.target.value)}
          value={filteredBatch}
        >
          <option value="">All Batches</option>
          {allBatches.map(b => (
            <option key={b.id} value={b.id}>
              {b.name} ({b.course})
            </option>
          ))}
        </select>

        <select
          className="border rounded p-2 dark:bg-gray-800 dark:text-white"
          onChange={e => setStatusFilter(e.target.value)}
          value={statusFilter}
        >
          <option value="all">All</option>
          <option value="eligible">Eligible</option>
          <option value="ineligible">Ineligible</option>
        </select>
      </div>

      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-4 rounded text-sm text-yellow-800">
         <strong>Legend:</strong> NE = Not Evaluated, NU = Not Uploaded
      </div>


      {/* Table */}
      {filteredData.length === 0 ? (
        <p className="text-gray-700 dark:text-gray-300">No batches found.</p>
      ) : (
        filteredData.map(({ batch, eligible, ineligible }) => {
          const showEligible = statusFilter === 'all' || statusFilter === 'eligible';
          const showIneligible = statusFilter === 'all' || statusFilter === 'ineligible';

          return (
            <div key={batch.id} className="mb-10 bg-white dark:bg-gray-800 p-4 rounded shadow">
              <h3 className="text-lg font-semibold mb-1">
                Batch: {batch.name} ({batch.course})
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Start Date: {new Date(batch.startDate).toDateString()}
              </p>

              {/* Eligible */}
              {showEligible && (
                <>
                  <h4 className="font-semibold text-green-700 mb-2">Eligible Students</h4>
                  {eligible.length === 0 ? (
                    <p className="text-sm text-gray-500">None</p>
                  ) : (
                    <table className="w-full border text-sm mb-6 hidden md:table">
                      <thead className="bg-green-100">
                        <tr>
                          <th className="border p-2">Select</th>
                          <th className="border p-2">Roll No</th>
                          <th className="border p-2">Name</th>
                          <th className="border p-2">Coding</th>
                          <th className="border p-2">Quiz</th>
                          <th className="border p-2">Assignment</th>
                          <th className="border p-2">Theory</th>
                          <th className="border p-2">Project</th>
                          <th className="border p-2">Final Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {eligible.map(s => (
                          <tr key={s._id} className="hover:bg-green-50">
                            <td className="border p-2 text-center">
                              <input
                                type="checkbox"
                                checked={selected.includes(s._id)}
                                onChange={() => handleToggle(s._id)}
                              />
                            </td>
                            <td className="border p-2">{s.rollNo}</td>
                            <td className="border p-2">{s.user.name}</td>
                            <td className="border p-2">{formatMark(s.marks.codingTotal)}</td>
                            <td className="border p-2">{formatMark(s.marks.quizTotal)}</td>
                            <td className="border p-2">{formatMark(s.marks.assignmentTotal)}</td>
                            <td className="border p-2">{formatMark(s.marks.theoryMarks)}</td>
                            <td className="border p-2">{formatMark(s.marks.projectMarks)}</td>
                            <td className="border p-2 font-bold">{formatMark(s.marks.finalScore)}</td>

                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {/* Card View for Mobile - Eligible Students */}
                  <div className="md:hidden grid grid-cols-1 gap-4 mt-4">
                    {eligible.map(s => (
                      <div key={s._id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">Roll No: {s.rollNo}</span>
                          <input
                            type="checkbox"
                            checked={selected.includes(s._id)}
                            onChange={() => handleToggle(s._id)}
                            className="form-checkbox h-5 w-5 text-blue-600"
                          />
                        </div>
                        <p className="text-lg font-bold text-blue-600 dark:text-blue-400 mb-1">{s.user.name}</p>
                        <div className="grid grid-cols-2 gap-2 text-sm text-gray-700 dark:text-gray-300">
                          <div><strong>Coding:</strong> {formatMark(s.marks.codingTotal)}</div>
                          <div><strong>Quiz:</strong> {formatMark(s.marks.quizTotal)}</div>
                          <div><strong>Assignment:</strong> {formatMark(s.marks.assignmentTotal)}</div>
                          <div><strong>Theory:</strong> {formatMark(s.marks.theoryMarks)}</div>
                          <div><strong>Project:</strong> {formatMark(s.marks.projectMarks)}</div>
                          <div className="col-span-2 text-base font-bold"><strong>Final Score:</strong> {formatMark(s.marks.finalScore)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Ineligible */}
              {showIneligible && (
                <>
                  <h4 className="font-semibold text-red-700 mb-2">Ineligible Students</h4>
                  {ineligible.length === 0 ? (
                    <p className="text-sm text-gray-500">None</p>
                  ) : (
                    <table className="w-full border text-sm hidden md:table">
                      <thead className="bg-red-100">
                        <tr>
                          <th className="border p-2">Roll No</th>
                          <th className="border p-2">Name</th>
                          <th className="border p-2">Coding</th>
                          <th className="border p-2">Quiz</th>
                          <th className="border p-2">Assignment</th>
                          <th className="border p-2">Theory</th>
                          <th className="border p-2">Project</th>
                          <th className="border p-2">Final Score</th>
                          <th className="border p-2">Reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ineligible.map(s => (
                          <tr key={s._id} className="hover:bg-red-50 text-red-900">
                            <td className="border p-2">{s.rollNo}</td>
                            <td className="border p-2">{s.user.name}</td>
                            <td className="border p-2">{formatMark(s.marks.codingTotal)}</td>
                            <td className="border p-2">{formatMark(s.marks.quizTotal)}</td>
                            <td className="border p-2">{formatMark(s.marks.assignmentTotal)}</td>
                            <td className="border p-2">{formatMark(s.marks.theoryMarks)}</td>
                            <td className="border p-2">{formatMark(s.marks.projectMarks)}</td>
                            <td className="border p-2 font-bold">{formatMark(s.marks.finalScore)}</td>
                            <td className="border p-2 text-red-600">{s.reason || 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {/* Card View for Mobile - Ineligible Students */}
                  <div className="md:hidden grid grid-cols-1 gap-4 mt-4">
                    {ineligible.map(s => (
                      <div key={s._id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">Roll No: {s.rollNo}</span>
                          <span className="text-xs text-red-600 dark:text-red-400">{s.reason || 'N/A'}</span>
                        </div>
                        <p className="text-lg font-bold text-red-600 dark:text-red-400 mb-1">{s.user.name}</p>
                        <div className="grid grid-cols-2 gap-2 text-sm text-gray-700 dark:text-gray-300">
                          <div><strong>Coding:</strong> {formatMark(s.marks.codingTotal)}</div>
                          <div><strong>Quiz:</strong> {formatMark(s.marks.quizTotal)}</div>
                          <div><strong>Assignment:</strong> {formatMark(s.marks.assignmentTotal)}</div>
                          <div><strong>Theory:</strong> {formatMark(s.marks.theoryMarks)}</div>
                          <div><strong>Project:</strong> {formatMark(s.marks.projectMarks)}</div>
                          <div className="col-span-2 text-base font-bold"><strong>Final Score:</strong> {formatMark(s.marks.finalScore)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })
      )}

      {/* Generate Button */}
      {selected.length > 0 && (
        <button
          className={`mt-4 px-6 py-2 rounded text-white font-semibold ${
            loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-black hover:bg-gray-800'
          }`}
          disabled={loading}
          onClick={handleGenerate}
        >
          {loading
            ? 'Generating...'
            : `Generate ${selected.length} Certificate${selected.length > 1 ? 's' : ''}`}
        </button>
      )}
    </div>
  );
};

export default CertificatePage;
