const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const verifyAccessToken = require("../middleware/auth");
const Student = require("../models/Student");
const Admin = require("../models/Admin");

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

/* ================= TOKEN GENERATORS ================= */

const generateAccessToken = (user) =>
  jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "90d" } // 3 months
  );

const generateRefreshToken = (user) =>
  jwt.sign(
    { id: user._id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "90d" } // 3 months
  );

/* ================= LOGIN ================= */

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.activeToken = accessToken;
    await user.save();

    res.json({
      accessToken,
      refreshToken,
      role: user.role,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Server error during login" });
  }
});

/* ================= REFRESH TOKEN ================= */

router.post("/refresh-token", async (req, res) => {

  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ error: "Refresh token required" });
  }

  try {

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const newAccessToken = generateAccessToken(user);

    user.activeToken = newAccessToken;
    await user.save();

    res.json({ accessToken: newAccessToken });

  } catch (error) {
    console.error("Refresh token error:", error);
    res.status(401).json({ error: "Invalid refresh token" });
  }
});

/* ================= STUDENT PROFILE ================= */

router.get("/student/me", verifyAccessToken, async (req, res) => {

  try {

    const student = await Student.findOne({ user: req.user.id })
      .populate("user", "name email phone");

    if (!student) {
      return res.status(404).json({ error: "Student profile not found" });
    }

    res.json(student);

  } catch (error) {

    console.error("Error fetching student profile:", error);
    res.status(500).json({ error: "Server error" });

  }
});

/* ================= ADMIN PROFILE ================= */

router.get("/admin/me", verifyAccessToken, async (req, res) => {

  try {

    const admin = await Admin.findOne({ user: req.user.id })
      .populate("user", "name email phone");

    if (!admin) {
      return res.status(404).json({ error: "Admin profile not found" });
    }

    res.json(admin);

  } catch (error) {

    console.error("Error fetching admin profile:", error);
    res.status(500).json({ error: "Server error" });

  }
});

/* ================= SUPER ADMIN PROFILE ================= */

router.get("/superadmin/me", verifyAccessToken, async (req, res) => {

  try {

    if (req.user.role !== "superadmin") {
      return res.status(403).json({ error: "Access denied" });
    }

    const user = await User.findById(req.user.id).select("-password");

    if (!user || user.role !== "superadmin") {
      return res.status(404).json({ error: "Super Admin not found" });
    }

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });

  } catch (err) {

    console.error("Error fetching superadmin profile:", err);
    res.status(500).json({ error: "Server error" });

  }
});

/* ================= REGISTER ================= */

router.post("/register", async (req, res) => {

  const { name, email, password, role } = req.body;

  try {

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const existing = await User.findOne({ email });

    if (existing) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashed,
      role,
    });

    await newUser.save();

    res.json({
      message: "User registered successfully",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });

  } catch (err) {

    console.error("Registration error:", err);
    res.status(500).json({ error: "Server error during registration" });

  }
});

/* ================= LOGOUT ================= */

router.post("/logout", async (req, res) => {

  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(400).json({ error: "Authorization header missing" });
  }

  const token = authHeader.split(" ")[1];

  try {

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    await User.findByIdAndUpdate(decoded.id, { activeToken: null });

    res.json({ message: "Logged out successfully" });

  } catch (err) {

    console.error("Logout error:", err);
    return res.status(401).json({ error: "Invalid or expired token" });

  }
});

/* ================= VERIFY TOKEN ================= */

router.get("/verify", verifyAccessToken, (req, res) => {

  return res.status(200).json({
    message: "Token valid",
    user: req.user,
  });

});

/* ================= GET CURRENT USER ================= */

router.get("/me", verifyAccessToken, async (req, res) => {

  try {

    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });

  } catch (error) {

    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Server error" });

  }
});

module.exports = router;