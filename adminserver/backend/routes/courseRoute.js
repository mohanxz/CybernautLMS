const express = require('express');
const router = express.Router();
const Batch = require('../models/Batch');
const Course = require('../models/Course');
const verifyAccessToken = require('../middleware/auth'); // Adjust path if needed

// Get course object from batchId
router.get('/from-batch/:batchId', verifyAccessToken, async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.batchId).populate('course');
    if (!batch) return res.status(404).json({ message: "Batch not found" });
    res.json({ course: batch.course });
  } catch (err) {
    console.error("Error fetching course from batch:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get only modules handled by the logged-in admin (from JWT)
router.get('/:batchId/modules', verifyAccessToken, async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.batchId);
    if (!batch) return res.status(404).json({ message: "Batch not found" });

    const loggedInAdminId = req.user.id;

    const adminModules = batch.admins
      .filter(entry => entry.admin.toString() === loggedInAdminId)
      .map(entry => entry.module);

    res.json(adminModules);
  } catch (err) {
    console.error("Error fetching modules for admin:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
