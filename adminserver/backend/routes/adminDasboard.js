const express = require("express");
const router = express.Router();
const Batch = require("../models/Batch");
const Student = require("../models/Student");
const Report = require("../models/Report");
const Admin = require("../models/Admin");
const User = require("../models/User");
const Verify = require("../middleware/auth");

router.get("/lecturer", Verify, async (req, res) => {
  try {
    const userId = req.user.id; // This is the User._id (correct)

    // Get admin info
    const admin = await Admin.findOne({ user: userId }).populate("user");
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    const currentMonth = new Date().getMonth();
    const isPaidThisMonth = admin.paidForMonth === currentMonth;

    //  Get batches where this user is assigned in admins.admin (which is of type User)
    const batches = await Batch.find({ "admins.admin": userId }).populate(
      "course",
    );

    const batchIds = batches.map((b) => b._id);
    const studentCount = await Student.countDocuments({
      batch: { $in: batchIds },
    });

    const coursesHandled = new Set(batches.map((b) => b.course?.courseName));

    res.json({
      stats: {
        name: admin.user.name,
        email: admin.user.email,
        courseCount: coursesHandled.size,
        batchCount: batches.length,
        totalStudents: studentCount,
        salaryAmount: admin.salary || 0,
        paidForMonth: admin.paidForMonth,
        currentMonth,
        salaryStatus: isPaidThisMonth ? "Paid" : "Unpaid",
      },
      batches: batches.map((b) => {
        const modules = b.admins
          .filter((entry) => entry.admin.toString() === userId.toString()) //  ensure string comparison
          .map((entry) => entry.module);

        return {
          _id: b._id,
          batchName: b.batchName,
          courseName: b.course?.courseName || "Unknown",
          modulesHandled: modules,
        };
      }),
    });
  } catch (err) {
    console.error("Lecturer dashboard error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
