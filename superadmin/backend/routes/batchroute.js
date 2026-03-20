const express = require("express");
const router = express.Router();

const Batch = require("../models/Batch");
const Course = require("../models/Course");
const Student = require("../models/Student");
const Admin = require("../models/Admin");

const verifyAccessToken = require("../middleware/auth");

/* -------------------------------------------------- */
/* GET ALL BATCHES */
/* -------------------------------------------------- */

router.get("/", verifyAccessToken, async (req, res) => {
  try {
    const batches = await Batch.find()
      .populate({
        path: "course",
        select: "courseName",
      })
      .populate({
        path: "admins.admin",
        select: "name email",
      });

    const result = await Promise.all(
      batches.map(async (batch) => {
        const studentCount = await Student.countDocuments({
          batch: batch._id,
        });

        return {
          ...batch.toObject(),
          studentCount,
        };
      }),
    );

    res.json(result);
  } catch (err) {
    console.error("Error fetching batches:", err);

    res.status(500).json({
      error: "Failed to fetch batches",
    });
  }
});

/* -------------------------------------------------- */
/* GET BATCH COUNT FOR NAME GENERATION */
/* -------------------------------------------------- */

router.get("/count", verifyAccessToken, async (req, res) => {
  try {
    const { courseId, month, year } = req.query;

    if (!courseId || !month || !year) {
      return res.status(400).json({
        message: "courseId, month and year are required",
      });
    }

    const m = parseInt(month);
    const y = parseInt(year);

    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 1);

    const count = await Batch.countDocuments({
      course: courseId,
      startDate: {
        $gte: start,
        $lt: end,
      },
    });

    res.json({ count });
  } catch (err) {
    console.error("Error counting batches:", err);

    res.status(500).json({
      error: "Failed to count batches",
    });
  }
});

// GET batches by course ID
router.get("/course/:courseId", verifyAccessToken, async (req, res) => {
  try {
    const { courseId } = req.params;

    // Find all batches for this course
    const batches = await Batch.find({ course: courseId }).select("_id");

    const batchIds = batches.map((b) => b._id);

    // Count students inside those batches
    const studentCount = await Student.countDocuments({
      batch: { $in: batchIds },
    });

    res.json({
      count: batches.length,
      studentCount,
    });
  } catch (error) {
    console.error("Error fetching course batches:", error);

    res.status(500).json({
      error: "Failed to fetch batch data",
    });
  }
});

/* -------------------------------------------------- */
/* GET SINGLE BATCH */
/* -------------------------------------------------- */

router.get("/:id", verifyAccessToken, async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id)
      .populate("course", "courseName")
      .populate("admins.admin", "name");

    if (!batch) {
      return res.status(404).json({
        message: "Batch not found",
      });
    }

    const studentCount = await Student.countDocuments({
      batch: batch._id,
    });

    res.json({
      ...batch.toObject(),
      studentCount,
    });
  } catch (err) {
    console.error("Error fetching batch:", err);

    res.status(500).json({
      error: "Failed to fetch batch",
    });
  }
});

/* -------------------------------------------------- */
/* CREATE BATCH */
/* -------------------------------------------------- */

router.post("/", verifyAccessToken, async (req, res) => {
  try {
    const { batchName, course, startDate, admins } = req.body;

    if (
      !batchName ||
      !course ||
      !startDate ||
      !Array.isArray(admins) ||
      admins.length === 0
    ) {
      return res.status(400).json({
        message:
          "batchName, course, startDate required and admins must be non-empty",
      });
    }

    const existing = await Batch.findOne({ batchName, course });

    if (existing) {
      return res.status(400).json({
        message: "Batch name already exists for this course",
      });
    }

    const adminsWithUserIds = await Promise.all(
      admins.map(async (adminEntry) => {
        const adminDoc = await Admin.findById(adminEntry.admin).select("user");

        if (!adminDoc) {
          throw new Error(`Admin with ID ${adminEntry.admin} not found`);
        }

        return {
          module: adminEntry.module,
          admin: adminDoc.user,
          ifCompleted: adminEntry.ifCompleted || false,
        };
      }),
    );

    const batch = new Batch({
      batchName,
      course,
      startDate,
      admins: adminsWithUserIds,
    });

    await batch.save();

    res.status(201).json(batch);
  } catch (err) {
    console.error("Error creating batch:", err);

    res.status(500).json({
      error: err.message,
    });
  }
});

/* -------------------------------------------------- */
/* UPDATE BATCH */
/* -------------------------------------------------- */

router.put("/:id", verifyAccessToken, async (req, res) => {
  try {
    const { batchName, course, startDate, admins } = req.body;

    if (
      !batchName ||
      !course ||
      !startDate ||
      !Array.isArray(admins) ||
      admins.length === 0
    ) {
      return res.status(400).json({
        message:
          "batchName, course, startDate required and admins must be non-empty",
      });
    }

    const existingBatch = await Batch.findById(req.params.id);

    if (!existingBatch) {
      return res.status(404).json({
        message: "Batch not found",
      });
    }

    if (batchName !== existingBatch.batchName) {
      const nameExists = await Batch.findOne({
        batchName,
        course,
        _id: { $ne: req.params.id },
      });

      if (nameExists) {
        return res.status(400).json({
          message: "Batch name already exists for this course",
        });
      }
    }

    const adminsWithUserIds = await Promise.all(
      admins.map(async (adminEntry) => {
        const adminDoc = await Admin.findById(adminEntry.admin).select("user");

        if (!adminDoc) {
          throw new Error(`Admin with ID ${adminEntry.admin} not found`);
        }

        return {
          module: adminEntry.module,
          admin: adminDoc.user,
          ifCompleted: adminEntry.ifCompleted || false,
        };
      }),
    );

    const updatedBatch = await Batch.findByIdAndUpdate(
      req.params.id,
      {
        batchName,
        course,
        startDate,
        admins: adminsWithUserIds,
      },
      { new: true, runValidators: true },
    );

    res.json(updatedBatch);
  } catch (err) {
    console.error("Error updating batch:", err);

    res.status(500).json({
      error: err.message,
    });
  }
});

/* -------------------------------------------------- */
/* DELETE BATCH */
/* -------------------------------------------------- */

router.delete("/:id", verifyAccessToken, async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id);

    if (!batch) {
      return res.status(404).json({
        message: "Batch not found",
      });
    }

    const studentCount = await Student.countDocuments({
      batch: req.params.id,
    });

    if (studentCount > 0) {
      return res.status(400).json({
        message: "Cannot delete batch with existing students",
      });
    }

    await Batch.findByIdAndDelete(req.params.id);

    res.json({
      message: "Batch deleted successfully",
    });
  } catch (err) {
    console.error("Error deleting batch:", err);

    res.status(500).json({
      error: "Failed to delete batch",
    });
  }
});

module.exports = router;
