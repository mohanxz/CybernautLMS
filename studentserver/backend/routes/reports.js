const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const verifyAccessToken = require('../middleware/auth');

// Fetch all reports for a student
router.get('/:studentId', verifyAccessToken, async (req, res) => {
  try {
    const reports = await Report.find({ student: req.params.studentId });
    res.json(reports);
  } catch (err) {
    console.error('Error fetching reports:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// (Optional) Fetch the latest report for each module of a student
router.get('/latest/:studentId', verifyAccessToken, async (req, res) => {
  try {
    const allReports = await Report.find({ student: req.params.studentId }).sort({ day: -1 });

    const latestPerModule = {};
    for (const report of allReports) {
      if (!latestPerModule[report.module]) {
        latestPerModule[report.module] = report;
      }
    }

    res.json(Object.values(latestPerModule));
  } catch (err) {
    console.error('Error fetching latest module reports:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;