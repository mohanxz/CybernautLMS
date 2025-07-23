import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { FaPlus, FaEdit, FaSave, FaUpload } from 'react-icons/fa';
import { toast } from 'react-toastify';

export default function BatchEvaluation() {
  const { batchId } = useParams();

  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    projectS3Url: '',
    theoryS3Url: '',
    studentMarks: [],
  });

  const [projectFile, setProjectFile] = useState(null);
  const [theoryFile, setTheoryFile] = useState(null);

  const backendBase = 'http://localhost:5002/api';

  useEffect(() => {
    if (batchId) fetchEvaluation();
  }, [batchId]);

  const fetchEvaluation = async () => {
    try {
      const evalRes = await axios.get(`${backendBase}/batch-evaluation/${batchId}`);
      const studentMarksWithUrls = await Promise.all(
        evalRes.data.studentMarks.map(async (s) => {
          const answerUrls = await fetchAnswerUrls(s.student);
          return {
            ...s,
            ...answerUrls,
          };
        })
      );

      setEvaluation(evalRes.data);
      setFormData({
        projectS3Url: evalRes.data.projectS3Url || '',
        theoryS3Url: evalRes.data.theoryS3Url || '',
        studentMarks: studentMarksWithUrls || [],
      });
    } catch (err) {
      if (err.response?.status === 404) {
        setEvaluation(null);
      } else {
        toast.error('Failed to load evaluation');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchAnswerUrls = async (student) => {
    try {
      const res = await axios.get(`${backendBase}/s3-answers`, {
        params: {
          batchName: batchId,
          studentName: student.user?.name,
          rollNo: student.rollNo,
        },
      });

      const checkUrl = async (url) => {
        try {
          await axios.head(url);
          return url;
        } catch {
          return null;
        }
      };

      const projectUrl = await checkUrl(res.data.projectAnswerUrl);
      const theoryUrl = await checkUrl(res.data.theoryAnswerUrl);

      return {
        projectAnswerUrl: projectUrl,
        theoryAnswerUrl: theoryUrl,
      };
    } catch (err) {
      console.error('Failed to fetch S3 answer URLs', err);
      return {};
    }
  };

  const createEvaluation = async () => {
    try {
      await axios.post(`${backendBase}/batch-evaluation`, { batch: batchId });
      toast.success('Evaluation added');
      fetchEvaluation();
    } catch (err) {
      toast.error('Failed to create evaluation');
    }
  };

  const handleMarksChange = (studentId, field, value) => {
    const updatedMarks = formData.studentMarks.map(s =>
      s.student._id === studentId ? { ...s, [field]: value } : s
    );
    setFormData(prev => ({ ...prev, studentMarks: updatedMarks }));
  };

  const uploadFile = async (type) => {
    const file = type === 'project' ? projectFile : theoryFile;
    if (!file) return toast.error('No file selected');

    const formDataUpload = new FormData();
    formDataUpload.append('file', file);

    try {
      const res = await axios.post(
        `http://localhost:5002/upload-${type}?batch=${batchId}&title=FinalEvaluation`,
        formDataUpload,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      const s3path = res.data.s3path;
      setFormData(prev => ({ ...prev, [`${type}S3Url`]: s3path }));

      await axios.put(`${backendBase}/batch-evaluation/${evaluation._id}`, {
        [type === 'project' ? 'projectS3Url' : 'theoryS3Url']: s3path,
      });

      toast.success(`${type === 'project' ? 'Project' : 'Theory'} file uploaded and updated`);
    } catch (err) {
      toast.error(`Failed to upload ${type}`);
    }
  };

  const saveEvaluation = async () => {
    try {
      await axios.put(`${backendBase}/batch-evaluation/${evaluation._id}`, {
        projectS3Url: formData.projectS3Url,
        theoryS3Url: formData.theoryS3Url,
        studentMarks: formData.studentMarks.map(s => ({
          student: s.student._id,
          projectMarks: s.projectMarks,
          theoryMarks: s.theoryMarks,
        })),
      });
      toast.success('Evaluation updated');
      setEditMode(false);
      fetchEvaluation();
    } catch (err) {
      toast.error('Failed to save');
    }
  };

  if (loading) return <div className="text-gray-500">Loading...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Project Evaluation Box */}
      <div className="p-4 border rounded-xl shadow bg-white">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-semibold">Project Evaluation</h2>
          {!evaluation && (
            <button onClick={createEvaluation} className="text-green-600 hover:text-green-800" title="Add">
              <FaPlus size={20} />
            </button>
          )}
          {evaluation && !editMode && (
            <button onClick={() => setEditMode(true)} className="text-blue-600 hover:text-blue-800" title="Edit">
              <FaEdit size={18} />
            </button>
          )}
        </div>

        {evaluation ? (
          <>
            {editMode && (
              <>
                <input type="file" accept=".pdf" className="mb-2" onChange={e => setProjectFile(e.target.files[0])} />
                <button
                  onClick={() => uploadFile('project')}
                  className="mb-2 px-2 py-1 bg-blue-600 text-white rounded flex items-center gap-2"
                >
                  <FaUpload /> Upload Project PDF
                </button>
              </>
            )}

            {formData.projectS3Url && (
              <a href={formData.projectS3Url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline block mb-2">
                View Uploaded Project
              </a>
            )}

            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th>Roll</th>
                  <th>Name</th>
                  <th>Marks</th>
                  <th>Answer</th>
                </tr>
              </thead>
              <tbody>
                {formData.studentMarks.map(s => (
                  <tr key={s.student._id} className="border-t">
                    <td>{s.student.rollNo}</td>
                    <td>{s.student.user?.name}</td>
                    <td>
                      {editMode ? (
                        <input
                          type="number"
                          className="w-16 border p-1 rounded"
                          value={s.projectMarks}
                          onChange={e => handleMarksChange(s.student._id, 'projectMarks', e.target.value)}
                        />
                      ) : (
                        s.projectMarks
                      )}
                    </td>
                    <td>
                      {s.projectAnswerUrl ? (
                        <a href={s.projectAnswerUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline">
                          View
                        </a>
                      ) : (
                        <span className="text-gray-500">NU</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ) : (
          <p className="text-gray-500">No evaluation added yet.</p>
        )}
      </div>

      {/* Theory Evaluation Box */}
      <div className="p-4 border rounded-xl shadow bg-white">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-semibold">Theory Evaluation</h2>
          {evaluation && !editMode && (
            <button onClick={() => setEditMode(true)} className="text-blue-600 hover:text-blue-800" title="Edit">
              <FaEdit size={18} />
            </button>
          )}
        </div>

        {evaluation ? (
          <>
            {editMode && (
              <>
                <input type="file" accept=".pdf" className="mb-2" onChange={e => setTheoryFile(e.target.files[0])} />
                <button
                  onClick={() => uploadFile('theory')}
                  className="mb-2 px-2 py-1 bg-blue-600 text-white rounded flex items-center gap-2"
                >
                  <FaUpload /> Upload Theory PDF
                </button>
              </>
            )}

            {formData.theoryS3Url && (
              <a href={formData.theoryS3Url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline block mb-2">
                View Uploaded Theory
              </a>
            )}

            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th>Roll</th>
                  <th>Name</th>
                  <th>Marks</th>
                  <th>Answer</th>
                </tr>
              </thead>
              <tbody>
                {formData.studentMarks.map(s => (
                  <tr key={s.student._id} className="border-t">
                    <td>{s.student.rollNo}</td>
                    <td>{s.student.user?.name}</td>
                    <td>
                      {editMode ? (
                        <input
                          type="number"
                          className="w-16 border p-1 rounded"
                          value={s.theoryMarks}
                          onChange={e => handleMarksChange(s.student._id, 'theoryMarks', e.target.value)}
                        />
                      ) : (
                        s.theoryMarks
                      )}
                    </td>
                    <td>
                      {s.theoryAnswerUrl ? (
                        <a href={s.theoryAnswerUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline">
                          View
                        </a>
                      ) : (
                        <span className="text-gray-500">NU</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {editMode && (
              <button
                onClick={saveEvaluation}
                className="mt-3 px-4 py-2 bg-black text-white rounded flex items-center gap-2"
              >
                <FaSave /> Save
              </button>
            )}
          </>
        ) : (
          <p className="text-gray-500">No evaluation added yet.</p>
        )}
      </div>
    </div>
  );
}
