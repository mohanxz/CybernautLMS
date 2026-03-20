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
  service: "gmail",
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

const enriched = await Promise.all(
  admins
    .filter(admin => admin.user) // prevent null crash
    .map(async (admin) => {

      const batchCount = await Batch.countDocuments({
        "admins.admin": admin.user._id
      });

      return {
        _id: admin._id,
        dob: admin.dob,
        phone: admin.phone,
        salary: admin.salary,
        specialisation: admin.specialisation,
        upi: admin.upi,
        department: admin.department,
        paidForMonth: admin.paidForMonth,
        courseStatus: admin.courseStatus,
        courseCompletionDate: admin.courseCompletionDate,
        lastOrderId: admin.lastOrderId,
        lastPaymentId: admin.lastPaymentId,
        invoiceId: admin.invoiceId,
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt,
        user: admin.user,
        batchCount,
        name: admin.user.name,
        email: admin.user.email
      };
    })
);

    res.json(enriched);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST add new admin and create user
router.post('/', verifyAccessToken, async (req, res) => {
  try {
    const { name, email, phone, salary, specialisation, upi, dob, department } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !salary || !specialisation || !upi || !dob) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
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

    // Create admin with salary tracking
    const newAdmin = new Admin({
      user: savedUser._id,
      dob: new Date(dob),
      phone,
      salary: Number(salary),
      specialisation: Array.isArray(specialisation) ? specialisation : [specialisation],
      upi,
      department: department || 'General',
      paidForMonth: -1, // Initialize as never paid
      courseStatus: 'pending',
      lastOrderId: null,
      lastPaymentId: null,
      invoiceId: null
    });

    const savedAdmin = await newAdmin.save();

    // Populate user data for response
    const populatedAdmin = await Admin.findById(savedAdmin._id).populate('user', 'name email phone');

    // Send email with credentials
    await transporter.sendMail({
      from: `"Cybernaut Admin" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Welcome to Cybernaut LMS - Your Account Credentials",
      html: `
        <h3>Hello ${name},</h3>
        <p>Your account has been created on <strong>Cybernaut LMS</strong>.</p>
        
        <h4>Login Credentials:</h4>
        <ul>
          <li><strong>Username:</strong> ${email}</li>
          <li><strong>Password:</strong> ${rawPassword}</li>
        </ul>
        
        <h4>Profile Details:</h4>
        <ul>
          <li><strong>Department:</strong> ${department || 'General'}</li>
          <li><strong>Specialisation:</strong> ${Array.isArray(specialisation) ? specialisation.join(', ') : specialisation}</li>
          <li><strong>Phone:</strong> ${phone}</li>
          <li><strong>Date of Birth:</strong> ${new Date(dob).toLocaleDateString()}</li>
        </ul>
        
        <h4>Salary Details:</h4>
        <ul>
          <li><strong>Monthly Salary:</strong> ₹${salary}</li>
          <li><strong>UPI ID:</strong> ${upi}</li>
          <li><strong>Payment Status:</strong> Pending first payment</li>
          <li><strong>Course Status:</strong> Pending</li>
        </ul>
        
        <p>You can log in at <a href="http://your-lms-domain.com/login">Cybernaut LMS</a></p>
        <p>Cheers to a wonderful teaching career!</p>
        <br/>
        <p>Regards,<br/>Cybernaut Team</p>
      `,
    });

    res.status(201).json({
      success: true,
      message: 'Admin created successfully',
      generatedPassword: rawPassword, // Send password to frontend
      admin: {
        _id: populatedAdmin._id,
        name: populatedAdmin.user.name,
        email: populatedAdmin.user.email,
        phone: populatedAdmin.phone,
        salary: populatedAdmin.salary,
        specialisation: populatedAdmin.specialisation,
        upi: populatedAdmin.upi,
        department: populatedAdmin.department,
        dob: populatedAdmin.dob,
        paidForMonth: populatedAdmin.paidForMonth,
        courseStatus: populatedAdmin.courseStatus,
        user: populatedAdmin.user
      }
    });

  } catch (err) {
    console.error('Error creating admin:', err);
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
      _id: admin._id,
      dob: admin.dob,
      phone: admin.phone,
      salary: admin.salary,
      specialisation: admin.specialisation,
      upi: admin.upi,
      department: admin.department,
      paidForMonth: admin.paidForMonth,
      courseStatus: admin.courseStatus,
      courseCompletionDate: admin.courseCompletionDate,
      lastOrderId: admin.lastOrderId,
      lastPaymentId: admin.lastPaymentId,
      invoiceId: admin.invoiceId,
      user: admin.user,
      batchCount,
      name: admin.user.name,
      email: admin.user.email
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