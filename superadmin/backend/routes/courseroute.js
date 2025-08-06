const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const Batch = require('../models/Batch');
const Student = require('../models/Student');
const verifyAccessToken = require('../middleware/auth');

router.get('/', verifyAccessToken, async (req, res) => {
  try {
    const courses = await Course.find();

    // For each course, calculate total students across its batches
    const coursesWithStudentCount = await Promise.all(
      courses.map(async (course) => {
        // Get batches for this course
        const batches = await Batch.find({ course: course._id }).select('_id');

        const batchIds = batches.map(b => b._id);

        // Count students in those batches
        const studentCount = await Student.countDocuments({ batch: { $in: batchIds } });

        return {
          ...course.toObject(),
          students: studentCount
        };
      })
    );

    res.json(coursesWithStudentCount);
  } catch (err) {
    console.error("Error retrieving courses:", err);
    res.status(500).json({ message: "Server error" });
  }
});


router.get('/names', verifyAccessToken, async (req, res) => {
  try {
    const courses = await Course.find({}, 'courseName'); // only fetch courseName field
    const courseNames = courses.map(course => course.courseName);
    res.json(courseNames);
  } catch (error) {
    console.error("Error fetching course names:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post('/', verifyAccessToken, async (req, res) => {
  const { courseName, modules, image } = req.body;
  const course = new Course({ courseName, modules, image });
  await course.save();
  res.json(course);
});

router.put('/:id', verifyAccessToken, async (req, res) => {
  const { courseName, modules } = req.body;
  try {
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      { courseName, modules },
      { new: true }
    );
    if (!course) return res.status(404).json({ message: "Course not found" });
    res.json(course);
  } catch (err) {
    console.error("Error updating course:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.delete('/:id', verifyAccessToken, async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });

    // Optional: delete associated batches/students
    await Batch.deleteMany({ course: course._id });

    res.json({ message: "Course deleted successfully" });
  } catch (err) {
    console.error("Error deleting course:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/courses/modules - Get unique list of all modules
router.get('/modules', verifyAccessToken, async (req, res) => {
  try {
    const courses = await Course.find({}, 'modules'); // get only modules field

    const moduleSet = new Set();
    courses.forEach(course => {
      (course.modules || []).forEach(mod => moduleSet.add(mod));
    });

    res.json(Array.from(moduleSet).sort()); // return sorted module list
  } catch (err) {
    console.error('Failed to fetch modules:', err.message);
    res.status(500).json({ error: 'Failed to fetch modules' });
  }
});



module.exports = router;
