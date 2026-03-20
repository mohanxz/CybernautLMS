const express = require("express");
const Admin = require("../models/Admin");
const Batch = require("../models/Batch");
const Payment = require("../models/Payment");

const router = express.Router();
const verifyAccessToken = require("../middleware/auth");

console.log("Salary routes loaded successfully");

/* -------------------------------------------------- */
/* TEST ROUTE */
/* -------------------------------------------------- */

router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Salary routes working",
    time: new Date(),
  });
});

/* -------------------------------------------------- */
/* GET SALARY DATA (PER MODULE) */
/* -------------------------------------------------- */

router.get("/", verifyAccessToken, async (req, res) => {
  try {

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const batches = await Batch.find()
      .populate("admins.admin")
      .populate("course", "courseName");

    const rows = [];

    for (const batch of batches) {

      for (const assignment of batch.admins) {

        if (!assignment.ifCompleted) continue;

        const adminUserId = assignment.admin;

        const admin = await Admin.findOne({ user: adminUserId })
          .populate("user", "name email phone");

        if (!admin) continue;

        /* ---------------------------------- */
        /* CHECK PAYMENT FOR THIS MODULE */
        /* ---------------------------------- */

        const payment = await Payment.findOne({
          admin: admin._id,
          batch: batch._id,
          module: assignment.module,
          month: currentMonth,
          year: currentYear
        });

        rows.push({
          adminId: admin._id,
          name: admin.user?.name,
          email: admin.user?.email,
          phone: admin.phone,

          batchId: batch._id,
          batchName: batch.batchName,
          module: assignment.module,

          salary: admin.salary,

          paymentId: payment?._id || null,

          salaryStatus: payment ? payment.status : "pending"
        });

      }

    }

    res.json(rows);

  } catch (error) {

    console.error("Salary fetch error:", error);

    res.status(500).json({
      error: "Failed to fetch salary data"
    });

  }
});


/* -------------------------------------------------- */
/* UPDATE MODULE PAYMENT */
/* -------------------------------------------------- */

router.patch("/payment", verifyAccessToken, async (req, res) => {

  try {

    const { adminId, batchId, module, status } = req.body;

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    if (!["pending", "paid"].includes(status)) {
      return res.status(400).json({
        error: "Invalid payment status"
      });
    }

    let payment = await Payment.findOne({
      admin: adminId,
      batch: batchId,
      module,
      month: currentMonth,
      year: currentYear
    });

    if (!payment) {

      const admin = await Admin.findById(adminId);

      payment = new Payment({
        admin: adminId,
        batch: batchId,
        module,
        amount: admin.salary,
        month: currentMonth,
        year: currentYear,
        status
      });

    } else {

      payment.status = status;

    }

    await payment.save();

    res.json({
      message: "Payment updated successfully",
      payment
    });

  } catch (error) {

    console.error("Payment update error:", error);

    res.status(500).json({
      error: "Failed to update payment"
    });

  }

});


/* -------------------------------------------------- */
/* PAYMENT STATS */
/* -------------------------------------------------- */

router.get("/stats/payments", verifyAccessToken, async (req, res) => {

  try {

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const payments = await Payment.find({
      month: currentMonth,
      year: currentYear
    });

    let totalSpent = 0;
    let paidCount = 0;
    let pendingCount = 0;

    for (const pay of payments) {

      if (pay.status === "paid") {

        totalSpent += pay.amount;
        paidCount++;

      } else {

        pendingCount++;

      }

    }

    res.json({
      totalSpent,
      paidCount,
      pendingCount
    });

  } catch (error) {

    console.error("Payment stats error:", error);

    res.status(500).json({
      error: "Failed to fetch payment stats"
    });

  }

});

module.exports = router;