const express = require('express');
const router = express.Router();

router.get('/s3-answers', async (req, res) => {
  const { batchName, studentName, rollNo , module} = req.query;

  if (!batchName || !studentName || !rollNo) {
    return res.status(400).json({ error: 'Missing required query parameters' });
  }

  try {
    const encodedBatch = encodeURIComponent(batchName.trim());
    const encodedStudent = encodeURIComponent(studentName.trim());

    const s3Base = `https://${process.env.S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com`;

    const projectKey = `${encodedBatch}/${module}/evaluation/project/answers/${encodedStudent}_${rollNo}/answer.pdf`;

    const projectAnswerUrl = `${s3Base}/${projectKey}`;
    console.log(projectAnswerUrl);
    res.json({ projectAnswerUrl });
  } catch (err) {
    console.error('Error generating S3 URLs:', err);
    res.status(500).json({ error: 'Failed to generate S3 URLs' });
  }
});

module.exports = router;
