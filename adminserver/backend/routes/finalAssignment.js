const express = require('express');
const router = express.Router();
const BatchEvaluation = require('../models/BatchEvaluation');
const Student = require('../models/Student');
const verifyAccessToken = require('../middleware/auth');

// Get final assignment questions for a batch + module
router.get('/:batchId/:module', verifyAccessToken, async (req, res) => {
  const { batchId, module } = req.params;
  try {
    const evalDoc = await BatchEvaluation.findOne({ batch: batchId, module });
    if (!evalDoc) return res.status(404).json({ questions: [] });
    res.json({ questions: evalDoc.questions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add questions for final assignment (create only if not exists)
router.post('/:batchId/:module', verifyAccessToken, async (req, res) => {
  const { batchId, module } = req.params;
  const { questions } = req.body;
  try {
    let evalDoc = await BatchEvaluation.findOne({ batch: batchId, module });

    if (evalDoc) {
      // If already exists, do not overwrite, return error
      return res.status(400).json({ message: "Evaluation already exists for this batch and module" });
    }

    // Create new evaluation
    try {
      const students = await Student.find({ batchId });

      const studentMarks = students.map(student => ({
        student: student._id,
        projectMarks: -2,
        theoryMarks: -2
      }));

      const evaluation = new BatchEvaluation({
        batch: batchId,
        module, 
        questions,
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
  } catch (err) {
    console.error('❌ Error saving BatchEvaluation:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update questions for final assignment (PUT)
router.put('/:batchId/:module', verifyAccessToken, async (req, res) => {
  const { batchId, module } = req.params;
  const { questions } = req.body;
  try {
    let evalDoc = await BatchEvaluation.findOne({ batch: batchId, module });

    if (!evalDoc) {
      return res.status(404).json({ message: "Evaluation not found for this batch and module" });
    }

    evalDoc.questions = questions;
    await evalDoc.save();
    res.json({ message: 'Questions updated', questions: evalDoc.questions });
  } catch (err) {
    console.error('❌ Error updating BatchEvaluation:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
