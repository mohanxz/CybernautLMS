import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import Editor from "@monaco-editor/react"; // import Monaco Editor


const languages = [
  { id: 50, name: "C (GCC 9.2.0)", monacoLang: "c" },
  { id: 54, name: "C++ (GCC 9.2.0)", monacoLang: "cpp" },
  { id: 62, name: "Java (OpenJDK 13.0.1)", monacoLang: "java" },
  { id: 71, name: "Python (3.8.1)", monacoLang: "python" },
  { id: 63, name: "JavaScript (Node.js 12.14.0)", monacoLang: "javascript" },
  { id: 51, name: "C# (Mono 6.6.0.161)", monacoLang: "csharp" },
  { id: 60, name: "Go (1.13.5)", monacoLang: "go" },
  { id: 68, name: "PHP (7.4.1)", monacoLang: "php" },
  { id: 73, name: "Ruby (2.7.0)", monacoLang: "ruby" },
  { id: 74, name: "Rust (1.40.0)", monacoLang: "rust" },
  { id: 43, name: "Assembly (NASM 2.14.02)", monacoLang: "asm" },
  { id: 46, name: "Bash (5.0.0)", monacoLang: "shell" },
  { id: 52, name: "Common Lisp (SBCL 2.0.0)", monacoLang: "lisp" },
  { id: 61, name: "Haskell (GHC 8.8.1)", monacoLang: "haskell" },
  { id: 64, name: "Kotlin (1.3.70)", monacoLang: "kotlin" },
  { id: 65, name: "Lua (5.3.5)", monacoLang: "lua" },
  { id: 67, name: "Perl (5.28.1)", monacoLang: "perl" },
  { id: 70, name: "Python (2.7.17)", monacoLang: "python" },
  { id: 75, name: "TypeScript (3.7.4)", monacoLang: "typescript" },
];

const AttemptCodingQuestion = () => {
  const { noteId,studentId } = useParams();
  const navigate = useNavigate();

  const [question, setQuestion] = useState(null);
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState(71); // Default: Python
  const [submitting, setSubmitting] = useState(false);

  const selectedLang = languages.find((lang) => lang.id === language)?.monacoLang || "plaintext";

  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`http://localhost:5003/api/coding/${noteId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setQuestion(res.data);
      } catch (err) {
        toast.error("Coding question not found.");
        navigate("/");
      }
    };
    fetchQuestion();
  }, [noteId, navigate]);

  const handleSubmit = async () => {
    if (!code.trim()) {
      toast.warn("Please enter your code before submitting.");
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem("token");

      await axios.post(
        `http://localhost:5003/api/coding/submit/${noteId}/${studentId}`,
        { code, language },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Code submitted successfully!");
      navigate("/student/reports");
    } catch (err) {
      toast.error("Submission failed.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!question) return <div className="text-white text-center mt-10">Loading coding question...</div>;

  return (
    <div className="container" style={{ padding: '2rem' }}>
      <div className="card" style={{ backgroundColor: 'white', color: 'black', borderRadius: '12px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)', padding: '1.5rem', marginBottom: '1rem' }}>
        <div className="card-content">
        <h4 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
            {question.title}
          </h4>
          <p style={{ whiteSpace: 'pre-line', marginBottom: '1.5rem' }}>
            {question.description}
          </p>

        <div style={{ marginBottom: '1.5rem' }}>
          <label htmlFor="language-select" style={{ display: 'block', marginBottom: '0.5rem' }}>Select Language</label>
          <select
            id="language-select"
            value={language}
            onChange={(e) => setLanguage(Number(e.target.value))}
            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
          >
            {languages.map((lang) => (
              <option key={lang.id} value={lang.id}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>
            {question.testCases?.filter(tc => !tc.hidden).length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h6 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>🧪 Sample Test Cases</h6>
                {question.testCases.filter(tc => !tc.hidden).map((tc, idx) => (
                  <div key={idx} style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#f0f0f0', borderRadius: '8px' }}>
                    <strong style={{ fontSize: '0.875rem' }}>Input #{idx + 1}:</strong>
                    <pre style={{ backgroundColor: 'white', padding: '0.5rem', borderRadius: '4px', overflowX: 'auto', fontSize: '0.875rem' }}>{(tc.input || []).join('\n')}</pre>
                    <strong style={{ marginTop: '0.5rem', display: 'block', fontSize: '0.875rem' }}>Expected Output:</strong>
                    <pre style={{ backgroundColor: 'white', padding: '0.5rem', borderRadius: '4px', overflowX: 'auto', fontSize: '0.875rem' }}>{tc.expectedOutput}</pre>
                  </div>
                ))}
              </div>
            )}

        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Your Code:</label>
        <div style={{ border: '1px solid', borderColor: '#ccc', borderRadius: '4px', overflow: 'hidden', marginBottom: '1.5rem' }}>
          <Editor
            height="500px"
            theme="vs-dark"
            language={selectedLang}
            value={code}
            onChange={(value) => setCode(value || "")}
            options={{
              fontSize: 14,
              minimap: { enabled: false },
              automaticLayout: true,
              scrollBeyondLastLine: false,
              wordWrap: "on",
            }}
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting}
          style={{
            backgroundColor: '#4CAF50',
            color: 'white',
            fontWeight: 'bold',
            padding: '0.75rem 1.5rem',
            borderRadius: '8px',
            opacity: submitting ? 0.7 : 1,
            cursor: submitting ? 'not-allowed' : 'pointer',
            border: 'none',
          }}
        >
          {submitting ? "Submitting..." : "Submit Code"}
        </button>
      </div>
    </div>
  </div>
  );
};

export default AttemptCodingQuestion;
