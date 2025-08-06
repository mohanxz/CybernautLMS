const express = require("express");
const router = express.Router();
const Student = require("../models/Student");


const quizTypes = ['Quiz', 'Coding', 'Assignment'];
const Report = require('../models/Report');
const Batch = require("../models/Batch");
const User = require("../models/User");
const verifyAccessToken = require("../middleware/auth");

router.get("/marks", verifyAccessToken, async (req, res) => {
  try {
    const { batchId, module, type = 'Assignment' } = req.query;

    if (!batchId || !quizTypes.includes(type)) {
      return res.status(400).json({ error: "Invalid or missing parameters" });
    }

    const typeIndex = quizTypes.indexOf(type);
    const students = await Student.find({ batch: batchId }).select("_id");
    const studentIds = students.map((s) => s._id);

    const matchStage = {
      student: { $in: studentIds },
      [`marksObtained.${typeIndex}`]: { $gte : 0 }
    };
    if (module) matchStage.module = module;

    const reports = await Report.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$day",
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } },
      { $limit: 10 },
      { $sort: { _id: 1 } }
    ]);

    const formatted = reports.map((r) => ({ day: r._id, count: r.count }));
    res.json(formatted);
  } catch (err) {
    console.error("Error in /statistics/marks:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});




// GET: Leaderboard (Top 3 students by avg marks in a module for a batch)
router.get('/leaderboard', verifyAccessToken, async (req, res) => {
  try {
    const { batchId, module } = req.query;

    if (!batchId || !module) {
      return res.status(400).json({ message: 'batchId and module are required' });
    }

    // 1. Get student IDs in the batch
    const studentIds = await Student.find({ batch: batchId }).distinct('_id');
    if (studentIds.length === 0) return res.json([]);
    // 2. Aggregate avg marks per student in the module
    const topStudents = await Report.aggregate([
  {
    $match: {
      student: { $in: studentIds },
      module
    }
  },
  {
    $project: {
      student: 1,
      validMarks: {
        $filter: {
          input: "$marksObtained",
          as: "mark",
          cond: { $gte: ["$$mark", 0] }
        }
      }
    }
  },
  {
    $group: {
      _id: "$student",
      total: { $sum: { $sum: "$validMarks" } },
      count: { $sum: { $size: "$validMarks" } }
    }
  },
  {
    $project: {
      avg: {
        $cond: [
          { $eq: ["$count", 0] },
          0,
          { $divide: ["$total", "$count"] }
        ]
      }
    }
  },
  { $sort: { avg: -1 } },
  { $limit: 5 },
  {
    $lookup: {
      from: 'students',
      localField: '_id',
      foreignField: '_id',
      as: 'student'
    }
  },
  { $unwind: "$student" },
  {
    $lookup: {
      from: 'users',
      localField: 'student.user',
      foreignField: '_id',
      as: 'user'
    }
  },
  { $unwind: "$user" },
  {
    $project: {
      name: "$user.name",
      avg: { $round: ["$avg", 2] }
    }
  }
]);

    res.json(topStudents);
  } catch (err) {
    console.error("Error in /leaderboard:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});





module.exports = router;
