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
    <div className="bg-black text-white min-h-screen flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-5xl bg-white text-black rounded-lg shadow-lg p-6 space-y-6">
        <h2 className="text-2xl font-bold">{question.title}</h2>
        <p className="text-sm text-gray-700 whitespace-pre-line">{question.description}</p>

        <div>
          <label className="block font-medium mb-2">Select Language:</label>
          <select
            className="w-full border border-gray-300 rounded p-2 mb-4"
            value={language}
            onChange={(e) => setLanguage(Number(e.target.value))}
          >
            {languages.map((lang) => (
              <option key={lang.id} value={lang.id}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>
            {question.testCases?.filter(tc => !tc.hidden).length > 0 && (
  <div>
    <h3 className="text-lg font-semibold mt-6 mb-2">🧪 Sample Test Cases</h3>
    {question.testCases.filter(tc => !tc.hidden).map((tc, idx) => (
      <div key={idx} className="mb-4 bg-gray-100 p-3 rounded">
        <p><strong>Input #{idx + 1}:</strong></p>
        <pre className="bg-white p-2 rounded text-sm overflow-x-auto">{(tc.input || []).join('\n')}</pre>
        <p className="mt-2"><strong>Expected Output:</strong></p>
        <pre className="bg-white p-2 rounded text-sm overflow-x-auto">{tc.expectedOutput}</pre>
      </div>
    ))}
  </div>
)}

        <label className="block font-medium mb-2">Your Code:</label>
        <div className="border border-gray-300 rounded">
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
          className="bg-green-600 text-white font-semibold px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50"
        >
          {submitting ? "Submitting..." : "Submit Code"}
        </button>
      </div>
    </div>
  );
};

export default AttemptCodingQuestion;
