const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Batch = require('../models/Batch');
const Course = require('../models/Course');
const User = require('../models/User');
const Note = require('../models/Note');
const Quiz = require('../models/Quiz'); // Quiz uses noteId
const CodingQuestion = require('../models/Code'); // CodingQuestion uses noteId
const CodeSubmission = require('../models/CodeSubmission'); // Assuming CodeSubmission model exists
const verifyAccessToken = require('../middleware/auth');
// GET student's batch details
router.get('/batch/:studentId', verifyAccessToken, async (req, res) => {
  try {
    const student = await Student.findById(req.params.studentId).populate({
      path: 'batch',
      populate: { path: 'course' }
    });

    if (!student) return res.status(404).json({ error: 'Student not found' });

    const { batch } = student;

    res.json({
      batchId: batch._id,
      batchName: batch.batchName,
      startDate: batch.startDate,
      courseName: batch.course.name,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

router.get('/modules/:type', verifyAccessToken, async (req, res) => {
  const course = await Course.findOne({ course_type: req.params.type });
  if (!course) return res.status(404).json({ modules: [] });
  res.json({ modules: course.modules });
});

// GET batch by batchId (used when you already have the batch ID)
router.get('/batch/by-id/:batchId', verifyAccessToken, async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.batchId)
      .populate('course')
      .populate('admins.admin', 'name email'); // only name & email from User

    if (!batch) return res.status(404).json({ error: 'Batch not found' });
    
    res.json({
      _id: batch._id,
      batchName: batch.batchName,
      startDate: batch.startDate,
      courseName: batch.course?.courseName || '',
      course: batch.course?._id || '',
      admins: batch.admins.map(a => ({
        module: a.module,
        name: a.admin?.name || 'Unknown',
        email: a.admin?.email || 'N/A'
      }))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get("/modules-with-latest-day/:batchId", verifyAccessToken, async (req, res) => {
  try {
    const { batchId } = req.params;

    // Get batch with populated admins
    const batch = await Batch.findById(batchId).populate("admins.admin", "name");

    if (!batch) return res.status(404).json({ error: "Batch not found" });

    // Get all modules used in this batch
    const modules = batch.admins.map(a => a.module);

    // Fetch latest day for each module from Note collection
    const modulesWithDay = await Promise.all(modules.map(async (module) => {
      const note = await Note.findOne({ batch: batchId, module })
        .sort({ day: -1 }) // most recent day
        .select("day");

      return {
        module,
        latestDay: note?.day || 0,
        admins: batch.admins.filter(a => a.module === module)
      };
    }));

    // Sort modules by latestDay descending
    modulesWithDay.sort((a, b) => b.latestDay - a.latestDay);

    res.json(modulesWithDay);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal error" });
  }
});

// Optimized overview route for batch notes/quizzes/coding for a student
router.get('/batch/overview/:batchId/:studentId', verifyAccessToken, async (req, res) => {
  try {
    const { batchId, studentId } = req.params;
    // Get batch and its modules
    const batch = await Batch.findById(batchId)
      .populate('course')
      .populate('admins.admin', 'name email');
    if (!batch) return res.status(404).json({ error: 'Batch not found' });

    // Get all notes for this batch, grouped by module
    const notes = await Note.find({ batch: batchId }).lean();
    const notesByModule = {};
    let latestModule = null;
    let maxOverallDay = -1;

    for (const adminObj of batch.admins) {
      const moduleName = adminObj.module;
      const moduleNotes = notes.filter(n => n.module === moduleName);
      const maxDay = Math.max(...moduleNotes.map(note => note.day || 0), 0);

      if (maxDay > maxOverallDay) {
        maxOverallDay = maxDay;
        latestModule = moduleName;
      }

      notesByModule[moduleName] = {
        today: moduleNotes.filter(note => note.day === maxDay),
        others: moduleNotes.filter(note => note.day !== maxDay)
      };
    }

    // For each note, fetch quiz, coding question, and coding submission status
    const quizzesMap = {};
    const codingQuestionsMap = {};

    for (const module in notesByModule) {
      for (const note of [...notesByModule[module].today, ...notesByModule[module].others]) {
        // Quiz (correct field: noteId)
        const quiz = await Quiz.findOne({ noteId: note._id }).lean();
        if (quiz?._id) quizzesMap[note._id] = quiz;

        // Coding Question (correct field: noteId)
        const codingQuestion = await CodingQuestion.findOne({ noteId: note._id }).lean();
        if (codingQuestion?._id) {
          // Submission status (noteId and studentId)
          const submission = await CodeSubmission.findOne({ noteId: note._id, studentId });
          codingQuestionsMap[note._id] = {
            ...codingQuestion,
            submitted: !!submission
          };
        }
      }
    }

    res.json({
      batch: {
        _id: batch._id,
        batchName: batch.batchName,
        startDate: batch.startDate,
        courseName: batch.course?.courseName || '',
        course: batch.course?._id || '',
        admins: batch.admins.map(a => ({
          module: a.module,
          name: a.admin?.name || 'Unknown',
          email: a.admin?.email || 'N/A'
        }))
      },
      notesMap: notesByModule,
      quizzesMap,
      codingQuestionsMap,
      latestModule
    });
  } catch (err) {
    console.error('Error in batch overview:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});


module.exports = router;
