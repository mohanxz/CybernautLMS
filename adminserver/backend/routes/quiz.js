const express = require("express");
const router = express.Router();
const Quiz = require("../models/Quiz");
const verifyAccessToken = require("../middleware/auth");

const multer = require("multer");
const XLSX = require("xlsx");
const path = require("path");
const fs = require("fs");

// File upload config
const upload = multer({ dest: "uploads/" });

/* ===================================================== */
/* DOWNLOAD EXCEL TEMPLATE */
/* ===================================================== */
router.get("/template", verifyAccessToken, async (req, res) => {
  try {
    // Create template data
    const templateData = [
      {
        question: "What is JavaScript?",
        optionA: "A programming language",
        optionB: "A coffee brand",
        optionC: "A car model",
        optionD: "A movie",
        answer: "A"
      },
      {
        question: "Which HTML tag is used for JavaScript?",
        optionA: "<script>",
        optionB: "<javascript>",
        optionC: "<js>",
        optionD: "<code>",
        answer: "A"
      },
      {
        question: "How do you write 'Hello World' in alert?",
        optionA: "alert('Hello World');",
        optionB: "msg('Hello World');",
        optionC: "alertBox('Hello World');",
        optionD: "console.log('Hello World');",
        answer: "A"
      }
    ];

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(templateData);

    // Set column widths
    ws['!cols'] = [
      { wch: 50 }, // question
      { wch: 30 }, // optionA
      { wch: 30 }, // optionB
      { wch: 30 }, // optionC
      { wch: 30 }, // optionD
      { wch: 10 }  // answer
    ];

    // Add instructions as a comment (not directly supported, so we'll add a separate sheet)
    XLSX.utils.book_append_sheet(wb, ws, "Template");

    // Create instructions sheet
    const instructionsData = [
      { Instruction: "Fill in your questions in the Template sheet" },
      { Instruction: "All fields are required" },
      { Instruction: "Answer must be A, B, C, or D" },
      { Instruction: "Do not change the column headers" },
      { Instruction: "Delete the example rows before uploading your own questions" }
    ];
    
    const wsInstructions = XLSX.utils.json_to_sheet(instructionsData);
    XLSX.utils.book_append_sheet(wb, wsInstructions, "Instructions");

    // Generate buffer
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    // Set headers for download
    res.setHeader("Content-Disposition", 'attachment; filename="quiz_template.xlsx"');
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    
    // Send the file
    res.send(buffer);
  } catch (err) {
    console.error("Template download error:", err);
    res.status(500).json({ error: "Failed to generate template" });
  }
});

/* ===================================================== */
/* CREATE QUIZ */
/* ===================================================== */
router.post("/create", verifyAccessToken, async (req, res) => {
  const { noteId, createdBy } = req.body;

  try {
    // Check if quiz already exists for this note
    const existingQuiz = await Quiz.findOne({ noteId });
    if (existingQuiz) {
      return res.status(400).json({ error: "Quiz already exists for this note" });
    }

    const quiz = new Quiz({ 
      noteId, 
      createdBy, 
      questions: [] 
    });
    await quiz.save();

    res.status(201).json({ message: "Quiz created successfully", quiz });
  } catch (err) {
    console.error("Quiz creation error:", err);
    res.status(500).json({ error: "Quiz creation failed" });
  }
});

/* ===================================================== */
/* ADD SINGLE QUESTION */
/* ===================================================== */
router.post("/:quizId/add-question", verifyAccessToken, async (req, res) => {
  const { quizId } = req.params;
  const { question, options, answer } = req.body;

  try {
    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ error: "Quiz not found" });

    // Validate question data
    if (!question || !options || !answer) {
      return res.status(400).json({ error: "Invalid question data" });
    }

    // Validate options
    if (!options.A || !options.B || !options.C || !options.D) {
      return res.status(400).json({ error: "All options are required" });
    }

    // Validate answer
    if (!["A", "B", "C", "D"].includes(answer)) {
      return res.status(400).json({ error: "Answer must be A, B, C, or D" });
    }

    quiz.questions.push({ question, options, answer });
    await quiz.save();

    res.status(200).json({ message: "Question added successfully", quiz });
  } catch (err) {
    console.error("Add question error:", err);
    res.status(500).json({ error: "Failed to add question" });
  }
});

/* ===================================================== */
/* BULK UPLOAD EXCEL 🚀 */
/* ===================================================== */
router.post(
  "/:quizId/upload-excel",
  verifyAccessToken,
  upload.single("file"),
  async (req, res) => {
    try {
      const { quizId } = req.params;

      const quiz = await Quiz.findById(quizId);
      if (!quiz) {
        return res.status(404).json({ error: "Quiz not found" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // Read Excel
      const workbook = XLSX.readFile(req.file.path);
      const sheetName = workbook.SheetNames[0];
      const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

      if (!sheetData.length) {
        // Clean up uploaded file
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: "Excel file is empty" });
      }

      const validQuestions = [];
      const errors = [];

      sheetData.forEach((row, index) => {
        // Handle different possible column name formats
        const question = row.question || row.Question;
        const optionA = row.optionA || row.OptionA || row['option A'] || row['Option A'];
        const optionB = row.optionB || row.OptionB || row['option B'] || row['Option B'];
        const optionC = row.optionC || row.OptionC || row['option C'] || row['Option C'];
        const optionD = row.optionD || row.OptionD || row['option D'] || row['Option D'];
        const answer = row.answer || row.Answer;

        // Check for missing fields
        if (!question || !optionA || !optionB || !optionC || !optionD || !answer) {
          errors.push(`Row ${index + 2}: Missing required fields`); // +2 because Excel rows start at 1 and header is row 1
          return;
        }

        // Validate answer
        const normalizedAnswer = answer.toString().toUpperCase().trim();
        if (!["A", "B", "C", "D"].includes(normalizedAnswer)) {
          errors.push(`Row ${index + 2}: Answer must be A, B, C, or D (got: ${answer})`);
          return;
        }

        validQuestions.push({
          question: question.toString().trim(),
          options: {
            A: optionA.toString().trim(),
            B: optionB.toString().trim(),
            C: optionC.toString().trim(),
            D: optionD.toString().trim(),
          },
          answer: normalizedAnswer,
        });
      });

      // Clean up uploaded file
      fs.unlinkSync(req.file.path);

      if (validQuestions.length === 0) {
        return res.status(400).json({
          error: "No valid questions found",
          details: errors,
        });
      }

      // Save to DB
      quiz.questions.push(...validQuestions);
      await quiz.save();

      res.status(200).json({
        message: "Bulk upload successful",
        added: validQuestions.length,
        errors: errors.length > 0 ? errors : undefined,
        quiz,
      });
    } catch (err) {
      console.error("Bulk upload error:", err);
      // Clean up uploaded file if it exists
      if (req.file && req.file.path) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkErr) {
          console.error("Failed to delete uploaded file:", unlinkErr);
        }
      }
      res.status(500).json({ error: "Bulk upload failed" });
    }
  }
);

/* ===================================================== */
/* GET QUIZ */
/* ===================================================== */
router.get("/:quizId", verifyAccessToken, async (req, res) => {
  const { quizId } = req.params;

  try {
    const quiz = await Quiz.findById(quizId)
      .populate("noteId", "title day")
      .populate("createdBy", "name email");

    if (!quiz) return res.status(404).json({ error: "Quiz not found" });

    res.status(200).json(quiz);
  } catch (err) {
    console.error("Fetch quiz error:", err);
    res.status(500).json({ error: "Failed to fetch quiz" });
  }
});

/* ===================================================== */
/* GET QUIZ BY NOTE */
/* ===================================================== */
router.get("/by-note/:noteId", verifyAccessToken, async (req, res) => {
  const { noteId } = req.params;

  try {
    const quiz = await Quiz.findOne({ noteId })
      .populate("noteId", "title day")
      .populate("createdBy", "name email");

    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found for this note" });
    }

    res.status(200).json(quiz);
  } catch (err) {
    console.error("Fetch quiz by note error:", err);
    res.status(500).json({ error: "Failed to fetch quiz by noteId" });
  }
});

/* ===================================================== */
/* UPDATE QUESTION */
/* ===================================================== */
router.put("/:quizId/question/:index", verifyAccessToken, async (req, res) => {
  const { quizId, index } = req.params;
  const { question, options, answer } = req.body;

  try {
    const quiz = await Quiz.findById(quizId);

    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }

    if (!quiz.questions[index]) {
      return res.status(404).json({ error: "Question not found" });
    }

    // Validate data
    if (!question || !options || !answer) {
      return res.status(400).json({ error: "Invalid question data" });
    }

    if (!options.A || !options.B || !options.C || !options.D) {
      return res.status(400).json({ error: "All options are required" });
    }

    if (!["A", "B", "C", "D"].includes(answer)) {
      return res.status(400).json({ error: "Answer must be A, B, C, or D" });
    }

    quiz.questions[index] = { question, options, answer };
    await quiz.save();

    res.status(200).json({ message: "Question updated successfully", quiz });
  } catch (err) {
    console.error("Update question error:", err);
    res.status(500).json({ error: "Failed to update question" });
  }
});

/* ===================================================== */
/* DELETE QUESTION */
/* ===================================================== */
router.delete("/:quizId/question/:index", verifyAccessToken, async (req, res) => {
  const { quizId, index } = req.params;

  try {
    const quiz = await Quiz.findById(quizId);

    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }

    if (!quiz.questions[index]) {
      return res.status(404).json({ error: "Question not found" });
    }

    // Remove the question
    quiz.questions.splice(index, 1);
    await quiz.save();

    res.status(200).json({ message: "Question deleted successfully", quiz });
  } catch (err) {
    console.error("Delete question error:", err);
    res.status(500).json({ error: "Failed to delete question" });
  }
});

/* ===================================================== */
/* DELETE QUIZ */
/* ===================================================== */
router.delete("/:quizId", verifyAccessToken, async (req, res) => {
  const { quizId } = req.params;

  try {
    const quiz = await Quiz.findByIdAndDelete(quizId);

    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }

    res.status(200).json({ message: "Quiz deleted successfully" });
  } catch (err) {
    console.error("Delete quiz error:", err);
    res.status(500).json({ error: "Failed to delete quiz" });
  }
});

module.exports = router;