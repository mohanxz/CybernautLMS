const express = require('express');
const Student = require('../models/Student');
const Admin = require('../models/Admin');
const Batch = require('../models/Batch');
const Course = require('../models/Course');

const router = express.Router();
const verifyAccessToken = require('../middleware/auth');

router.get('/', verifyAccessToken, async (req, res) => {
  try {
    const course = await Course.find();
    const batch = await Batch.find();
    // Fetch students with batch and course populated
    const students = await Student.find().populate({
      path: 'batch',
      populate: {
        path: 'course',
        model: 'Course'
      }
    });

    // Fetch all admins
    const admins = await Admin.find();

    
    // Fetch active batches (startDate < now)
    const batches = await Batch.find({ startDate: { $lt: new Date() } });

    // Count students per course name
    const courses = students.reduce((acc, student) => {
      const courseName = student.batch?.course?.courseName;
      if (courseName) {
        acc[courseName] = (acc[courseName] || 0) + 1;
      }
      return acc;
    }, {});

    // Count admins per case-sensitive specialization
    const adminSpecializations = admins.reduce((acc, admin) => {
      if (Array.isArray(admin.specialisation)) {
        admin.specialisation.forEach(spec => {
          if (spec) {
            acc[spec] = (acc[spec] || 0) + 1;
          }
        });
      }
      return acc;
    }, {});

    const stats = {
      totalStudents: students.length,
      totalLecturers: admins.length,
      activeBatches: batches.length,
      totalCourses: course.length,
      totalBatches: batch.length,
      courses,
      adminSpecializations
    };

    res.json(stats);
  } catch (error) {
    console.error('Error in /api/stats:', error);
    res.status(500).send({ error: 'Internal Server Error' });
  }
});

module.exports = router;
