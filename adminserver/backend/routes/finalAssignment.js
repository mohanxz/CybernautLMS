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

// Add or overwrite questions for final assignment
router.post('/:batchId/:module', verifyAccessToken, async (req, res) => {
  const { batchId, module } = req.params;
  const { questions } = req.body;
  try {
    let evalDoc = await BatchEvaluation.findOne({ batch: batchId, module });

    if (!evalDoc) {
       try {
          const students = await Student.find({ batchId });
      
          const studentMarks = students.map(student => ({
            student: student._id,
            projectMarks: -2,
            theoryMarks: -2
          }));
      
          const evaluation = new BatchEvaluation({
            batchId,
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
    } 
    else {
      evalDoc.questions = questions;
    }

    await evalDoc.save(); // 👈 likely failing here due to validation
    res.json({ message: 'Saved', questions: evalDoc.questions });

  } catch (err) {
    console.error('❌ Error saving BatchEvaluation:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
