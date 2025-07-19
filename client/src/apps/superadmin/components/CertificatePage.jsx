import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

export default function CertificatePage() {
  const [students, setStudents] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);  // ✅ New loading state

  useEffect(() => {
    const fetchEligibleStudents = async () => {
      try {
        const res = await axios.get("http://localhost:5001/api/certificates/eligible");
        setStudents(res.data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to fetch eligible students");
      }
    };

    fetchEligibleStudents();
  }, []);

  const toggleStudent = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  const handleGenerate = async () => {
    setLoading(true); // ✅ Start loading
    try {
      await axios.post("http://localhost:5001/api/certificates/generate", {
        students: selected
      });
      toast.success("Certificates generated and mailed!");
      setStudents((prev) => prev.filter(s => !selected.includes(s._id)));
      setSelected([]);
    } catch (err) {
      console.error(err);
      toast.error("Error generating certificates");
    } finally {
      setLoading(false); // ✅ Stop loading
    }
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
        Eligible Students for Certificates
      </h2>
      <div className="space-y-2">
        {students.map(student => (
          <div
            key={student._id}
            className="flex items-center gap-4 p-3 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
          >
            <input
              type="checkbox"
              checked={selected.includes(student._id)}
              onChange={() => toggleStudent(student._id)}
              className="accent-blue-600 dark:accent-blue-400"
              disabled={loading} // ✅ disable during loading
            />
            <span className="text-gray-900 dark:text-white">
              {student.user.name} - {student.user.email}
            </span>
          </div>
        ))}
      </div>
      {selected.length > 0 && (
        <button
          className={`mt-4 px-6 py-2 rounded text-white ${
            loading ? 'bg-gray-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
          }`}
          onClick={handleGenerate}
          disabled={loading}
        >
          {loading ? 'Generating...' : 'Generate Certificates'}
        </button>
      )}
    </div>
  );
}
