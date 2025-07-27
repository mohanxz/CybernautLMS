const express = require('express');
const router = express.Router();
const BatchEvaluation = require('../models/BatchEvaluation');
const Student = require('../models/Student');

// ✅ Create evaluation entry for batch
// ✅ Create evaluation entry for batch and module
router.post('/', async (req, res) => {
  const { batch, module, projectS3Url } = req.body;

  if (!batch || !module) {
    return res.status(400).json({ message: "Batch and module are required" });
  }

  console.log("Creating evaluation for:", batch, module);

  try {
    // Check if evaluation already exists for this batch and module
    const existingEvaluation = await BatchEvaluation.findOne({ batch, module });

    if (existingEvaluation) {
      return res.status(400).json({ message: "Evaluation already exists for this batch and module" });
    }

    const students = await Student.find({ batch });

    const studentMarks = students.map(student => ({
      student: student._id,
      projectMarks: -2,
      theoryMarks: -2
    }));

    const evaluation = new BatchEvaluation({
      batch,
      module,
      projectS3Url,
      studentMarks
    });

    await evaluation.save();

    res.status(201).json({ message: "Evaluation created", evaluation });
  } catch (err) {
    res.status(500).json({ error: "Failed to create evaluation", details: err.message });
    console.log(err.message);
  }
});




// ✅ Get evaluation by batch
// GET /api/batch-evaluation/:batchId/:module
router.get('/:batchId/:module', async (req, res) => {
  try {
    const evaluation = await BatchEvaluation.findOne({
      batch: req.params.batchId,
      module: req.params.module
    })
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
  const { projectS3Url, studentMarks } = req.body;

  try {
    const evaluation = await BatchEvaluation.findById(req.params.id);
    if (!evaluation) return res.status(404).json({ message: "Evaluation not found" });

    if (projectS3Url !== undefined) evaluation.projectS3Url = projectS3Url;

    if (Array.isArray(studentMarks)) {
      studentMarks.forEach(mark => {
        const target = evaluation.studentMarks.find(s => s.student.toString() === mark.student);
        if (target) {
          if (mark.projectMarks !== undefined) target.projectMarks = mark.projectMarks;
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
