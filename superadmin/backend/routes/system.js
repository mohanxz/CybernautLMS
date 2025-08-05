const express = require("express");
const router = express.Router();
const os = require("os");
const User = require("../models/User");
const verifyAccessToken = require('../middleware/auth');

// GET /api/system/overview
router.get("/overview", verifyAccessToken, async (req, res) => {
  try {
    // DB check
    let dbHealth = "unhealthy";
    try {
      await User.estimatedDocumentCount();
      dbHealth = "healthy";
    } catch {}

    // Active Sessions (users active in last 10 minutes)
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000);
    const activeSessions = await User.countDocuments({ lastActive: { $gte: tenMinAgo } });

    res.json({
      serverStatus: "online",
      dbHealth,
      activeSessions
      // storageUsed: removed
    });
  } catch (err) {
    console.error("System overview error:", err);
    res.status(500).json({ message: "Error fetching system overview" });
  }
});

module.exports = router;
