const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const User = require('../models/User');
const Batch = require('../models/Batch');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const verifyAccessToken = require('../middleware/auth');

const transporter = nodemailer.createTransport({
  service: "gmail", // or use "hotmail", or configure custom SMTP
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});
// Utility to generate random password
const generateRandomPassword = () => {
  return crypto.randomBytes(6).toString('hex'); // 12-char hex string
};

// GET all admins with user data and batch count
router.get('/', verifyAccessToken, async (req, res) => {
  try {
    const admins = await Admin.find().populate('user', 'name email phone');

    const enriched = await Promise.all(admins.map(async (admin) => {
      const batchCount = await Batch.countDocuments({ "admins.admin": admin.user._id });

      return {
        _id: admin._id,
        dob: admin.dob,
        phone : admin.phone,
        salary: admin.salary,
        specialisation: admin.specialisation,
        upi: admin.upi,
        paidForMonth: admin.paidForMonth,
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt,
        user: admin.user,
        batchCount
      };
    }));

    res.json(enriched);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST add new admin and create user
router.post('/', verifyAccessToken, async (req, res) => {
  try {
    const { name, email, phone, salary, specialisation, upi, dob } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    console.log(existingUser);
    if (existingUser) return res.status(400).json({ error: "Email already registered." });

    // Generate random password & hash
    const rawPassword = generateRandomPassword();
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: 'admin',
    });
    const savedUser = await user.save();

    // Create admin
    const newAdmin = new Admin({
      user: savedUser._id,
      dob,
      phone,
      salary,
      specialisation,
      upi,
      paidForMonth: 0
    });
    const savedAdmin = await newAdmin.save();

    await transporter.sendMail({
        from: `"Cybernaut Admin" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Welcome to Cybernaut LMS - Your Account Credentials",
        html: `
          <h3>Hello Admin ${name},</h3>
          <p>Your account has been created on <strong>Cybernaut LMS</strong>.</p>
          <p><strong>Username:</strong> ${email}</p>
          <p><strong>Password:</strong> ${rawPassword}</p>
          <p>You can log in at <a href="http://your-lms-domain.com/login">Cybernaut LMS</a></p>
          <p>Cheers to a wonderful teaching career</p>
          <br/>
          <p>Regards,<br/>Cybernaut Team</p>
        `,
      });

    res.status(201).json({
      admin: savedAdmin,
      user: {
        _id: savedUser._id,
        email: savedUser.email,
        name: savedUser.name,
        phone: savedUser.phone,
      },
      generatedPassword: rawPassword,
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

// GET single admin by ID
router.get('/:id', verifyAccessToken, async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id).populate('user', 'name email phone');
    if (!admin) return res.status(404).json({ error: 'Admin not found' });

    const batchCount = await Batch.countDocuments({ "admins.admin": admin.user._id });

    res.json({
      ...admin.toObject(),
      user: admin.user,
      batchCount
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT update admin by ID
router.put('/:id', verifyAccessToken, async (req, res) => {
  try {
    const updatedAdmin = await Admin.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('user', 'name email phone');

    if (!updatedAdmin) return res.status(404).json({ error: 'Admin not found' });

    res.json(updatedAdmin);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE admin and user by admin ID
router.delete('/:id', verifyAccessToken, async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id);
    if (!admin) return res.status(404).json({ error: 'Admin not found' });

    // Remove the linked user as well
    await User.findByIdAndDelete(admin.user);
    await Admin.findByIdAndDelete(req.params.id);

    res.json({ message: 'Admin and associated user deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
