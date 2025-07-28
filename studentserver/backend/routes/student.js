const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Batch = require('../models/Batch');
const Course = require('../models/Course');
const User = require('../models/User');
// GET student's batch details
router.get('/batch/:studentId', async (req, res) => {
  try {
    const student = await Student.findById(req.params.studentId).populate({
      path: 'batch',
      populate: { path: 'course' }
    });

    if (!student) return res.status(404).json({ error: 'Student not found' });

    const { batch } = student;

    res.json({
      batchId: batch._id,
      batchName: batch.batchName,
      startDate: batch.startDate,
      courseName: batch.course.name,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

router.get('/modules/:type', async (req, res) => {
  const course = await Course.findOne({ course_type: req.params.type });
  if (!course) return res.status(404).json({ modules: [] });
  res.json({ modules: course.modules });
});

// GET batch by batchId (used when you already have the batch ID)
router.get('/batch/by-id/:batchId', async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.batchId)
      .populate('course')
      .populate('admins.admin', 'name email'); // only name & email from User

    if (!batch) return res.status(404).json({ error: 'Batch not found' });
    
    res.json({
      _id: batch._id,
      batchName: batch.batchName,
      startDate: batch.startDate,
      courseName: batch.course?.courseName || '',
      course: batch.course?._id || '',
      admins: batch.admins.map(a => ({
        module: a.module,
        name: a.admin?.name || 'Unknown',
        email: a.admin?.email || 'N/A'
      }))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get("/modules-with-latest-day/:batchId", async (req, res) => {
  try {
    const { batchId } = req.params;

    // Get batch with populated admins
    const batch = await Batch.findById(batchId).populate("admins.admin", "name");

    if (!batch) return res.status(404).json({ error: "Batch not found" });

    // Get all modules used in this batch
    const modules = batch.admins.map(a => a.module);

    // Fetch latest day for each module from Note collection
    const modulesWithDay = await Promise.all(modules.map(async (module) => {
      const note = await Note.findOne({ batch: batchId, module })
        .sort({ day: -1 }) // most recent day
        .select("day");

      return {
        module,
        latestDay: note?.day || 0,
        admins: batch.admins.filter(a => a.module === module)
      };
    }));

    // Sort modules by latestDay descending
    modulesWithDay.sort((a, b) => b.latestDay - a.latestDay);

    res.json(modulesWithDay);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal error" });
  }
});


module.exports = router;
