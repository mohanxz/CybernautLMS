const express = require("express");
const axios = require("axios");
const auth = require("../middleware/auth");
const CodingQuestion = require("../models/Code");
const CodeSubmission = require("../models/CodeSubmission");
const Student = require("../models/Student");
const Note = require("../models/Note");
const Report = require("../models/Report"); // your Report model
const router = express.Router();

// Replace with your actual EC2 IP
const JUDGE0_URL = "http://13.50.13.88:2358";

router.post("/run", async (req, res) => {
  const { source_code, language_id, stdin } = req.body;

  try {
    const response = await axios.post(
      `${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`,
      { source_code, language_id, stdin },
      { headers: { "Content-Type": "application/json" } }
    );

    res.json(response.data);
  } catch (err) {
    console.error("Error:", err.message);
    res.status(500).json({ error: "Execution Failed" });
  }
});

// GET /api/codeEval/:noteId/:studentId
router.get("/:noteId/:studentId", async (req, res) => {
  const { noteId, studentId } = req.params;

  try {
    const submission = await CodeSubmission.findOne({ noteId, studentId });
    console.log("Fetched submission:", submission);
    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    res.json({
      code: submission.code,
      language: submission.language,
    });
  } catch (err) {
    console.error("Error fetching submission:", err);
    res.status(500).json({ message: "Server error" });
  }
});


router.get("/:noteId", async (req, res) => {
  try {
    const { noteId } = req.params;

    // First get the note to extract its 'day'
    const note = await Note.findById(noteId);
    if (!note) return res.status(404).json({ message: "Note not found" });
    const day = note.day;

    const submissions = await CodeSubmission.find({ noteId })
      .populate({
        path: "studentId",
        select: "rollNo user",
        populate: {
          path: "user",
          select: "name"
        }
      })
      .sort({ submittedAt: -1 });

    const validSubmissions = submissions.filter(
      (sub) => sub.studentId && sub.studentId.user
    );

    const results = [];

    for (const sub of validSubmissions) {
      const existingReport = await Report.findOne({
        student: sub.studentId._id,
        day: day
      });

      // Skip if coding mark is already set
      if (existingReport && existingReport.marksObtained[0] > -1) {
        continue;
      }

      results.push({
        studentId: sub.studentId._id,
        rollNo: sub.studentId.rollNo,
        name: sub.studentId.user.name,
        code: sub.code,
        language: sub.language,
        submittedAt: sub.submittedAt
      });
    }

    res.json(results);
  } catch (error) {
    console.error("Error fetching code submissions:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post('/save', async (req, res) => {
  const { studentId, noteId, module, codingMark } = req.body;

  try {
    // Get the day from the note
    const note = await Note.findById(noteId);
    if (!note) return res.status(404).json({ error: 'Note not found' });

    const day = note.day;

    let report = await Report.findOne({ student: studentId, day });

    if (report) {
      report.marksObtained[0] = codingMark; // [coding, quiz, assignment]
    } else {
      report = new Report({
        student: studentId,
        module,
        day,
        marksObtained: [codingMark, -1, -1]
      });
    }

    await report.save();
    res.json({ success: true, report });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save code evaluation' });
  }
});





module.exports = router;
