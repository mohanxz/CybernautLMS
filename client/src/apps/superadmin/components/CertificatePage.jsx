import React, { useEffect, useState } from 'react';
import axios from 'axios';


const EligibleStudentsPage = () => {
  const [data, setData] = useState([]);
  const [filteredBatch, setFilteredBatch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEligibilityData = async () => {
      try {
        const res = await axios.get('/api/superadmin/eligible');
        const result = Array.isArray(res.data) ? res.data : [res.data]; // wrap if single object
        setData(result);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data', err);
        setLoading(false);
      }
    };

    fetchEligibilityData();
  }, []);

  const filteredData = filteredBatch
    ? data.filter(d => d.batch.id === filteredBatch)
    : data;


  if (loading) return <p className="p-4">Loading...</p>;

  const allBatches = data.map(d => ({
    id: d.batch.id,
    name: d.batch.name,
    course: d.batch.course
  }));

  return (
    <div className="p-4">
      <h2 className="text-2xl font-semibold mb-4">Eligible Students</h2>

      {/* Batch Filter Dropdown */}
      <div className="mb-6">
        <label className="mr-2 font-medium">Filter by Batch:</label>
        <select
          className="border rounded px-2 py-1"
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
      </div>

      {filteredData.length === 0 ? (
        <p>No completed batches found.</p>
      ) : (
        filteredData.map(({ batch, eligible }) => (
          <div key={batch.id} className="mb-8 border rounded p-4 shadow-sm bg-white">
            <h3 className="text-lg font-bold mb-2">
              Batch: {batch.name} ({batch.course})
            </h3>
            <p className="text-sm text-gray-600 mb-4">Start Date: {new Date(batch.startDate).toDateString()}</p>

            <div className="mb-4">
              <h4 className="font-semibold text-green-700 mb-2">Eligible Students</h4>
              {eligible.length === 0 ? (
                <p className="text-sm text-gray-500">No eligible students.</p>
              ) : (
                <table className="w-full text-sm border mb-4">
                  <thead>
                    <tr className="bg-green-100">
                      <th className="border px-2 py-1">Roll No</th>
                      <th className="border px-2 py-1">Name</th>
                      <th className="border px-2 py-1">Email</th>
                      <th className="border px-2 py-1">Phone</th>
                      <th className="border px-2 py-1">DOB</th>
                      <th className="border px-2 py-1">Coding</th>
                      <th className="border px-2 py-1">Quiz</th>
                      <th className="border px-2 py-1">Assignment</th>
                      <th className="border px-2 py-1">Theory</th>
                      <th className="border px-2 py-1">Project</th>
                      <th className="border px-2 py-1">Final Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eligible
                      .sort((a, b) => b.marks.finalScore - a.marks.finalScore)
                      .map(s => (
                        <tr key={s._id} className="hover:bg-green-50">
                          <td className="border px-2 py-1">{s.rollNo}</td>
                          <td className="border px-2 py-1">{s.user.name}</td>
                          <td className="border px-2 py-1">{s.user.email}</td>
                          <td className="border px-2 py-1">{s.phone}</td>
                          <td className="border px-2 py-1">{new Date(s.dob).toLocaleDateString()}</td>
                          <td className="border px-2 py-1">{s.marks.codingTotal}</td>
                          <td className="border px-2 py-1">{s.marks.quizTotal}</td>
                          <td className="border px-2 py-1">{s.marks.assignmentTotal}</td>
                          <td className="border px-2 py-1">{s.marks.theoryMarks}</td>
                          <td className="border px-2 py-1">{s.marks.projectMarks}</td>
                          <td className="border px-2 py-1 font-bold text-green-700">{s.marks.finalScore}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default EligibleStudentsPage;
