const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const User = require('../models/User');
const verifyAccessToken = require('../middleware/auth');

router.get('/me', verifyAccessToken, async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user.id }).populate("user", "name email");
    if (!student) return res.status(404).json({ message: "Student not found" });

    res.json({
      name: student.user.name,
      email: student.user.email,
      phone: student.phone || '',
      address: student.address || '',
      dob: student.dob || '',
    });
  } catch (err) {
    console.error("Fetch error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;