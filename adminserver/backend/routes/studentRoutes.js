const express = require("express");
const router = express.Router();
const verifyAccessToken = require("../middleware/auth");

const Admin = require("../models/Admin");
const Batch = require("../models/Batch");
const Student = require("../models/Student");
const User = require("../models/User");

// GET /api/students/my-students
router.get("/my-students", verifyAccessToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { batchId, name = "", course = "", year = "" } = req.query;

    // 1. Get batches this admin is handling
    const batchDocs = await Batch.find({ "admins.admin": userId }).select(
      "_id batchName",
    );

    // Filter batches based on optional course/year
    const filteredBatchDocs = batchDocs.filter((batch) => {
      const parts = batch.batchName.split("-"); // e.g., FS-JUL25-B1
      const coursePart = parts[0];
      const yearPart = parts[1]?.slice(3); // e.g., from JUL25 -> 25

      const courseMatch = course ? course === coursePart : true;
      const yearMatch = year ? year === yearPart : true;

      return courseMatch && yearMatch;
    });

    const batchIds = filteredBatchDocs.map((b) => b._id);

    // 2. Build query for students
    const query = { batch: { $in: batchIds } };
    if (batchId) {
      query.batch = batchId;
    }

    // 3. Fetch students
    const students = await Student.find(query)
      .populate("user", "name email")
      .populate("batch", "batchName");

    // 4. Optional name filter
    let filteredStudents = students;
    if (name) {
      const keyword = name.toLowerCase();
      filteredStudents = students.filter((s) =>
        s.user.name.toLowerCase().includes(keyword),
      );
    }

    //  5. Sort by batchName, then rollNo
    filteredStudents.sort((a, b) => {
      const batchA = a.batch?.batchName || "";
      const batchB = b.batch?.batchName || "";
      const batchCompare = batchA.localeCompare(batchB);
      if (batchCompare !== 0) return batchCompare;
      return a.rollNo - b.rollNo;
    });

    // 6. Prepare batch options
    const batchOptions = filteredBatchDocs.map((b) => ({
      _id: b._id,
      batchName: b.batchName,
    }));

    // 7. Send response
    res.json({
      students: filteredStudents.map((s) => ({
        _id: s._id,
        name: s.user.name,
        email: s.user.email,
        batchName: s.batch?.batchName || "Unknown",
        phone: s.phone,
        dob: s.dob,
        rollNo: s.rollNo,
        address: s.address,
      })),
      batchOptions,
    });
  } catch (err) {
    console.error("Lecturer students fetch error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
