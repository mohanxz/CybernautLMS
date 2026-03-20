import React, { useEffect, useState, useCallback } from "react";
import API from "../api";
import { 
  FaTimes, 
  FaPlay, 
  FaSpinner, 
  FaCheckCircle, 
  FaTimesCircle,
  FaCode,
  FaSave,
  FaTrash,
  FaCopy,
  FaDownload,
  FaEye,
  FaEyeSlash
} from "react-icons/fa";
import { toast } from "react-toastify";
import Editor from "@monaco-editor/react";

const languages = [
  { id: 71, name: "Python (3.8.1)", extension: "py", monaco: "python" },
  { id: 62, name: "Java (OpenJDK 13.0.1)", extension: "java", monaco: "java" },
  { id: 54, name: "C++ (GCC 9.2.0)", extension: "cpp", monaco: "cpp" },
  { id: 63, name: "JavaScript (Node.js 12.14.0)", extension: "js", monaco: "javascript" },
];

const CodeEval = ({
  noteId,
  sourceCode: initialCode = "",
  languageId,
  onClose,
  onSave,
  readOnly = false,
  showControls = true
}) => {
  const [language, setLanguage] = useState(
    languages.find((l) => l.id === languageId) || languages[0]
  );
  const [sourceCode, setSourceCode] = useState(initialCode);
  const [testCases, setTestCases] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [questionTitle, setQuestionTitle] = useState("");
  const [question, setQuestion] = useState(null);
  const [showExpectedOutput, setShowExpectedOutput] = useState({});
  const [activeTab, setActiveTab] = useState("testcases"); // 'testcases' or 'results'
  const [runResults, setRunResults] = useState([]);
  const [editorHeight, setEditorHeight] = useState("400px");
  const [copySuccess, setCopySuccess] = useState(false);

  // Load saved code from localStorage
  useEffect(() => {
    const savedCode = localStorage.getItem(`code_${noteId}_${language.id}`);
    if (savedCode && !initialCode) {
      setSourceCode(savedCode);
    }
  }, [noteId, language.id, initialCode]);

  // Auto-save code to localStorage
  useEffect(() => {
    if (sourceCode && !readOnly) {
      const timeoutId = setTimeout(() => {
        localStorage.setItem(`code_${noteId}_${language.id}`, sourceCode);
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [sourceCode, noteId, language.id, readOnly]);

  useEffect(() => {
    setSourceCode(initialCode);
  }, [initialCode]);

  useEffect(() => {
    const lang = languages.find((l) => l.id === languageId);
    if (lang) setLanguage(lang);
  }, [languageId]);

  const fetchQuestion = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await API.get(`/api/coding-questions/by-note/${noteId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.data && res.data.length > 0) {
        const q = res.data[0];
        setQuestion(q);
        setQuestionTitle(q.title);
        
        const lang = languages.find((l) => l.name.includes(q.language)) || languages[0];
        setLanguage(lang);
        
        const formattedTestCases = q.testCases.map((tc, index) => ({
          id: index,
          input: Array.isArray(tc.input) ? tc.input.join("\n") : tc.input || "",
          expectedOutput: tc.expectedOutput || "",
          hidden: tc.hidden || false,
          result: null,
          actualOutput: null,
          passed: null,
          error: null,
          executionTime: null
        }));
        
        setTestCases(formattedTestCases);
        
        // Initialize visibility for hidden test cases
        const initialVisibility = {};
        formattedTestCases.forEach((tc, idx) => {
          if (tc.hidden) initialVisibility[idx] = false;
        });
        setShowExpectedOutput(initialVisibility);
      }
    } catch (err) {
      console.error("Failed to load question:", err);
      toast.error("Failed to load coding question");
    }
  }, [noteId]);

  useEffect(() => {
    fetchQuestion();
  }, [fetchQuestion]);

  const handleRun = async () => {
    if (!sourceCode.trim()) {
      toast.warning("Please write some code first");
      return;
    }

    setIsRunning(true);
    setRunResults([]);
    setActiveTab("results");

    const token = localStorage.getItem("token");
    const results = [];

    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      const startTime = performance.now();
      
      try {
        const response = await API.post(
          "/api/codeEval/run",
          {
            language_id: language.id,
            source_code: sourceCode,
            stdin: testCase.input,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 10000 // 10 second timeout
          }
        );

        const executionTime = performance.now() - startTime;
        const output = (response.data.stdout || "").trim();
        const error = response.data.stderr || response.data.compile_output || "";
        const expected = testCase.expectedOutput.trim();
        
        const passed = output === expected && !error;
        
        const result = {
          testCaseId: i,
          passed,
          output,
          expected,
          error: error || null,
          executionTime: executionTime.toFixed(2),
          hidden: testCase.hidden
        };
        
        results.push(result);
        
        // Update test cases state
        setTestCases(prev => prev.map((tc, idx) => 
          idx === i 
            ? { 
                ...tc, 
                result: passed ? "✅ Passed" : "❌ Failed",
                actualOutput: output,
                error: error || null,
                passed 
              }
            : tc
        ));

        // Show toast for failed test cases (only if not hidden)
        if (!passed && !testCase.hidden) {
          toast.error(`Test case ${i + 1} failed`);
        }
      } catch (err) {
        console.error(`Test case ${i + 1} error:`, err);
        
        const errorResult = {
          testCaseId: i,
          passed: false,
          output: null,
          expected: testCase.expectedOutput,
          error: err.response?.data?.error || err.message || "Execution failed",
          executionTime: null,
          hidden: testCase.hidden
        };
        
        results.push(errorResult);
        
        setTestCases(prev => prev.map((tc, idx) => 
          idx === i 
            ? { 
                ...tc, 
                result: "❌ Error",
                error: errorResult.error,
                passed: false 
              }
            : tc
        ));

        if (!testCase.hidden) {
          toast.error(`Test case ${i + 1}: ${errorResult.error}`);
        }
      }
    }

    setRunResults(results);
    setIsRunning(false);

    // Calculate and show summary
    const passedCount = results.filter(r => r.passed).length;
    const totalCount = results.length;
    
    if (passedCount === totalCount) {
      toast.success(`🎉 All ${totalCount} test cases passed!`);
    } else {
      toast.info(`${passedCount}/${totalCount} test cases passed`);
    }
  };

  const handleSave = async () => {
    if (!sourceCode.trim()) {
      toast.warning("Cannot save empty code");
      return;
    }

    setIsSaving(true);
    try {
      const token = localStorage.getItem("token");
      const studentId = JSON.parse(atob(token.split('.')[1])).id;
      
      await API.post("/api/code-submissions/save", {
        studentId,
        noteId,
        language: language.name,
        language_id: language.id,
        code: sourceCode
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      localStorage.removeItem(`code_${noteId}_${language.id}`); // Clear auto-save
      toast.success("Code saved successfully");
      
      if (onSave) onSave();
    } catch (err) {
      console.error("Failed to save code:", err);
      toast.error("Failed to save code");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(sourceCode);
    setCopySuccess(true);
    toast.success("Code copied to clipboard");
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleDownloadCode = () => {
    const element = document.createElement("a");
    const file = new Blob([sourceCode], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `solution.${language.extension}`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success("Code downloaded");
  };

  const handleResetCode = () => {
    if (window.confirm("Reset to original code? This cannot be undone.")) {
      setSourceCode(initialCode);
      localStorage.removeItem(`code_${noteId}_${language.id}`);
      toast.info("Code reset to original");
    }
  };

  const toggleExpectedOutput = (index) => {
    setShowExpectedOutput(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const getStatusIcon = (passed) => {
    if (passed === null) return null;
    return passed ? (
      <FaCheckCircle className="text-green-500" />
    ) : (
      <FaTimesCircle className="text-red-500" />
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden relative mx-4">
        
        {/* Header */}
        <div className="bg-gray-100 dark:bg-gray-800 p-4 border-b border-gray-300 dark:border-gray-700 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <FaCode className="text-2xl text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {questionTitle || "Code Editor"}
              </h2>
              {question?.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {question.description}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-300 dark:hover:bg-gray-700 rounded-full transition"
            aria-label="Close"
          >
            <FaTimes className="text-xl" />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row h-[calc(95vh-80px)]">
          
          {/* Left Panel - Code Editor */}
          <div className="lg:w-2/3 border-r border-gray-300 dark:border-gray-700 flex flex-col">
            
            {/* Editor Toolbar */}
            <div className="p-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700 flex flex-wrap gap-2 justify-between">
              <div className="flex gap-2">
                <select
                  value={language.id}
                  onChange={(e) => {
                    const newLang = languages.find(l => l.id === parseInt(e.target.value));
                    setLanguage(newLang);
                    toast.info(`Switched to ${newLang.name}`);
                  }}
                  className="px-3 py-1 border rounded-lg bg-white dark:bg-gray-700 dark:text-white"
                  disabled={readOnly}
                >
                  {languages.map((lang) => (
                    <option key={lang.id} value={lang.id}>
                      {lang.name}
                    </option>
                  ))}
                </select>
                
                {showControls && !readOnly && (
                  <>
                    <button
                      onClick={handleCopyCode}
                      className="p-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                      title="Copy code"
                    >
                      <FaCopy />
                    </button>
                    <button
                      onClick={handleDownloadCode}
                      className="p-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                      title="Download code"
                    >
                      <FaDownload />
                    </button>
                    <button
                      onClick={handleResetCode}
                      className="p-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                      title="Reset code"
                    >
                      <FaTrash />
                    </button>
                  </>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleRun}
                  disabled={isRunning || readOnly}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                    isRunning || readOnly
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-green-600 hover:bg-green-700 text-white"
                  }`}
                >
                  {isRunning ? <FaSpinner className="animate-spin" /> : <FaPlay />}
                  {isRunning ? "Running..." : "Run Tests"}
                </button>
                
                {showControls && !readOnly && (
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                      isSaving
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700 text-white"
                    }`}
                  >
                    {isSaving ? <FaSpinner className="animate-spin" /> : <FaSave />}
                    {isSaving ? "Saving..." : "Save"}
                  </button>
                )}
              </div>
            </div>

            {/* Code Editor */}
            <div className="flex-1 p-3">
              <Editor
                height={editorHeight}
                language={language.monaco}
                value={sourceCode}
                onChange={setSourceCode}
                theme="vs-dark"
                options={{
                  readOnly,
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: "on",
                  automaticLayout: true,
                  scrollBeyondLastLine: false,
                  wordWrap: "on"
                }}
              />
            </div>

            {/* Editor Resize Handle (optional) */}
            <input
              type="range"
              min="200"
              max="800"
              value={parseInt(editorHeight)}
              onChange={(e) => setEditorHeight(e.target.value + "px")}
              className="w-full"
            />
          </div>

          {/* Right Panel - Test Cases & Results */}
          <div className="lg:w-1/3 flex flex-col bg-gray-50 dark:bg-gray-800">
            
            {/* Tabs */}
            <div className="flex border-b border-gray-300 dark:border-gray-700">
              <button
                onClick={() => setActiveTab("testcases")}
                className={`flex-1 px-4 py-2 text-sm font-medium ${
                  activeTab === "testcases"
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-gray-600 dark:text-gray-400"
                }`}
              >
                Test Cases ({testCases.length})
              </button>
              <button
                onClick={() => setActiveTab("results")}
                className={`flex-1 px-4 py-2 text-sm font-medium ${
                  activeTab === "results"
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-gray-600 dark:text-gray-400"
                }`}
              >
                Results
                {runResults.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                    {runResults.filter(r => r.passed).length}/{runResults.length}
                  </span>
                )}
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {activeTab === "testcases" ? (
                // Test Cases View
                <div className="space-y-4">
                  {testCases.map((test, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-lg border ${
                        test.passed === true
                          ? "bg-green-50 border-green-300 dark:bg-green-900/20 dark:border-green-700"
                          : test.passed === false
                          ? "bg-red-50 border-red-300 dark:bg-red-900/20 dark:border-red-700"
                          : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold flex items-center gap-2">
                          {getStatusIcon(test.passed)}
                          Test Case {idx + 1}
                          {test.hidden && (
                            <span className="px-2 py-0.5 text-xs bg-gray-200 dark:bg-gray-600 rounded">
                              Hidden
                            </span>
                          )}
                        </h4>
                        
                        {test.hidden && (
                          <button
                            onClick={() => toggleExpectedOutput(idx)}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            {showExpectedOutput[idx] ? <FaEyeSlash /> : <FaEye />}
                          </button>
                        )}
                      </div>

                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium">Input:</span>
                          <pre className="mt-1 p-2 bg-gray-100 dark:bg-gray-800 rounded overflow-x-auto">
                            {test.input || "(no input)"}
                          </pre>
                        </div>

                        {(!test.hidden || showExpectedOutput[idx]) && (
                          <div>
                            <span className="font-medium">Expected Output:</span>
                            <pre className="mt-1 p-2 bg-gray-100 dark:bg-gray-800 rounded overflow-x-auto">
                              {test.expectedOutput}
                            </pre>
                          </div>
                        )}

                        {test.actualOutput && (
                          <div>
                            <span className="font-medium">Your Output:</span>
                            <pre className="mt-1 p-2 bg-gray-100 dark:bg-gray-800 rounded overflow-x-auto">
                              {test.actualOutput}
                            </pre>
                          </div>
                        )}

                        {test.error && (
                          <div className="text-red-600 dark:text-red-400">
                            <span className="font-medium">Error:</span>
                            <pre className="mt-1 p-2 bg-red-50 dark:bg-red-900/20 rounded overflow-x-auto">
                              {test.error}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // Results View
                <div className="space-y-4">
                  {runResults.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">
                      Run your code to see results
                    </p>
                  ) : (
                    runResults.map((result, idx) => (
                      <div
                        key={idx}
                        className={`p-4 rounded-lg border ${
                          result.passed
                            ? "bg-green-50 border-green-300 dark:bg-green-900/20 dark:border-green-700"
                            : "bg-red-50 border-red-300 dark:bg-red-900/20 dark:border-red-700"
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold flex items-center gap-2">
                            {result.passed ? (
                              <FaCheckCircle className="text-green-500" />
                            ) : (
                              <FaTimesCircle className="text-red-500" />
                            )}
                            Test Case {result.testCaseId + 1}
                            {result.hidden && (
                              <span className="px-2 py-0.5 text-xs bg-gray-200 dark:bg-gray-600 rounded">
                                Hidden
                              </span>
                            )}
                          </h4>
                          {result.executionTime && (
                            <span className="text-xs text-gray-500">
                              {result.executionTime}ms
                            </span>
                          )}
                        </div>

                        {result.error ? (
                          <div className="text-red-600 dark:text-red-400">
                            <pre className="mt-1 p-2 bg-red-50 dark:bg-red-900/20 rounded overflow-x-auto text-sm">
                              {result.error}
                            </pre>
                          </div>
                        ) : (
                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="font-medium">Expected:</span>
                              <pre className="mt-1 p-2 bg-gray-100 dark:bg-gray-800 rounded overflow-x-auto">
                                {result.expected}
                              </pre>
                            </div>
                            <div>
                              <span className="font-medium">Got:</span>
                              <pre className="mt-1 p-2 bg-gray-100 dark:bg-gray-800 rounded overflow-x-auto">
                                {result.output || "(no output)"}
                              </pre>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-100 dark:bg-gray-800 p-3 border-t border-gray-300 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex justify-between items-center">
            <span>
              {testCases.filter(t => t.passed === true).length} / {testCases.length} test cases passed
            </span>
            <span>
              {isRunning ? "Running..." : "Ready"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeEval;