const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require("bcryptjs");
const User = require('../models/User');
const verifyAccessToken = require('../middleware/auth');
const Student = require('../models/Student');
const Admin = require('../models/Admin');

const router = express.Router();
const nodemailer = require("nodemailer");
const otpStore = {};
const timeoutStore = {};

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

// Token Generators
const generateAccessToken = (user) =>
  jwt.sign({ id: user._id, email: user.email, role: user.role }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });

const generateRefreshToken = (user) =>
  jwt.sign({ id: user._id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });

// -----------------------------
// Login Route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user) return res.status(400).json({ error: 'User not found' });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  

  // ✅ Store accessToken for session verification
  user.activeToken = accessToken;
  await user.save();

  res.json({ accessToken, refreshToken, role: user.role });
});


// -----------------------------
// Get Student Profile
// -----------------------------
router.get('/student/me', verifyAccessToken, async (req, res) => {
  const student = await Student.findOne({ user: req.user.id }).populate('user');
  
  if (!student) return res.sendStatus(404);
  res.json(student);
});

// -----------------------------
// Get Admin Profile
// -----------------------------
router.get('/admin/me', verifyAccessToken, async (req, res) => {
  const admin = await Admin.findOne({ user: req.user.id }).populate('user');
  if (!admin) return res.sendStatus(404);
  res.json(admin);
});

// -----------------------------
// Get Super Admin Profile
// -----------------------------
router.get('/superadmin/me', verifyAccessToken, async (req, res) => {
  try {
    // Check if the logged-in user is the superadmin
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const user = await User.findById(req.user.id);

    if (!user || user.role !== 'superadmin') {
      return res.status(404).json({ error: 'Super Admin not found' });
    }

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});


router.post("/register", async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashed,
      role,
    });

    await newUser.save();
    res.json({ message: "User registered successfully" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/logout", async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    
    return res.status(400).json({ error: "Authorization header missing" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    
    // Clear the activeToken field
    await User.findByIdAndUpdate(decoded.id, { activeToken: null });
    
    res.json({ message: "Logged out successfully" });
  } catch (err) {
    
    return res.status(401).json({ error: "Invalid or expired token" });
  }
});

router.put('/change-password', verifyAccessToken, async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return res.status(400).json({ message: "All fields are required" });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match" });
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;

    await user.save();
    res.json({ message: "Password updated successfully" });

  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/verify", verifyAccessToken, (req, res) => {
  return res.status(200).json({ message: "Token valid" });
});

router.post("/send-reset-code", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "Email not found" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[email] = otp;

    if (timeoutStore[email]) clearTimeout(timeoutStore[email]);
    timeoutStore[email] = setTimeout(() => {
      delete otpStore[email];
      delete timeoutStore[email];
    }, 10 * 60 * 1000);

    
    await transporter.sendMail({
      to: email,
      subject: "Cybernaut LMS Password Reset",
      html: `<p>Hello <b>${user.name}</b>,</p>
             <p>Your OTP to reset your password is:</p>
             <h2>${otp}</h2>
             <p>This OTP is valid for 10 minutes. If not requested by you, please ignore this email.</p>`,
    });

    return res.json({ message: "OTP sent to your email" });
  } catch (error) {
    return res.status(500).json({ error: "Something went wrong" });
  }
});

router.post("/verify-reset-code", (req, res) => {
  const { email, code } = req.body;

  if (!otpStore[email]) {
    return res.status(400).json({ error: "OTP expired or not requested" });
  }

  if (otpStore[email] !== code) {
    return res.status(400).json({ error: "Invalid OTP" });
  }

  return res.json({ message: "OTP verified" });
});

// 🔒 3. Reset Password
router.post("/reset-password", async (req, res) => {
  const { email, password } = req.body;

  if (!otpStore[email]) {
    return res.status(403).json({ error: "OTP not verified or expired" });
  }

  try {
    const hashed = await bcrypt.hash(password, 10);
    await User.findOneAndUpdate({ email }, { password: hashed });

    // Cleanup OTP and timer
    delete otpStore[email];
    if (timeoutStore[email]) {
      clearTimeout(timeoutStore[email]);
      delete timeoutStore[email];
    }

    return res.json({ message: "Password successfully updated" });
  } catch (error) {
    return res.status(500).json({ error: "Failed to update password" });
  }
});


module.exports = router;
