const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Batch = require('../models/Batch');
const Course = require('../models/Course');
const Report = require('../models/Report');
const BatchEvaluation = require('../models/BatchEvaluation');
const { generatePDF } = require('../utils/generatePDF');
const { sendMail } = require('../utils/sendMail');


// ✅ Get eligible students
// ✅ Modified GET /eligible route
router.get('/eligible', async (req, res) => {
  try {
    const batches = await Batch.find();

    const results = [];

    for (let batch of batches) {
      const isBatchCompleted = batch.admins.every(a => a.ifCompleted === true);
      if (!isBatchCompleted) continue;

      const students = await Student.find({ batch: batch._id })
        .populate('user', 'name email')
        .populate('batch', 'batchName');

      const evaluation = await BatchEvaluation.findOne({ batch: batch._id });

      const eligible = [];
      const ineligible = [];

      for (let student of students) {
        const reports = await Report.find({ student: student._id });

        const studentEval = evaluation?.studentMarks.find(
          sm => sm.student.toString() === student._id.toString()
        );

        const studentData = {
          _id: student._id,
          user: student.user,
          batch: student.batch,
          phone: student.phone,
          address: student.address,
          dob: student.dob,
          rollNo: student.rollNo,
          marks: {
            codingTotal: 0,
            quizTotal: 0,
            assignmentTotal: 0,
            projectMarks: -1,
            theoryMarks: -1,
            finalScore: 0
          },
          status: "Ineligible"
        };

        if (!studentEval || reports.length === 0 || studentEval.projectMarks < 0 || studentEval.theoryMarks < 0) {
          ineligible.push({ ...studentData, reason: 'Missing or invalid evaluation data' });
          continue;
        }

        let codingTotal = 0, quizTotal = 0, assignmentTotal = 0;

        reports.forEach(r => {
          const [coding, quiz, assignment] = r.marksObtained;
          if (coding >= 0) codingTotal += coding;
          if (quiz >= 0) quizTotal += quiz;
          if (assignment >= 0) assignmentTotal += assignment;
        });

        const totalMarks = codingTotal + quizTotal + assignmentTotal;
        const normalizedScore = (totalMarks / 350) * 50;
        const projectOutOf50 = (studentEval.projectMarks / 100) * 50;
        const theoryOutOf50 = (studentEval.theoryMarks / 100) * 50;
        const finalScore = +(normalizedScore + projectOutOf50 + theoryOutOf50).toFixed(2);

        studentData.marks = {
          codingTotal,
          quizTotal,
          assignmentTotal,
          projectMarks: studentEval.projectMarks,
          theoryMarks: studentEval.theoryMarks,
          finalScore
        };

        if (finalScore >= 50) {
          studentData.status = "Eligible";
          eligible.push(studentData);
        } else {
          ineligible.push({ ...studentData, reason: 'Final score < 50' });
        }
      }

      eligible.sort((a, b) => b.marks.finalScore - a.marks.finalScore);
      ineligible.sort((a, b) => b.marks.finalScore - a.marks.finalScore);

      results.push({
        batch: {
          id: batch._id,
          name: batch.batchName,
          course: batch.course.courseName,
          startDate: batch.startDate,
        },
        eligible,
        ineligible
      });
    }

    res.json(results);
  } catch (err) {
    console.error('Error fetching eligible students:', err);
    res.status(500).send('Server Error');
  }
});


// GET /incomplete-batches
router.get('/incomplete-batches', async (req, res) => {
  try {
    const batches = await Batch.find()
      .populate('course')
      .populate('admins.admin');

    const incompleteBatches = batches.filter(batch =>
      batch.admins.some(admin => !admin.ifCompleted)
    ).map(batch => ({
      id: batch._id,
      name: batch.batchName,
      course: batch.course.courseName,
      startDate: batch.startDate,
      admins: batch.admins.map(a => ({
        name: a.admin.name,
        email: a.admin.email,
        ifCompleted: a.ifCompleted
      }))
    }));

    res.json(incompleteBatches);
  } catch (err) {
    console.error('Error fetching incomplete batches:', err);
    res.status(500).send('Server Error');
  }
});


// ✅ Generate certificates
// POST /generate/batch/:batchId
router.post('/generate/batch/:batchId', async (req, res) => {
  try {
    const { batchId } = req.params;

    const batch = await Batch.findById(batchId)
      .populate('course')
      .populate('admins.admin');

    if (!batch) return res.status(404).send('Batch not found');

    const isBatchCompleted = batch.admins.every(a => a.ifCompleted === true);
    if (!isBatchCompleted) {
      return res.status(400).send('Batch module evaluations not completed by all admins');
    }


    const evaluation = await BatchEvaluation.findOne({ batch: batchId });
    const students = await Student.find({ batch: batchId }).populate('user');

    const generated = [];

    for (let student of students) {
      const reports = await Report.find({ student: student._id });

      const studentEval = evaluation?.studentMarks.find(
        sm => sm.student.toString() === student._id.toString()
      );

      if (!studentEval ||
          studentEval.projectMarks === -1 ||
          studentEval.theoryMarks === -1 ||
          reports.length === 0 ||
          reports.some(r => r.marksObtained.some(mark => mark === -1))) {
        continue;
      }

      let codingTotal = 0, quizTotal = 0, assignmentTotal = 0;

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

      if (finalScore >= 50) {
        // ✅ Generate certificate PDF or link here
        generated.push({
          studentName: student.user.name,
          email: student.user.email,
          finalScore,
          message: 'Certificate generated successfully'
        });

        // e.g. call generateCertificatePDF(student, finalScore, batch.course.courseName)
      }
    }

    res.json({ batchName: batch.batchName, generated });
  } catch (err) {
    console.error('Error generating batch certificates:', err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
