import React, { useEffect, useState } from "react";
import axios from "axios";
import API from "../api";
const languages = [
  { id: 71, name: "Python (3.8.1)" },
  { id: 62, name: "Java (OpenJDK 13.0.1)" },
  { id: 54, name: "C++ (GCC 9.2.0)" },
  { id: 63, name: "JavaScript (Node.js 12.14.0)" },
];

const CodeEval = ({ noteId, sourceCode: initialCode = "", languageId, onClose }) => {
  const [language, setLanguage] = useState(
    languages.find((l) => l.id === languageId) || languages[0]
  );
  const [sourceCode, setSourceCode] = useState(initialCode);
  const [testCases, setTestCases] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [questionTitle, setQuestionTitle] = useState("");

  useEffect(() => {
    setSourceCode(initialCode);
  }, [initialCode]);

  useEffect(() => {
    const lang = languages.find((l) => l.id === languageId);
    if (lang) setLanguage(lang);
  }, [languageId]);

  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await API.get(`/api/coding-questions/by-note/${noteId}`,
          { headers: { Authorization: `Bearer ${token}` } });
        const question = res.data[0];

        if (question) {
          setQuestionTitle(question.title);
          setLanguage(languages.find((l) => l.name.includes(question.language)) || languages[0]);
          setTestCases(
            question.testCases.map((tc) => ({
              input: (tc.input || []).join("\n"),
              expectedOutput: tc.expectedOutput,
              hidden: tc.hidden,
              result: null
            }))
          );
        }
      } catch (err) {
        console.error("Failed to load question:", err);
      }
    };

    fetchQuestion();
  }, [noteId]);


  const handleRun = async () => {
    setIsRunning(true);
    const updatedTestCases = [...testCases];

    const token = localStorage.getItem("token");
    for (let i = 0; i < updatedTestCases.length; i++) {
      const { input, expectedOutput } = updatedTestCases[i];
      try {
        const response = await API.post("/api/codeEval/run", {
          language_id: language.id,
          source_code: sourceCode,
          stdin: input,
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const output = (response.data.stdout || "").trim();
        updatedTestCases[i].result =
          output === expectedOutput.trim()
            ? "✅ Correct"
            : `❌ Wrong (Got: ${output})`;
      } catch (err) {
        updatedTestCases[i].result = "❌ Error running code";
      }
    }

    setTestCases(updatedTestCases);
    setIsRunning(false);
  };

  return (
  <div
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      background: "#fff",
      zIndex: 1000,
      overflowY: "auto",
      padding: "20px",
      fontFamily: "Arial",
    }}
  >
    <button onClick={onClose} style={{ position: "absolute", top: 10, right: 10 }}>
      ✕
    </button>

    <div style={{ paddingTop: 40 }}> {/* Push content below close button */}
      <h1>Code Tester</h1>
      <h2>{questionTitle}</h2>

      <label>Language:</label>
      <select
        value={language.id}
        onChange={(e) =>
          setLanguage(
            languages.find((lang) => lang.id === parseInt(e.target.value))
          )
        }
        style={{ marginLeft: 10 }}
      >
        {languages.map((lang) => (
          <option key={lang.id} value={lang.id}>
            {lang.name}
          </option>
        ))}
      </select>

      <br />
      <br />

      <textarea
        rows="10"
        cols="80"
        placeholder="Write your code here..."
        value={sourceCode}
        onChange={(e) => setSourceCode(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Tab") {
            e.preventDefault();
            const start = e.target.selectionStart;
            const end = e.target.selectionEnd;
            const updated =
              sourceCode.substring(0, start) + "  " + sourceCode.substring(end);
            setSourceCode(updated);
            setTimeout(() => {
              e.target.selectionStart = e.target.selectionEnd = start + 2;
            }, 0);
          }
        }}
      />

      <h3>🧪 Test Cases</h3>
      {testCases.map((test, idx) => (
        <div key={idx} style={{ marginBottom: 10 }}>
          <p>
            <b>Input #{idx + 1}:</b>{" "}
            <pre
              style={{
                display: "inline-block",
                background: "#eee",
                padding: "5px",
                overflowX: "auto",
                maxWidth: "100%",
              }}
            >
              {test.input}
            </pre>
          </p>
          <p>
            <b>Expected Output:</b>{" "}
            <pre
              style={{
                display: "inline-block",
                background: "#eee",
                padding: "5px",
                overflowX: "auto",
                maxWidth: "100%",
              }}
            >
              {test.expectedOutput}
            </pre>
          </p>
          {test.result && (
            <span
              style={{
                fontWeight: "bold",
                color: test.result.includes("✅") ? "green" : "red",
              }}
            >
              {test.result}
            </span>
          )}
        </div>
      ))}

      <div style={{ textAlign: "center", marginTop: 20 }}>
        <button onClick={handleRun} disabled={isRunning}>
          ▶️ {isRunning ? "Running..." : "Run Tests"}
        </button>
      </div>
    </div>
  </div>
);


};

export default CodeEval;
