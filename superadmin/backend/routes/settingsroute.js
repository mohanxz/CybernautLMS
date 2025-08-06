const express = require('express');
const router = express.Router();
const User = require('../models/User');
const verifyAccessToken = require('../middleware/auth');
const bcrypt = require('bcrypt');
// Get admin profile
router.get('/me', verifyAccessToken, async (req, res) => {
  try {
    
    res.json({
      name: req.user.name,
      email: req.user.email,
    });
  } catch (err) {
    console.error("Fetch error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;