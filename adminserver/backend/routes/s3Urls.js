const express = require('express');
const router = express.Router();

router.get('/s3-answers', async (req, res) => {
  const { batchName, studentName } = req.query;

  if (!batchName || !studentName) {
    return res.status(400).json({ error: 'Missing required query parameters' });
  }

  try {
    const encodedBatch = encodeURIComponent(batchName.trim());
    const encodedStudent = encodeURIComponent(studentName.trim());

    const s3Base = `https://${process.env.S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com`;

    // Direct keys matching your actual upload paths
    const projectKey = `${encodedBatch}/project/project_${encodedStudent}.pdf`;
    const theoryKey = `${encodedBatch}/project/theory_${encodedStudent}.pdf`;

    const projectAnswerUrl = `${s3Base}/${projectKey}`;
    const theoryAnswerUrl = `${s3Base}/${theoryKey}`;

    res.json({ projectAnswerUrl, theoryAnswerUrl });
  } catch (err) {
    console.error('Error generating S3 URLs:', err);
    res.status(500).json({ error: 'Failed to generate S3 URLs' });
  }
});

module.exports = router;
