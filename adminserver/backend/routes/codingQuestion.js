// routes/codingQuestions.js
const express = require('express');
const router = express.Router();
const CodingQuestion = require('../models/Code');

// Create a new coding question for a day
router.post('/', async (req, res) => {
  try {
    const { noteId, title, description, language, testCases } = req.body;

    const newQuestion = new CodingQuestion({
      noteId,
      title,
      description,
      language,
      testCases,
    });

    await newQuestion.save();
    res.status(201).json(newQuestion);
  } catch (error) {
    console.error('Error creating coding question:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get coding question for a given noteId
router.get('/by-note/:noteId', async (req, res) => {
  try {
    const questions = await CodingQuestion.find({ noteId: req.params.noteId });
    res.json(questions);
  } catch (error) {
    console.error('Error fetching coding questions:', error);
    res.status(500).json({ error: 'Server error' });
  }
});


// Update a coding question
router.put('/:id', async (req, res) => {
  try {
    const { title, description, language, testCases } = req.body;
    const updated = await CodingQuestion.findByIdAndUpdate(
      req.params.id,
      { title, description, language, testCases },
      { new: true }
    );

    if (!updated) return res.status(404).json({ error: 'Question not found' });

    res.json(updated);
  } catch (error) {
    console.error('Error updating coding question:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
