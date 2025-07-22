import React, { useState } from "react";
import axios from "axios";

const languages = [
  { id: 71, name: "Python (3.8.1)" },
  { id: 62, name: "Java (OpenJDK 13.0.1)" },
  { id: 54, name: "C++ (GCC 9.2.0)" },
  { id: 63, name: "JavaScript (Node.js 12.14.0)" },
];
const CodeEval = ({ sourceCode: initialCode = "", languageId, onClose }) => {
  const [language, setLanguage] = useState(
    languages.find((l) => l.id === languageId) || languages[0]
  );
  const [sourceCode, setSourceCode] = useState(initialCode);

  const [testCases, setTestCases] = useState([
    { input: "", expectedOutput: "", result: null },
    { input: "", expectedOutput: "", result: null },
    { input: "", expectedOutput: "", result: null },
  ]);

  const [isRunning, setIsRunning] = useState(false);

  const handleTestCaseChange = (index, field, value) => {
    const updated = [...testCases];
    updated[index][field] = value;
    setTestCases(updated);
  };

  const handleRun = async () => {
    setIsRunning(true);
    const updatedTestCases = [...testCases];

    for (let i = 0; i < updatedTestCases.length; i++) {
      const { input, expectedOutput } = updatedTestCases[i];

      try {
        const response = await axios.post("http://localhost:5000/run", {
          language_id: language.id,
          source_code: sourceCode,
          stdin: input,
        });

        const output = (response.data.stdout || "").trim();
        updatedTestCases[i].result =
          output === expectedOutput.trim() ? "Correct" : `Wrong (Got: ${output})`;
      } catch (err) {
        updatedTestCases[i].result = "❌ Error running code";
      }
    }

    setTestCases(updatedTestCases);
    setIsRunning(false);
  };

  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>

      <button onClick={onClose} style={{ float: 'right' }}>✕</button>
      <h1>🧠 Code Tester</h1>

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
            const value = sourceCode;
            const updated = value.substring(0, start) + "  " + value.substring(end);
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
          <label>Input #{idx + 1}:</label>
          <input
            type="text"
            value={test.input}
            onChange={(e) => handleTestCaseChange(idx, "input", e.target.value)}
            style={{ marginLeft: 10, width: 250 }}
          />
          <label style={{ marginLeft: 20 }}>Expected Output:</label>
          <input
            type="text"
            value={test.expectedOutput}
            onChange={(e) =>
              handleTestCaseChange(idx, "expectedOutput", e.target.value)
            }
            style={{ marginLeft: 10, width: 250 }}
          />
          {test.result && (
            <span style={{ marginLeft: 20 }}>
              {test.result.includes("✅") ? (
                <span style={{ color: "green" }}>{test.result}</span>
              ) : (
                <span style={{ color: "red" }}>{test.result}</span>
              )}
            </span>
          )}
        </div>
      ))}

      <button onClick={handleRun} disabled={isRunning} style={{ marginTop: 20 }}>
        ▶️ {isRunning ? "Running..." : "Run Tests"}
      </button>
    </div>
  );
};

export default CodeEval;
