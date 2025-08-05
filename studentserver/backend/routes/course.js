const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const verifyAccessToken = require('../middleware/auth');

// GET /api/courses/:id — fetch course by ID
router.get('/:id', verifyAccessToken, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });
    res.json(course);
  } catch (err) {
    console.error("Failed to fetch course:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
