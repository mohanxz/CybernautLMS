// routes/adminEvaluation.js

const express = require('express');
const mongoose = require('mongoose');
const Student = require('../models/Student');
const Report = require('../models/Report');
const verifyAccessToken = require('../middleware/auth');
const router = express.Router();

router.get('/:batchId/:day',verifyAccessToken, async (req, res) => {
  try {
    const { batchId, day } = req.params;
    const objectId = new mongoose.Types.ObjectId(batchId);

    // Fetch all students in the batch
    const students = await Student.find({ batch: objectId }).populate('user', 'name');

    // Prepare data
    const data = await Promise.all(
      students.map(async (student) => {
        const report = await Report.findOne({
          student: student._id,
          day: parseInt(day),
          quizType: 'Assignment',
        });

        return {
          studentId: student._id,
          name: student.user.name,
          marks: report ? report.marksObtained : '--',
        };
      })
    );

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

router.post('/bulk-update',verifyAccessToken,async (req, res) => {
  try {
    const { day, updates } = req.body;

    for (let entry of updates) {
      const { studentId, marks } = entry;

      let report = await Report.findOne({
        student: studentId,
        day: parseInt(day),
        quizType: 'Assignment',
      });

      if (!report) {
        report = new Report({
          student: studentId,
          day: parseInt(day),
          quizType: 'Assignment',
          marksObtained: parseInt(marks),
        });
      } else {
        report.marksObtained = parseInt(marks);
      }

      await report.save();
    }

    res.json({ message: "Bulk update successful" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;
