const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Batch = require('../models/Batch');
const Course = require('../models/Course');
const Report = require('../models/Report');
const BatchEvaluation = require('../models/BatchEvaluation');
const { generatePDF } = require('../utils/generatePDF');
const { sendMail } = require('../utils/sendMail');
const verifyAccessToken = require('../middleware/auth');

// ✅ Get eligible students
// ✅ Modified GET /eligible route
router.get('/eligible', verifyAccessToken, async (req, res) => {
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

        const studentEvalEntries = evaluation?.studentMarks.filter(
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

let codingTotal = 0, quizTotal = 0, assignmentTotal = 0;

reports.forEach(r => {
  const [coding, quiz, assignment] = r.marksObtained;
  if (coding >= 0) codingTotal += coding;
  if (quiz >= 0) quizTotal += quiz;
  if (assignment >= 0) assignmentTotal += assignment;
});

const totalMarks = codingTotal + quizTotal + assignmentTotal;
const normalizedScore = (totalMarks / 350) * 50;

if (!studentEvalEntries || studentEvalEntries.length === 0 || reports.length === 0) {
  ineligible.push({ ...studentData, reason: 'Missing evaluation data' });
  continue;
}

let totalProject = 0, totalTheory = 0;
let isValid = true;

for (let entry of studentEvalEntries) {
  if (entry.projectMarks < 0 || entry.theoryMarks < 0) {
    isValid = false;
    break;
  }
  totalProject += (entry.projectMarks / 100) * 50;
  totalTheory += (entry.theoryMarks / 100) * 50;
}

if (!isValid) {
  ineligible.push({ ...studentData, reason: 'Missing or invalid project/theory marks' });
  continue;
}

const finalScore = +(normalizedScore + totalProject + totalTheory).toFixed(2);

studentData.marks = {
  codingTotal,
  quizTotal,
  assignmentTotal,
  projectMarks: +totalProject.toFixed(2),
  theoryMarks: +totalTheory.toFixed(2),
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
router.get('/incomplete-batches', verifyAccessToken, async (req, res) => {
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


// ✅ Generate certificates for selected students
// POST /generate/batch/:batchId
router.post('/generate/batch/:batchId', verifyAccessToken, async (req, res) => {
  try {
    const { batchId } = req.params;
    const { students: studentIds } = req.body;

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ error: "No student IDs provided" });
    }

    const batch = await Batch.findById(batchId)
      .populate('course')
      .populate('admins.admin');

    if (!batch) return res.status(404).send('Batch not found');

    const isBatchCompleted = batch.admins.every(a => a.ifCompleted === true);
    if (!isBatchCompleted) {
      return res.status(400).send('Batch module evaluations not completed by all admins');
    }

    // Only fetch selected students
    const students = await Student.find({ batch: batchId, _id: { $in: studentIds } }).populate('user');

    const generated = [];

    for (let student of students) {
      await generatePDF(
        student.user.name,
        batch.course.courseName,
        batch.batchName,
        student.rollNo,
        student.user.email
      );
      generated.push({
        studentName: student.user.name,
        email: student.user.email,
        status: "Success",
        message: 'Certificate generated successfully'
      });
    }

    res.json({ batchName: batch.batchName, generated });
  } catch (err) {
    console.error('Error generating batch certificates:', err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
