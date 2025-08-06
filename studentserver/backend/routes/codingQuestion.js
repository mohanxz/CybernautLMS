// routes/codingQuestion.js
const express = require('express');
const router = express.Router();
const CodingQuestion = require('../models/Code');
const verifyAccessToken = require('../middleware/auth');

// Get coding question by noteId
router.get("/by-note/:noteId", verifyAccessToken, async (req, res) => {
  const { noteId } = req.params;
  

  try {
    const codingQuestion = await CodingQuestion.findOne({ noteId });

    if (!codingQuestion) {
      
      return res.status(404).json({ message: "No coding question found for this note." });
    }

    res.json(codingQuestion);
  } catch (err) {
    console.error("Error fetching coding question:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
