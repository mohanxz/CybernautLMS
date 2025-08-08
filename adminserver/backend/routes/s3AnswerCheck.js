const express = require('express');
const axios = require('axios');
const router = express.Router();
const verifyAccessToken = require('../middleware/auth');

// Route: GET /api/s3-answers/check
router.get('/check', verifyAccessToken, async (req, res) => {
  const { batchName, studentName, rollNo, module } = req.query;

  if (!batchName || !studentName || !rollNo || !module) {
    return res.status(400).json({ error: 'Missing required query parameters' });
  }

  try {
    const encodedBatch = encodeURIComponent(batchName.trim());
    const encodedStudent = encodeURIComponent(studentName.trim());
    const encodedModule = encodeURIComponent(module.trim());
    const encodedRollNo = encodeURIComponent(rollNo);

    const s3Base = `https://${process.env.S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com`;
    const projectKey = `${encodedBatch}/${encodedModule}/evaluation/project/answers/${encodedStudent}_${encodedRollNo}/answer.pdf`;
    const projectAnswerUrl = `${s3Base}/${projectKey}`;

    // Perform HEAD request to check if file exists
    try {
      await axios.head(projectAnswerUrl);
      return res.json({ exists: true, projectAnswerUrl });
    } catch {
      return res.json({ exists: false, projectAnswerUrl: null });
    }

  } catch (err) {
    console.error('Error checking S3 answer URL:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
