// routes/quiz.js
const express = require('express');
const router = express.Router();
const Quiz = require('../models/Quiz');
const verifyAccessToken = require('../middleware/auth');

// Create a new quiz with note reference
router.post('/create', verifyAccessToken, async (req, res) => {
  const { noteId, createdBy } = req.body;
  try {
    const quiz = new Quiz({ noteId, createdBy, questions: [] });
    await quiz.save();
    res.status(201).json({ message: 'Quiz created', quiz });
  } catch (err) {
    res.status(500).json({ error: 'Quiz creation failed' });
  }
});

// Add questions to existing quiz
router.post('/:quizId/add-question', verifyAccessToken, async (req, res) => {
  const { quizId } = req.params;
  const { question, options, answer } = req.body;
  try {
    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

    quiz.questions.push({ question, options, answer });
    await quiz.save();
    res.status(200).json({ message: 'Question added', quiz });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add question' });
  }
});

// Get quiz with questions
router.get('/:quizId', verifyAccessToken, async (req, res) => {
  const { quizId } = req.params;
  try {
    const quiz = await Quiz.findById(quizId).populate('noteId').populate('createdBy', 'name');
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
    res.status(200).json(quiz);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch quiz' });
  }
});

// Get quiz by noteId (to fetch existing quiz for a note)
router.get('/by-note/:noteId', verifyAccessToken, async (req, res) => {
  const { noteId } = req.params;
  try {
    const quiz = await Quiz.findOne({ noteId }).populate('noteId').populate('createdBy', 'name');
    if (!quiz) return res.status(404).json({ error: 'Quiz not found for this note' });
    res.status(200).json(quiz);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch quiz by noteId' });
  }
});

// Update a specific question in a quiz
router.put('/:quizId/question/:index', verifyAccessToken, async (req, res) => {
  const { quizId, index } = req.params;
  const { question, options, answer } = req.body;
  try {
    const quiz = await Quiz.findById(quizId);
    if (!quiz || !quiz.questions[index]) {
      return res.status(404).json({ error: 'Question not found' });
    }

    quiz.questions[index] = { question, options, answer };
    await quiz.save();
    res.status(200).json({ message: 'Question updated', quiz });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update question' });
  }
});


module.exports = router;
