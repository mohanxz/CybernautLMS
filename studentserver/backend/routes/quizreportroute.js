// routes/quizreports.js
const router = require('express').Router();
const verifyAccessToken = require('../middleware/auth');
const Report = require('../models/Report');
const Quiz = require('../models/Quiz');
const Note = require('../models/Note');
const Student = require('../models/Student');
const BatchEvaluation = require('../models/BatchEvaluation');
// GET /api/quizreports/quiz-attempts — list all quiz attempts for student
router.get('/quiz-attempts', verifyAccessToken, async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user.id }).lean();
    if (!student) return res.status(403).json({ message: "Student not found" });

    const batchId = student.batch;

    // ✅ Fetch reports with marksObtained[1] >= 0
    const reports = await Report.find({
      student: student._id,
      'marksObtained.1': { $gte: 0 } // marksObtained[1] >= 0
    }).select('module day marksObtained quizAnswers').lean();

    // ✅ Get all matching Notes in one go
    const noteFilters = reports.map(r => ({
      batch: batchId,
      module: r.module,
      day: r.day
    }));

    const notes = await Note.find({
      $or: noteFilters
    }).select('_id module day').lean();

    // ✅ Build map to match (module + day) => noteId
    const noteMap = {};
    for (let note of notes) {
      noteMap[`${note.module}_${note.day}`] = note._id;
    }

    // ✅ Attach noteId to reports
    const enrichedReports = reports.map(r => ({
      ...r,
      noteId: noteMap[`${r.module}_${r.day}`] || null // attach noteId if found
    }));

    res.json(enrichedReports);
  } catch (err) {
    console.error("Failed to fetch quiz attempts:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});


router.get('/quiz-detail/:noteId', verifyAccessToken, async (req, res) => {
  try {
    const note = await Note.findById(req.params.noteId).lean();
    if (!note) return res.status(404).json({ message: "Note not found" });

    const quiz = await Quiz.findOne({noteId:note._id}).lean();

    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    const student = await Student.findOne({ user: req.user.id });
    const report = await Report.findOne({
      student: student._id,
      module: note.module,
      day: note.day
    }).lean();

    const detail = quiz.questions.map((q, i) => ({
      question: q.question,
      options: q.options,
      selected: report.quizAnswers[i] || null,
      correct: q.answer
    }));

    const score = report.marksObtained[1];
    const total = 10;

    res.json({ score, total, detail });
  } catch (err) {
    console.error("Error fetching quiz detail:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});




module.exports = router;
