const verifyAccessToken = require('../middleware/auth');
const express = require('express');
const Student = require('../models/Student');
const Report = require('../models/Report');
const Note = require('../models/Note');
const Quiz = require('../models/Quiz');

const router = express.Router();
router.get('/:noteId', verifyAccessToken, async (req, res) => {
  const quiz = await Quiz.findOne({ noteId: req.params.noteId });
  if (!quiz) return res.status(404).json({ message: "Quiz not found" });
  res.json(quiz);
});

router.post('/submit/:noteId', verifyAccessToken, async (req, res) => {
  try {
    const { answers } = req.body;
    const quiz = await Quiz.findOne({ noteId: req.params.noteId });
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    const student = await Student.findOne({ user: req.user.id });
    if (!student) return res.status(403).json({ message: "Student not found" });

    const note = await Note.findById(req.params.noteId);
    if (!note) return res.status(404).json({ message: "Note not found" });

    const totalQuestions = quiz.questions.length;
    const correct = quiz.questions.reduce((acc, q, i) => {
      return acc + (answers[i] === q.answer ? 1 : 0);
    }, 0);

    const score = Math.round((correct / totalQuestions) * 10);

    let report = await Report.findOne({ student: student._id, module: note.module, day: note.day });

    if (!report) {
      report = new Report({
        student: student._id,
        module: note.module,
        day: note.day,
        marksObtained: [-2, score, -2],
        quizAnswers: answers
      });
    } else {
      const updatedMarks = [...(report.marksObtained || [-2, -2, -2])];
      updatedMarks[1] = score;
      report.marksObtained = updatedMarks;
      report.quizAnswers = answers;
    }

    await report.save();

    res.json({ score, total: 10 });

  } catch (err) {
    console.error("❌ Quiz submission error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Add this route in your /api/quiz router
router.get('/by-note/:noteId', verifyAccessToken, async (req, res) => {
  try {
    const quiz = await Quiz.findOne({ noteId: req.params.noteId });
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });
    res.json(quiz);
  } catch (err) {
    console.error(" Fetch quiz by note error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


module.exports = router;
