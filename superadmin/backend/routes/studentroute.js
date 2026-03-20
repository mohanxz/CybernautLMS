const express = require('express');
const bcrypt = require('bcrypt');
const User = require("../models/User");
const Student = require('../models/Student');
const Batch = require('../models/Batch');
const { Parser } = require('json2csv');
const nodemailer = require("nodemailer");

const router = express.Router();
const verifyAccessToken = require('../middleware/auth');

function sanitizeCell(value) {
  if (value && typeof value === "object") {
    return value.text || "";
  }
  return value;
}

/* ================= EMAIL ================= */

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/* ================= GET NEXT AVAILABLE ROLL NUMBER ================= */
const getNextAvailableRollNumber = async () => {
  // Get all roll numbers
  const allStudents = await Student.find({}, 'rollNo').sort({ rollNo: 1 });
  const rollNumbers = allStudents.map(s => s.rollNo);
  
  if (rollNumbers.length === 0) {
    return 1;
  }
  
  // Find the first gap in the sequence
  let nextNum = 1;
  for (let i = 0; i < rollNumbers.length; i++) {
    if (rollNumbers[i] !== nextNum) {
      return nextNum;
    }
    nextNum++;
  }
  
  // If no gaps, return next number after the last
  return nextNum;
};

/* ================= GET BATCH AND COURSE DETAILS ================= */
const getBatchAndCourseDetails = async (batchId) => {
  try {
    const batch = await Batch.findById(batchId).populate('course', 'courseName');
    if (!batch) {
      return { 
        batchName: 'Unknown Batch', 
        courseName: 'Unknown Course',
        startDate: null 
      };
    }
    return {
      batchName: batch.batchName,
      courseName: batch.course?.courseName || 'Unknown Course',
      startDate: batch.startDate
    };
  } catch (err) {
    console.error("Error fetching batch details:", err);
    return { 
      batchName: 'Unknown Batch', 
      courseName: 'Unknown Course',
      startDate: null 
    };
  }
};

/* ================= SAVE STUDENTS ================= */

router.post("/save-selected", verifyAccessToken, async (req, res) => {
  const selectedStudents = req.body;
  const credentials = [];
  const results = {
    added: [],
    skipped: [],
    errors: []
  };

  try {
    // Process students one by one to ensure unique roll numbers
    for (const stu of selectedStudents) {
      try {
        const email = sanitizeCell(stu.email);
        const name = sanitizeCell(stu.name);
        const phone = sanitizeCell(stu.phone);
        const address = sanitizeCell(stu.address) || "N/A";
        const batchId = stu.batch;
        
        // Parse roll number if provided (for bulk uploads)
        let requestedRollNo = stu.rollNo ? parseInt(stu.rollNo) : null;

        /* ===== GET BATCH AND COURSE DETAILS ===== */
        const { batchName, courseName, startDate } = await getBatchAndCourseDetails(batchId);

        /* ===== DOB SAFE ===== */
        let dob = null;
        if (typeof stu.dob === "number") {
          dob = new Date(Date.UTC(1899, 11, 30) + stu.dob * 86400000);
        } else if (stu.dob) {
          const parsed = new Date(stu.dob);
          if (!isNaN(parsed)) dob = parsed;
        }

        /* ===== USER CHECK ===== */
        let user = await User.findOne({ email });
        let plainPassword = null;

        if (!user) {
          plainPassword = Math.random().toString(36).slice(-8);
          const hashedPassword = await bcrypt.hash(plainPassword, 10);
          
          user = await User.create({
            name,
            email,
            password: hashedPassword,
            role: "student",
          });
        }

        /* ===== CHECK FOR EXISTING STUDENT ===== */
        const existingStudent = await Student.findOne({
          user: user._id,
          batch: batchId
        });

        if (existingStudent) {
          results.skipped.push({ email, reason: "Already exists in this batch" });
          continue;
        }

        /* ===== DETERMINE ROLL NUMBER ===== */
        let finalRollNo;
        
        if (requestedRollNo) {
          // Check if requested roll number is available
          const rollExists = await Student.findOne({ rollNo: requestedRollNo });
          if (rollExists) {
            // If requested roll is taken, find next available
            finalRollNo = await getNextAvailableRollNumber();
            results.errors.push({ 
              email, 
              reason: `Requested roll ${requestedRollNo} already taken. Assigned ${finalRollNo} instead.` 
            });
          } else {
            finalRollNo = requestedRollNo;
          }
        } else {
          // Get next available roll number
          finalRollNo = await getNextAvailableRollNumber();
        }

        /* ===== CREATE STUDENT ===== */
        await Student.create({
          user: user._id,
          batch: batchId,
          phone,
          address,
          dob,
          rollNo: finalRollNo
        });

        results.added.push({ 
          name, 
          email, 
          rollNo: finalRollNo,
          batch: batchName,
          course: courseName
        });

        if (plainPassword) {
          credentials.push({
            name,
            email,
            password: plainPassword,
            rollNo: finalRollNo,
            batch: batchName,
            course: courseName
          });
        }

        /* ===== SEND EMAIL (ONLY FOR NEW USER) ===== */
        if (plainPassword) {
          try {
            // Format dates nicely
            const formattedDOB = dob ? new Date(dob).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }) : 'Not provided';

            const formattedStartDate = startDate ? new Date(startDate).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }) : 'To be announced';

            const emailHtml = `
              <!DOCTYPE html>
              <html>
              <head>
                <style>
                  body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    margin: 0;
                    padding: 0;
                  }
                  .container {
                    max-width: 600px;
                    margin: 20px auto;
                    background: #ffffff;
                    border-radius: 15px;
                    overflow: hidden;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                  }
                  .header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 40px 30px;
                    text-align: center;
                  }
                  .header h1 {
                    margin: 0;
                    font-size: 28px;
                    font-weight: 600;
                  }
                  .header p {
                    margin: 10px 0 0;
                    opacity: 0.9;
                    font-size: 16px;
                  }
                  .content {
                    padding: 40px 30px;
                    background: #f8fafc;
                  }
                  .welcome-message {
                    background: white;
                    padding: 25px;
                    border-radius: 12px;
                    margin-bottom: 25px;
                    border-left: 4px solid #667eea;
                  }
                  .welcome-message h2 {
                    margin: 0 0 10px;
                    color: #2d3748;
                    font-size: 22px;
                  }
                  .credentials-box {
                    background: white;
                    padding: 25px;
                    border-radius: 12px;
                    margin-bottom: 25px;
                    border: 1px solid #e2e8f0;
                  }
                  .credentials-box h3 {
                    margin: 0 0 20px;
                    color: #667eea;
                    font-size: 18px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                  }
                  .credential-item {
                    display: flex;
                    align-items: center;
                    padding: 12px 0;
                    border-bottom: 1px solid #edf2f7;
                  }
                  .credential-item:last-child {
                    border-bottom: none;
                  }
                  .credential-label {
                    width: 120px;
                    font-weight: 600;
                    color: #4a5568;
                  }
                  .credential-value {
                    flex: 1;
                    color: #2d3748;
                    font-family: monospace;
                    background: #f7fafc;
                    padding: 6px 12px;
                    border-radius: 6px;
                  }
                  .enrollment-info {
                    background: linear-gradient(135deg, #f6f9fc 0%, #edf2f7 100%);
                    padding: 25px;
                    border-radius: 12px;
                    margin-bottom: 25px;
                  }
                  .enrollment-info h3 {
                    margin: 0 0 15px;
                    color: #2d3748;
                    font-size: 18px;
                  }
                  .info-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 15px;
                  }
                  .info-item {
                    background: white;
                    padding: 15px;
                    border-radius: 8px;
                  }
                  .info-label {
                    font-size: 12px;
                    color: #718096;
                    margin-bottom: 5px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                  }
                  .info-value {
                    font-size: 16px;
                    font-weight: 600;
                    color: #2d3748;
                  }
                  .cta-button {
                    display: inline-block;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    text-decoration: none;
                    padding: 14px 32px;
                    border-radius: 8px;
                    font-weight: 600;
                    margin: 20px 0;
                    transition: transform 0.2s;
                  }
                  .cta-button:hover {
                    transform: translateY(-2px);
                  }
                  .security-note {
                    background: #fef3c7;
                    padding: 20px;
                    border-radius: 8px;
                    margin: 25px 0;
                    border-left: 4px solid #fbbf24;
                  }
                  .security-note p {
                    margin: 0;
                    color: #92400e;
                  }
                  .footer {
                    background: #2d3748;
                    color: #a0aec0;
                    padding: 30px;
                    text-align: center;
                    font-size: 14px;
                  }
                  .footer strong {
                    color: white;
                  }
                  @media (max-width: 600px) {
                    .info-grid {
                      grid-template-columns: 1fr;
                    }
                    .credential-item {
                      flex-direction: column;
                      align-items: flex-start;
                      gap: 5px;
                    }
                    .credential-label {
                      width: auto;
                    }
                  }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1>🎓 Welcome to Cybernaut LMS!</h1>
                    <p>Your journey to excellence begins here</p>
                  </div>
                  
                  <div class="content">
                    <div class="welcome-message">
                      <h2>Hello ${name},</h2>
                      <p>We're thrilled to have you on board! Your student account has been successfully created and you're now officially enrolled in your course.</p>
                    </div>
                    
                    <div class="credentials-box">
                      <h3>🔐 Your Login Credentials</h3>
                      <div class="credential-item">
                        <span class="credential-label">Email:</span>
                        <span class="credential-value">${email}</span>
                      </div>
                      <div class="credential-item">
                        <span class="credential-label">Password:</span>
                        <span class="credential-value"><strong>${plainPassword}</strong></span>
                      </div>
                      <div class="credential-item">
                        <span class="credential-label">Roll Number:</span>
                        <span class="credential-value"><strong>${finalRollNo}</strong></span>
                      </div>
                    </div>
                    
                    <div class="enrollment-info">
                      <h3>📚 Enrollment Details</h3>
                      <div class="info-grid">
                        <div class="info-item">
                          <div class="info-label">Course</div>
                          <div class="info-value">${courseName}</div>
                        </div>
                        <div class="info-item">
                          <div class="info-label">Batch</div>
                          <div class="info-value">${batchName}</div>
                        </div>
                        <div class="info-item">
                          <div class="info-label">Start Date</div>
                          <div class="info-value">${formattedStartDate}</div>
                        </div>
                        <div class="info-item">
                          <div class="info-label">Date of Birth</div>
                          <div class="info-value">${formattedDOB}</div>
                        </div>
                        <div class="info-item">
                          <div class="info-label">Phone</div>
                          <div class="info-value">${phone}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div style="text-align: center;">
                      <a href="http://your-lms-domain.com/login" class="cta-button">
                        🚀 Access Your Dashboard
                      </a>
                    </div>
                    
                    <div class="security-note">
                      <p>
                        <strong>⚠️ Important Security Note:</strong> For your safety, please change your password immediately after your first login. Never share your credentials with anyone.
                      </p>
                    </div>
                    
                    <div style="margin-top: 25px; padding: 20px; background: white; border-radius: 8px;">
                      <h3 style="color: #2d3748; margin: 0 0 10px;">📅 What's Next?</h3>
                      <ul style="margin: 0; padding-left: 20px; color: #4a5568;">
                        <li>Log in to your dashboard to access course materials</li>
                        <li>Introduce yourself in the batch discussion forum</li>
                        <li>Review the course syllabus and schedule</li>
                        <li>Connect with your batch mates and instructors</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div class="footer">
                    <p>Best regards,</p>
                    <p><strong>The Cybernaut Team</strong></p>
                    <p style="margin-top: 20px; font-size: 12px;">
                      This is an automated message, please do not reply to this email.<br>
                      © ${new Date().getFullYear()} Cybernaut LMS. All rights reserved.
                    </p>
                  </div>
                </div>
              </body>
              </html>
            `;

            await transporter.sendMail({
              from: `"Cybernaut LMS" <${process.env.EMAIL_USER}>`,
              to: email,
              subject: `🎓 Welcome to ${courseName} - Batch: ${batchName} 🚀`,
              html: emailHtml
            });
            
            console.log(`Welcome email sent to ${email} for ${courseName} - ${batchName}`);
          } catch (mailErr) {
            console.log("Email failed:", mailErr.message);
            results.errors.push({ 
              email, 
              reason: `Email sending failed: ${mailErr.message}` 
            });
          }
        }
      } catch (studentErr) {
        console.error("Error processing student:", studentErr);
        results.errors.push({ 
          email: stu.email || 'unknown', 
          reason: studentErr.message 
        });
      }
    }

    res.json({
      message: "Students processed",
      results,
      credentials
    });

  } catch (err) {
    console.error("Error saving students:", err);
    res.status(500).json({
      error: "Error saving students",
      details: err.message
    });
  }
});

/* ================= UPDATE STUDENT ================= */
router.put('/:id', verifyAccessToken, async (req, res) => {
  try {
    const { name, email, phone, dob, batch, address, rollNo } = req.body;
    const studentId = req.params.id;

    // Find the student
    const student = await Student.findById(studentId).populate('user');
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    // If roll number is being changed, check if it's available
    if (rollNo && rollNo !== student.rollNo) {
      const existingRoll = await Student.findOne({ 
        rollNo, 
        _id: { $ne: studentId } 
      });
      
      if (existingRoll) {
        return res.status(400).json({ 
          error: `Roll number ${rollNo} is already taken by another student` 
        });
      }
    }

    // Update user info if provided
    if (name || email) {
      const userUpdate = {};
      if (name) userUpdate.name = name;
      if (email) userUpdate.email = email;
      
      await User.findByIdAndUpdate(student.user._id, userUpdate);
    }

    // Update student info
    const updateData = {};
    if (phone) updateData.phone = phone;
    if (dob) updateData.dob = dob;
    if (address) updateData.address = address;
    if (batch) updateData.batch = batch;
    if (rollNo) updateData.rollNo = rollNo;

    const updatedStudent = await Student.findByIdAndUpdate(
      studentId,
      updateData,
      { new: true }
    ).populate('user', 'name email')
     .populate({
       path: 'batch',
       populate: { path: 'course', select: 'courseName' },
       select: 'batchName course'
     });

    // Handle potential null batch
    const batchInfo = updatedStudent.batch || {};
    const courseInfo = batchInfo.course || {};

    res.json({
      message: "Student updated successfully",
      student: {
        _id: updatedStudent._id,
        user: updatedStudent.user,
        phone: updatedStudent.phone,
        dob: updatedStudent.dob,
        batch: batchInfo.batchName || '',
        course: courseInfo.courseName || '',
        rollNo: updatedStudent.rollNo,
        address: updatedStudent.address
      }
    });

  } catch (err) {
    console.error("Error updating student:", err);
    res.status(500).json({ error: "Error updating student" });
  }
});

/* ================= DELETE STUDENT ================= */
router.delete('/:id', verifyAccessToken, async (req, res) => {
  try {
    const studentId = req.params.id;
    
    // Find the student
    const student = await Student.findById(studentId).populate('user');
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    // Delete the student record
    await Student.findByIdAndDelete(studentId);
    
    // Optionally delete the user if no other student records exist
    const otherStudents = await Student.find({ user: student.user._id });
    if (otherStudents.length === 0) {
      await User.findByIdAndDelete(student.user._id);
    }

    res.json({ 
      message: "Student deleted successfully",
      deletedRollNo: student.rollNo 
    });

  } catch (err) {
    console.error("Error deleting student:", err);
    res.status(500).json({ error: "Error deleting student" });
  }
});

/* ================= DOWNLOAD CSV ================= */

router.post('/download-credentials', verifyAccessToken, (req, res) => {
  try {
    const parser = new Parser({
      fields: ['name', 'email', 'password', 'rollNo', 'course', 'batch']
    });
    const csv = parser.parse(req.body);
    res.header('Content-Type', 'text/csv');
    res.attachment('credentials.csv');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: 'Error generating CSV' });
  }
});

/* ================= GET ALL STUDENTS ================= */

router.get('/', verifyAccessToken, async (req, res) => {
  try {
    const students = await Student.find()
      .populate({
        path: 'user',
        select: 'name email'
      })
      .populate({
        path: 'batch',
        populate: { path: 'course', select: 'courseName' },
        select: 'batchName course'
      });

    // Sort by roll number globally
    students.sort((a, b) => (a.rollNo || 0) - (b.rollNo || 0));

    const formattedStudents = students.map(student => ({
      _id: student._id,
      user: student.user,
      phone: student.phone,
      dob: student.dob,
      batch: student.batch?.batchName || '',
      course: student.batch?.course?.courseName || '',
      rollNo: student.rollNo,
      address: student.address
    }));

    res.json(formattedStudents);

  } catch (err) {
    console.error('Failed to fetch students:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});

/* ================= STUDENTS BY BATCH ================= */

router.get('/batch/:batch', verifyAccessToken, async (req, res) => {
  try {
    const students = await Student.find({
      batch: req.params.batch
    }).populate('user').sort({ rollNo: 1 });
    
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: 'Server Error' });
  }
});

/* ================= CHECK ROLL NUMBER AVAILABILITY ================= */
router.get('/check-roll/:rollNo', verifyAccessToken, async (req, res) => {
  try {
    const rollNo = parseInt(req.params.rollNo);
    const existing = await Student.findOne({ rollNo });
    res.json({ 
      available: !existing,
      rollNo 
    });
  } catch (err) {
    res.status(500).json({ error: 'Error checking roll number' });
  }
});

module.exports = router;