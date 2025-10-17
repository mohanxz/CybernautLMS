const express = require('express');
const router = express.Router();
const Batch = require('../models/Batch');
const Course = require('../models/Course');
const Student = require('../models/Student');
const Admin = require('../models/Admin');
const verifyAccessToken = require('../middleware/auth');

// GET all batches with course name, admin names, and student count
router.get('/', verifyAccessToken, async (req, res) => {
  try {
    const batches = await Batch.find()
      .populate('course', 'courseName')     // Only get course name
      .populate('admins.admin', 'name');    // Only get admin name

    // Add student count to each batch
    const result = await Promise.all(
      batches.map(async (batch) => {
        const studentCount = await Student.countDocuments({ batch: batch._id });
        return {
          ...batch.toObject(),
          studentCount
        };
      })
    );

    res.json(result);
  } catch (err) {
    console.error('Error fetching batches:', err);
    res.status(500).json({ error: 'Failed to fetch batches' });
  }
});

router.post('/', verifyAccessToken, async (req, res) => {
  try {
    const { batchName, course, startDate, admins } = req.body;

    // Basic validation
    if (!batchName || !course || !startDate || !Array.isArray(admins) || admins.length === 0) {
      return res.status(400).json({ message: 'batchName, course, startDate are required and admins must be a non-empty array' });
    }
    // check if batch name already exists for this course
    const existing = await Batch.findOne({ batchName, course });
    if (existing) return res.status(400).json({ message: 'Batch name already exists for this course' });

    // Convert Admin IDs to User IDs
    const adminsWithUserIds = await Promise.all(
      admins.map(async (adminEntry) => {
        // adminEntry.admin is the Admin document ID
        const adminDoc = await Admin.findById(adminEntry.admin).select('user');
        if (!adminDoc) {
          throw new Error(`Admin with ID ${adminEntry.admin} not found`);
        }
        return {
          module: adminEntry.module,
          admin: adminDoc.user, // Use the User ID from the Admin document
          ifCompleted: adminEntry.ifCompleted || false
        };
      })
    );

    const batch = new Batch({ batchName, course, startDate, admins: adminsWithUserIds });
    await batch.save();

    res.status(201).json(batch);
  } catch (err) {
    console.error('Error creating batch:', err);
    res.status(500).json({ error: err.message });
  }
});

// Count existing batches by course & month & year (for generating batchName)
router.get("/count", verifyAccessToken, async (req, res) => {
  try {
    const { courseId, month, year } = req.query;

    if (!courseId || !month || !year) {
      return res.status(400).json({ message: "Missing courseId, month or year" });
    }

    const start = new Date(`${year}-${month}-01`);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);

    const count = await Batch.countDocuments({
      course: courseId,
      startDate: { $gte: start, $lt: end },
    });

    res.json({ count });
  } catch (err) {
    console.error("Error counting batches:", err);
    res.status(500).json({ error: "Failed to count batches" });
  }
});


module.exports = router;