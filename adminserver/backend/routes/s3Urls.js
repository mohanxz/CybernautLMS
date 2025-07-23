const express = require('express');
const { S3Client, HeadObjectCommand } = require('@aws-sdk/client-s3');

const router = express.Router();

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

// Check if object exists using HeadObjectCommand
const checkObjectExists = async (Bucket, Key) => {
  try {
    const command = new HeadObjectCommand({ Bucket, Key });
    await s3.send(command);
    return true;
  } catch (err) {
    if (err.name === 'NotFound') return false;
    if (err.$metadata?.httpStatusCode === 404) return false;
    throw err;
  }
};

router.get('/s3-answers', async (req, res) => {
  const { batchName, studentName } = req.query;

  if (!batchName || !studentName) {
    return res.status(400).json({ error: 'Missing required query parameters' });
  }

  try {
    const encodedBatch = encodeURIComponent(batchName.trim());
    const encodedStudent = encodeURIComponent(studentName.trim());

    const Bucket = process.env.S3_BUCKET;
    const region = process.env.AWS_REGION;
    const s3Base = `https://${Bucket}.s3.${region}.amazonaws.com`;

    const projectKey = `${encodedBatch}/project/project_${encodedStudent}.pdf`;
    const theoryKey = `${encodedBatch}/project/theory_${encodedStudent}.pdf`;

    const [projectExists, theoryExists] = await Promise.all([
      checkObjectExists(Bucket, projectKey),
      checkObjectExists(Bucket, theoryKey)
    ]);

    const projectAnswerUrl = projectExists ? `${s3Base}/${projectKey}` : null;
    const theoryAnswerUrl = theoryExists ? `${s3Base}/${theoryKey}` : null;

    res.json({ projectAnswerUrl, theoryAnswerUrl });
  } catch (err) {
    console.error('Error checking S3 object existence:', err);
    res.status(500).json({ error: 'Failed to check S3 object existence' });
  }
});

module.exports = router;
