const express = require("express");
const router = express.Router();
const CodingQuestion = require("../models/Code");
const CodeSubmission = require("../models/CodeSubmission");
const verifyAccessToken = require("../middleware/auth");

// GET coding question by noteId
router.get("/:noteId", verifyAccessToken, async (req, res) => {
  try {
    const question = await CodingQuestion.findOne({ noteId: req.params.noteId });
    if (!question) return res.status(404).json({ message: "Coding question not found" });
    res.json(question);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// POST code submission
router.post("/submit/:noteId/:studentId", verifyAccessToken, async (req, res) => {
  const { noteId,studentId } = req.params;
  const { code, language } = req.body;

  if (!code || !language) {
    return res.status(400).json({ error: "Code and language are required" });
  }

  try {

    await CodeSubmission.create({
      noteId,
      studentId,  // Use the student schema's _id
      code,
      language,
    });

    res.json({ message: "Submission saved" });
  } catch (err) {
    console.error("Error saving submission:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});


// Check if code has been submitted
router.get("/submission-status/:noteId/:studentId", verifyAccessToken, async (req, res) => {
  try {
    const { noteId,studentId } = req.params;

    const existing = await CodeSubmission.findOne({ noteId, studentId });
    res.json({ submitted: !!existing });
  } catch (err) {
    console.error("Error checking code submission:", err);
    res.status(500).json({ error: "Server error" });
  }
});




module.exports = router;
