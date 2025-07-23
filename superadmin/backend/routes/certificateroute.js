const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Batch = require('../models/Batch');
const Course = require('../models/Course');
const Report = require('../models/Report');
const BatchEvaluation = require('../models/BatchEvaluation');
const { generatePDF } = require('../utils/generatePDF');

// ✅ Get eligible students
router.get('/eligible', async (req, res) => {
  try {
    const students = await Student.find({ certificate: false }).populate('user');
    const eligible = [];

    

    for (let student of students) {
      const reports = await Report.find({ student: student._id });

      // ❌ If any marks are -1, student is not eligible
      //let ineligible = reports.some(r =>
      //  r.marksObtained.some(mark => mark === -1)
      //);
      //if (ineligible) continue;*/

      const evaluation = await BatchEvaluation.findOne({ batch: student.batch });
      if (!evaluation) continue;

      

      const studentEval = evaluation.studentMarks.find(sm => sm.student.toString() === student._id.toString());
      if (!studentEval) continue;

      

      if (studentEval.projectMarks === -1 || studentEval.theoryMarks === -1) continue;

      // ✅ All checks passed, compute scores
      let codingTotal = 0;
      let quizTotal = 0;
      let assignmentTotal = 0;

      reports.forEach(r => {
        codingTotal += r.marksObtained[0];
        quizTotal += r.marksObtained[1];
        assignmentTotal += r.marksObtained[2];
      });

      const totalMarks = codingTotal + quizTotal + assignmentTotal;
      const normalizedScore = (totalMarks / 340) * 50;

      const projectOutOf25 = (studentEval.projectMarks / 100) * 25;
      const theoryOutOf25 = (studentEval.theoryMarks / 100) * 25;

      const finalScore = normalizedScore + projectOutOf25 + theoryOutOf25;
      console.log(`Final score for ${student.user.name}: ${finalScore}`);
      if (finalScore >= 50) {
        eligible.push(student);
      }
    }

    res.json(eligible);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// ✅ Generate certificates
router.post('/generate', async (req, res) => {
  try {
    const { students } = req.body;

    for (let id of students) {
      const student = await Student.findById(id)
        .populate('user')
        .populate({
          path: 'batch',
          populate: { path: 'course', model: 'Course' }
        });

      if (!student || !student.user || !student.batch || !student.batch.course) {
        console.warn(`Skipping student ID ${id} due to missing data`);
        continue;
      }

      const reports = await Report.find({ student: student._id });

      const ineligible = reports.some(r =>
        r.marksObtained.some(mark => mark === -1)
      );
      if (ineligible) continue;

      const evaluation = await BatchEvaluation.findOne({ batch: student.batch });
      if (!evaluation) continue;

      const studentEval = evaluation.studentMarks.find(sm => sm.student.toString() === student._id.toString());
      if (!studentEval || studentEval.projectMarks === -1 || studentEval.theoryMarks === -1) continue;

      let codingTotal = 0;
      let quizTotal = 0;
      let assignmentTotal = 0;

      reports.forEach(r => {
        codingTotal += r.marksObtained[0];
        quizTotal += r.marksObtained[1];
        assignmentTotal += r.marksObtained[2];
      });

      const totalMarks = codingTotal + quizTotal + assignmentTotal;
      const normalizedScore = (totalMarks / 340) * 50;

      const projectOutOf25 = (studentEval.projectMarks / 100) * 25;
      const theoryOutOf25 = (studentEval.theoryMarks / 100) * 25;

      const finalScore = normalizedScore + projectOutOf25 + theoryOutOf25;
      console.log(`Final score for ${student.user.name}: ${finalScore}`);
      const name = student.user.name;
      const email = student.user.email;
      const courseName = student.batch.course.courseName;
      const batchName = student.batch.batchName;
      const rollNo = student._id;

      await generatePDF(name, courseName, batchName, rollNo, email, student.batch.course.modules, finalScore);

      student.certificate = true;
      await student.save();
    }

    res.status(200).json({ message: "Certificates generated and sent." });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error generating certificates');
  }
});

module.exports = router;
