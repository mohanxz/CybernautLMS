const express = require('express');
const Student = require('../models/Student');
const Note = require('../models/Note');
const Report = require('../models/Report');

const router = express.Router();
const verifyAccessToken = require('../middleware/auth');

/**
 * GET /progress/:studentId
 * Returns percentage completion of coding, quiz, and assignment.
 */
router.get('/:studentId', verifyAccessToken, async (req, res) => {
  const { studentId } = req.params;
  try {
    // Step 1: Find the student's batch
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const batchId = student.batch;

    // Step 2: Get total notes for the student's batch
    const notes = await Note.find({ batch: batchId });
    const total = notes.length;

    if (total === 0) {
      return res.json({
        coding: 0,
        quiz: 0,
        assignment: 0,
      });
    }

    // Step 3: Get all reports submitted by the student
    const reports = await Report.find({ student: studentId });

    // Step 4: Count total submitted for each category
    let codingCount = 0;
    let quizCount = 0;
    let assignmentCount = 0;

    for (const report of reports) {
      const [coding, quiz, assignment] = report.marksObtained;

      if (coding > -2) codingCount++;
      if (quiz > -2) quizCount++;
      if (assignment > -2) assignmentCount++;
    }

    // Step 5: Calculate percentage
    const percent = (count) => Math.round((count / total) * 100);

    return res.json({
      coding: percent(codingCount),
      quiz: percent(quizCount),
      assignment: percent(assignmentCount),
    });

  } catch (err) {
    console.error('Error computing progress:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
