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
const verifyAccessToken = require('../middleware/auth');
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


router.post('/upload-assignment', verifyAccessToken, upload.single('file'), async (req, res) => {
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
router.post('/upload-project', verifyAccessToken, upload.single('file'), async (req, res) => {
  const { batch, module, studentName, rollNo } = req.query;
    console.log(batch,studentName,rollNo,module);
  if (!req.file || !batch || !module || !studentName || !rollNo) {
    return res.status(400).json({ error: 'Missing file or required params' });
  }

  try {
    const batchDoc = await Batch.findById(batch).populate("course");
    if (!batchDoc) return res.status(404).json({ error: 'Batch not found' });

    const cleanBatch = sanitizeForFolderName(batchDoc.batchName); // e.g. FS-JUL25-B1
    const cleanModule = sanitizeForFolderName(module);
    const cleanStudent = sanitizeForFolderName(`${studentName}_${rollNo}`);

    const key = `${cleanBatch}/${cleanModule}/evaluation/project/answers/${cleanStudent}/answer.pdf`;
    const s3Url = await uploadToS3(key, req.file.buffer);
    console.log(key);
    res.json({ message: 'Project uploaded successfully', s3path: s3Url });
  } catch (err) {
    console.error('Upload failed:', err);
    res.status(500).json({ error: 'Failed to upload project' });
  }
});

router.post('/upload-project', verifyAccessToken, upload.single('file'), async (req, res) => {
  const { batch, module, studentName, rollNo } = req.query;
    console.log(batch,studentName,rollNo,module);
  if (!req.file || !batch || !module || !studentName || !rollNo) {
    return res.status(400).json({ error: 'Missing file or required params' });
  }

  try {
    const batchDoc = await Batch.findById(batch).populate("course");
    if (!batchDoc) return res.status(404).json({ error: 'Batch not found' });

    const cleanBatch = sanitizeForFolderName(batchDoc.batchName); // e.g. FS-JUL25-B1
    const cleanModule = sanitizeForFolderName(module);
    const cleanStudent = sanitizeForFolderName(`${studentName}_${rollNo}`);

    const key = `${cleanBatch}/${cleanModule}/evaluation/project/answers/${cleanStudent}/answer.pdf`;
    const s3Url = await uploadToS3(key, req.file.buffer);
    console.log(key);
    res.json({ message: 'Project uploaded successfully', s3path: s3Url });
  } catch (err) {
    console.error('Upload failed:', err);
    res.status(500).json({ error: 'Failed to upload project' });
  }
});





router.get('/assignment-question/:batch/:module/:title', verifyAccessToken, (req, res) => {
  const { batch, module, title } = req.params;
    const cleanBatch = sanitizeForFolderName(batch);
    const cleanModule = sanitizeForFolderName(module);
    const cleanTitle = sanitizeForFolderName(title);
  const key = `${cleanBatch}/${cleanModule}/${cleanTitle}/assignment/question.pdf`;
  const s3Url = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
  res.json({ url: s3Url });
});

router.get('/project-theory/:batch', verifyAccessToken, (req, res) => {
  const { batch } = req.params;
  const cleanBatch = sanitizeForFolderName(batch);

  const projectKey = `${cleanBatch}/evaluation/project.pdf`;
  const theoryKey = `${cleanBatch}/evaluation/theory.pdf`;

  const s3Region = process.env.AWS_REGION;
  const projectUrl = `https://${bucketName}.s3.${s3Region}.amazonaws.com/${projectKey}`;
  const theoryUrl = `https://${bucketName}.s3.${s3Region}.amazonaws.com/${theoryKey}`;

  res.json({
    projectUrl,
    theoryUrl,
  });
});

router.post('/notes/upload/:batch/:module/:title/:student/:studentid/:studentroll/:day', verifyAccessToken, upload.single('file'), async (req, res) => {
  const { batch, module, title, student, studentid, studentroll, day } = req.params;
  console.log(batch, module, title, student, studentid, studentroll, day);
  console.log("Uploading notes for:", student, studentid, studentroll, day);
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
    if (report) {
      report.marksObtained[2] = -1;
      await report.save();
    } else {
      report = new Report({
        student: studentid,
        module,
        day,
        marksObtained: [-2, -2, -1]
      });
      await report.save();
    }

    const url = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    res.json({ message: 'Answer uploaded and report saved', url });
  } catch (err) {
    console.error('Upload/DB error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/evaluate/:batchId/:module/:title/:day', verifyAccessToken, async (req, res) => {
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
router.post('/evaluate', verifyAccessToken, async (req, res) => {
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

// Upload Project Question PDF for batch evaluation
router.post('/upload-project-question', verifyAccessToken, upload.single('file'), async (req, res) => {
  const { batch, title } = req.query;
  if (!req.file || !batch || !title) {
    return res.status(400).json({ error: 'Missing file or required params' });
  }

  try {
    const batchDoc = await Batch.findById(batch);
    if (!batchDoc) return res.status(404).json({ error: 'Batch not found' });

    const cleanBatch = sanitizeForFolderName(batchDoc.batchName);
    const cleanModule = sanitizeForFolderName(title);

    const key = `${cleanBatch}/project/${cleanModule}.pdf`;
    const s3Url = await uploadToS3(key, req.file.buffer);

    res.json({ message: 'Project question uploaded successfully', s3path: s3Url });
  } catch (err) {
    console.error('Upload project question failed:', err);
    res.status(500).json({ error: 'Failed to upload project question' });
  }
});

module.exports = router;