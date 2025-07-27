const express = require('express');
const router = express.Router();
const verifyAccessToken = require('../middleware/auth');
const Batch = require('../models/Batch');
const Course = require('../models/Course');

router.get('/my-batches',verifyAccessToken, async (req, res) => {
  try {
    const adminId = req.user.id;

    const batches = await Batch.find({ "admins.admin": adminId })
      .populate('course')
      .populate('admins.admin');

    res.json(batches);
  } catch (err) {
    console.error("Error fetching batches:", err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark a module in a batch as completed by a specific admin
router.patch('/mark-complete/:batchId', verifyAccessToken, async (req, res) => {
  try {
    const { batchId } = req.params;
    const adminId = req.user.id;
    const { isCompleted } = req.body;

    // Step 1: Fetch the batch
    const batch = await Batch.findById(batchId);
    if (!batch) {
      return res.status(404).json({ message: "Batch not found." });
    }

    console.log(`Marking batch ${batchId} as completed by admin ${adminId}`);
    // Step 2: Update all modules where this admin is assigned
    let updated = false;
    batch.admins = batch.admins.map((adminObj) => {
      console.log(`Checking admin ${adminObj.admin} in batch ${batchId}`);
      if (adminObj.admin.equals(adminId)) {
        adminObj.ifCompleted = isCompleted;
        updated = true;
        console.log(`Updated admin ${adminObj.admin} in batch ${batchId} to completed: ${isCompleted}`);
      }
      return adminObj;
    });

    if (!updated) {
      console.log(`Admin ${adminId} not found in batch ${batchId}`);
      return res.status(404).json({ message: "Admin not assigned to any module in this batch." });
    }

    await batch.save();

    res.json({
      message: `Marked all your modules as ${isCompleted ? "completed" : "incomplete"}`,
      batch,
    });
  } catch (err) {
    console.error("Error updating batch completion status:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get('/check-complete/:batchId', verifyAccessToken, async (req, res) => {
  const { batchId } = req.params;
  const adminId = req.user.id; // Assuming verifyAccessToken attaches user object to req

  try {
    const batch = await Batch.findById(batchId);
    if (!batch) return res.status(404).json({ message: 'Batch not found' });

    const adminModules = batch.admins.filter(adminObj => adminObj.admin.equals(adminId));

    if (adminModules.length === 0) {
      return res.status(404).json({ message: 'Admin not assigned to this batch.' });
    }

    const allCompleted = adminModules.every(mod => mod.ifCompleted === true);

    res.status(200).json({
      message: allCompleted ? 'All modules completed by admin.' : 'Some modules still incomplete.',
      isCompleted: allCompleted
    });

  } catch (err) {
    console.error("Error in check-complete route:", err);
    res.status(500).json({ message: 'Server error' });
  }
});



router.get('/:batchId',verifyAccessToken, async (req, res) => {
  try {
    const { batchId } = req.params;

    const batch = await Batch.findById(batchId).populate('course');
    if (!batch) {
      return res.status(404).json({ message: 'Batch not found' });
    }

    res.json(batch);
  } catch (err) {
    console.error('Error fetching batch details:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
