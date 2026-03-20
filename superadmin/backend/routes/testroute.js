const express = require("express");
const User = require("../models/User");
const Student = require("../models/Student");
const router = express.Router();
const verifyAccessToken = require("../middleware/auth");
const Report = require("../models/Report");
const Batch = require("../models/Batch");
const Course = require("../models/Course"); // Assuming it exists

router.post("/save", verifyAccessToken, async (req, res) => {
  const { studentId, course, quiz, assignment, code } = req.body;

  try {
    let testDoc = await Test.findOne({ student: studentId, course });

    if (!testDoc) {
      testDoc = await Test.create({
        student: studentId,
        course,
        quiz: [],
        assignment: [],
        code: [],
      });
    }

    testDoc.quiz.push(quiz);
    testDoc.assignment.push(assignment);
    testDoc.code.push(code);

    await testDoc.save();

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error saving test marks" });
  }
});

router.get("/top/:course", verifyAccessToken, async (req, res) => {
  try {
    const courseName = decodeURIComponent(req.params.course);

    //  Step 1: Get course ID from course name
    const courseDoc = await Course.findOne({ courseName: courseName });
    if (!courseDoc) return res.status(404).json({ error: "Course not found" });

    //  Step 2: Get batches under that course
    const batchIds = await Batch.find({ course: courseDoc._id }).distinct(
      "_id",
    );

    //  Step 3: Get students in those batches
    const students = await Student.find({ batch: { $in: batchIds } }).populate(
      "user",
    );

    const result = [];

    //  Step 4: Calculate averages per student
    for (const student of students) {
      const reports = await Report.find({ student: student._id });

      let quizSum = 0,
        quizCount = 0;
      let codeSum = 0,
        codeCount = 0;
      let assignSum = 0,
        assignCount = 0;

      for (const r of reports) {
        const [quiz, code, assign] = r.marksObtained;

        if (quiz >= 0) {
          quizSum += quiz;
          quizCount++;
        }
        if (code >= 0) {
          codeSum += code;
          codeCount++;
        }
        if (assign >= 0) {
          assignSum += assign;
          assignCount++;
        }
      }

      const quizAvg = quizCount ? quizSum / quizCount : 0;
      const codeAvg = codeCount ? codeSum / codeCount : 0;
      const assignAvg = assignCount ? assignSum / assignCount : 0;
      const totalAvg = (quizAvg + codeAvg + assignAvg) / 3;

      result.push({
        studentName: student.user.name,
        quizAvg,
        codeAvg,
        assignAvg,
        totalAvg,
      });
    }

    result.sort((a, b) => b.totalAvg - a.totalAvg);

    res.json(result);
  } catch (err) {
    console.error("Top performer error:", err);
    res
      .status(500)
      .json({ error: "Server error while calculating top performers" });
  }
});

module.exports = router;
