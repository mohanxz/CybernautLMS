const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Student = require('../models/Student');
const Report = require('../models/Report');
const Batch = require('../models/Batch');
const {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command
} = require('@aws-sdk/client-s3');
// AWS S3 config
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const bucketName = process.env.S3_BUCKET;
const upload = multer({ storage: multer.memoryStorage() });
// 🔒 Sanitize function
function sanitizeForFolderName(str) {
  return str.replace(/[:*?"<>|\\\/]/g, '').replace(/\s+/g, '_'); // remove illegal chars, spaces -> _
}

const uploadToS3 = async (key, buffer, contentType = 'application/pdf') => {
  await s3.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );

  return `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
};


router.post('/upload-assignment', upload.single('file'), async (req, res) => {
  const { batch, module, title } = req.query;

  if (!req.file || !batch || !module || !title) {
    return res.status(400).json({ error: 'Missing file or required params' });
  }

  try {
    // 🔍 Lookup batch name to sanitize folder structure
    const batchDoc = await Batch.findById(batch);
    if (!batchDoc) return res.status(404).json({ error: 'Batch not found' });

    const cleanBatch = sanitizeForFolderName(batchDoc.batchName);
    const cleanModule = sanitizeForFolderName(module);
    const cleanTitle = sanitizeForFolderName(title);

    // 🧠 Build S3 key
    const key = `${cleanBatch}/${cleanModule}/${cleanTitle}/assignment/question.pdf`;

    // 📤 Upload directly to S3 from buffer
    await s3.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: req.file.buffer,
        ContentType: 'application/pdf'
      })
    );

    const s3Url = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    

    res.json({
      message: 'Assignment uploaded directly to S3 successfully',
      s3path: s3Url
    });

  } catch (err) {
    console.error('❌ Upload failed:', err);
    res.status(500).json({ error: 'Failed to upload assignment to S3' });
  }
});

// Upload Project
router.post('/upload-project', upload.single('file'), async (req, res) => {
  const { batch, title } = req.query;

  if (!req.file || !batch || !title) {
    return res.status(400).json({ error: 'Missing file or required params' });
  }

  try {
    const batchDoc = await Batch.findById(batch);
    if (!batchDoc) return res.status(404).json({ error: 'Batch not found' });

    const cleanBatch = sanitizeForFolderName(batchDoc.batchName);
    const cleanTitle = sanitizeForFolderName(title);

    const key = `${cleanBatch}/project/${cleanTitle}.pdf`;
    const s3Url = await uploadToS3(key, req.file.buffer); // ✅ fixed

    res.json({ message: 'Project uploaded successfully', s3path: s3Url });
  } catch (err) {
    console.error('Upload failed:', err);
    res.status(500).json({ error: 'Failed to upload project' });
  }
});

// Upload Theory
router.post('/upload-theory', upload.single('file'), async (req, res) => {
  const { batch, title } = req.query;

  if (!req.file || !batch || !title) {
    return res.status(400).json({ error: 'Missing file or required params' });
  }

  try {
    const batchDoc = await Batch.findById(batch);
    if (!batchDoc) return res.status(404).json({ error: 'Batch not found' });

    const cleanBatch = sanitizeForFolderName(batchDoc.batchName);
    const cleanTitle = sanitizeForFolderName(title);

    const key = `${cleanBatch}/theory/${cleanTitle}.pdf`;
    const s3Url = await uploadToS3(key, req.file.buffer); // ✅ fixed

    res.json({ message: 'Theory uploaded successfully', s3path: s3Url });
  } catch (err) {
    console.error('Upload failed:', err);
    res.status(500).json({ error: 'Failed to upload theory' });
  }
});



router.get('/assignment-question/:batch/:module/:title', (req, res) => {
  const { batch, module, title } = req.params;
    const cleanBatch = sanitizeForFolderName(batch);
    const cleanModule = sanitizeForFolderName(module);
    const cleanTitle = sanitizeForFolderName(title);
  const key = `${cleanBatch}/${cleanModule}/${cleanTitle}/assignment/question.pdf`;
  const s3Url = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
  res.json({ url: s3Url });
});

router.get('/project-theory/:batch', async (req, res) => {
  const { batch } = req.params;

  try {
    const batchDoc = await Batch.findById(batch);
    if (!batchDoc) return res.status(404).json({ error: 'Batch not found' });

    const cleanBatch = sanitizeForFolderName(batchDoc.batchName);

    const projectKey = `${cleanBatch}/project/FinalEvaluation.pdf`;
    const theoryKey = `${cleanBatch}/theory/FinalEvaluation.pdf`; // ✅ Corrected path

    const s3Region = process.env.AWS_REGION;
    const projectUrl = `https://${bucketName}.s3.${s3Region}.amazonaws.com/${projectKey}`;
    const theoryUrl = `https://${bucketName}.s3.${s3Region}.amazonaws.com/${theoryKey}`;

    res.json({ projectUrl, theoryUrl });
  } catch (err) {
    console.error('Error fetching project/theory links:', err);
    res.status(500).json({ error: 'Failed to fetch project/theory URLs' });
  }
});


router.post('/notes/upload/:batch/:module/:title/:student/:studentid/:studentroll/:day', upload.single('file'), async (req, res) => {
  const { batch, module, title, student, studentid, studentroll, day } = req.params;

  if (!req.file) return res.status(400).json({ error: 'No file' });

  const cleanBatch = sanitizeForFolderName(batch);
  const cleanModule = sanitizeForFolderName(module);
  const cleanTitle = sanitizeForFolderName(title);
  const cleanStudent = sanitizeForFolderName(student.trim()); // trimmed student name

  const key = `${cleanBatch}/${cleanModule}/${cleanTitle}/assignment/${cleanStudent}_${studentroll}/answer.pdf`;

  try {
    // Upload to S3
    await s3.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: req.file.buffer,
      ContentType: 'application/pdf'
    }));

    // Create or update Report
    let report = await Report.findOne({ student: studentid, module, day });
    report.marksObtained = [-2, -2, -1];
    await report.save();

    const url = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    res.json({ message: 'Answer uploaded and report saved', url });
  } catch (err) {
    console.error('Upload/DB error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
router.get('/evaluate/:batchId/:module/:title/:day', async (req, res) => {
  const { batchId, module, title, day } = req.params;

  try {
    const batchDoc = await Batch.findById(batchId);
    if (!batchDoc) return res.status(404).json({ error: 'Batch not found' });

    const batchName = batchDoc.batchName;
    const cleanBatch = sanitizeForFolderName(batchName);
    const cleanModule = sanitizeForFolderName(module);
    const cleanTitle = sanitizeForFolderName(title);

    const prefix = `${cleanBatch}/${cleanModule}/${cleanTitle}/assignment/`;
    const list = await s3.send(new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: prefix
    }));

    const keys = list.Contents?.map(obj => obj.Key) || [];

    // Extract sanitized + trimmed student names from folder structure
    const studentNames = [...new Set(
      keys
        .filter(k => k.endsWith('/answer.pdf'))
        .map(k => decodeURIComponent(k.split('/')[4].split('_')[0].trim())) // extract name and trim
    )];

    const students = await Student.find()
      .populate('user', 'name')
      .then(res =>
        res.filter(stu => studentNames.includes(stu.user?.name.trim()))
      );

    const pending = [];

    for (const student of students) {
      const report = await Report.findOne({
        student: student._id,
        module: module,
        day: parseInt(day)
      });

      // Only include those not yet evaluated
      if (!report || report.marksObtained[2] === -1) {
        const cleanStudentName = encodeURIComponent(student.user.name.trim());
        const answerKey = `${cleanBatch}/${cleanModule}/${cleanTitle}/assignment/${cleanStudentName}_${student.rollNo}/answer.pdf`;

        pending.push({
          studentId: student._id,
          studentName: student.user.name,
          studentRoll: student.rollNo,
          answerLink: `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${answerKey}`
        });
      }
    }

    res.json(pending);
  } catch (err) {
    console.error('❌ Evaluation error:', err.stack || err);
    res.status(500).json({ error: 'Failed to fetch submissions', details: err.message });
  }
});


// POST /evaluate - Save assignment marks
router.post('/evaluate', async (req, res) => {
  const { studentId, module, day, mark } = req.body;

  if (!studentId || !module || day == null || mark == null) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    let report = await Report.findOne({ student: studentId, module: module, day });

    if (!report) {
      // Create if not exists
      report = new Report({
        student: studentId,
        module: module,
        day,
        marksObtained: [-2, -2, -2],
      });
    }

    report.marksObtained[2] = mark;
    await report.save();
   
    res.json({ message: "Marks updated successfully" });
  } catch (err) {
    console.error("Error saving marks:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});


module.exports = router;