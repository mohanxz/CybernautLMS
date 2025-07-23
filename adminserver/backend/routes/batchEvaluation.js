const express = require('express');
const router = express.Router();
const BatchEvaluation = require('../models/BatchEvaluation');
const Student = require('../models/Student');

// ✅ Create evaluation entry for batch
router.post('/', async (req, res) => {
  const { batch, projectS3Url, theoryS3Url } = req.body;

  try {
    const students = await Student.find({ batch });

    const studentMarks = students.map(student => ({
      student: student._id,
      projectMarks: -2,
      theoryMarks: -2
    }));

    const evaluation = new BatchEvaluation({
      batch,
      projectS3Url,
      theoryS3Url,
      studentMarks
    });

    await evaluation.save();

    res.status(201).json({ message: "Evaluation created", evaluation });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "Evaluation already exists for this batch" });
    }
    res.status(500).json({ error: "Failed to create evaluation", details: err.message });
  }
});


// ✅ Get evaluation by batch
router.get('/:batchId', async (req, res) => {
  try {
    const evaluation = await BatchEvaluation.findOne({ batch: req.params.batchId })
      .populate('studentMarks.student', 'rollNo user')
      .populate({
        path: 'studentMarks.student',
        populate: { path: 'user', select: 'name email' }
      });
      

    if (!evaluation) return res.status(404).json({ message: "Evaluation not found" });

    res.json(evaluation);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch evaluation", details: err.message });
  }
});


// ✅ Update evaluation: file URLs or student marks
router.put('/:id', async (req, res) => {
  const { projectS3Url, theoryS3Url, studentMarks } = req.body;

  try {
    const evaluation = await BatchEvaluation.findById(req.params.id);
    if (!evaluation) return res.status(404).json({ message: "Evaluation not found" });

    if (projectS3Url !== undefined) evaluation.projectS3Url = projectS3Url;
    if (theoryS3Url !== undefined) evaluation.theoryS3Url = theoryS3Url;

    if (Array.isArray(studentMarks)) {
      studentMarks.forEach(mark => {
        const target = evaluation.studentMarks.find(s => s.student.toString() === mark.student);
        if (target) {
          if (mark.projectMarks !== undefined) target.projectMarks = mark.projectMarks;
          if (mark.theoryMarks !== undefined) target.theoryMarks = mark.theoryMarks;
        }
      });
    }

    await evaluation.save();

    res.json({ message: "Evaluation updated", evaluation });
  } catch (err) {
    res.status(500).json({ error: "Failed to update evaluation", details: err.message });
  }
});


module.exports = router;
