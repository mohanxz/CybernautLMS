// routes/admin.js
const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const User = require('../models/User');
const verifyAccessToken = require('../middleware/auth');
const bcrypt = require('bcrypt');
// Get admin profile
router.get('/me', verifyAccessToken, async (req, res) => {
  try {
    const admin = await Admin.findOne({ user: req.user.id }).populate("user", "name email");
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    res.json({
      name: admin.user.name,
      email: admin.user.email,
      phone: admin.phone || '',
      department: admin.department || '',
      specialisation: admin.specialisation|| [],
    });
  } catch (err) {
    console.error("Fetch error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// Update profile
router.put('/me', verifyAccessToken, async (req, res) => {
  try {
    const { name, phone, department } = req.body;

    const admin = await Admin.findOne({ user: req.user.id });
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    // Update User (name)
    await require('../models/User').findByIdAndUpdate(req.user.id, { name });

    // Update Admin fields
    admin.phone = phone;
    admin.department = department;
    await admin.save();

    res.json({ message: "Profile updated successfully" });
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ message: "Failed to update profile" });
  }
});

// POST /api/admin/add-skill
router.post('/add-skill', verifyAccessToken, async (req, res) => {
  let { skill } = req.body;

  if (!skill) return res.status(400).json({ message: "Skill is required" });

  // Convert comma-separated string to array
  const newSkills = skill
    .split(',')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  if (newSkills.length === 0)
    return res.status(400).json({ message: "No valid skills provided" });

  const admin = await Admin.findOne({ user: req.user.id });
  if (!admin) return res.status(404).json({ message: "Admin not found" });

  // Add only new skills
  const uniqueSkills = newSkills.filter(s => !admin.specialisation.includes(s));
  admin.specialisation.push(...uniqueSkills);

  await admin.save();

  res.json({
    message: "Skills added successfully",
    specialisation: admin.specialisation
  });
});


module.exports = router;
