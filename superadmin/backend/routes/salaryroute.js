const express = require('express');
const Razorpay = require('razorpay');
const Admin = require('../models/Admin');
require('dotenv').config();
const axios = require('axios');
const router = express.Router();
const verifyAccessToken = require('../middleware/auth');
const generateReceiptPDF = require('../utils/generateReceipt');
const sendReceiptEmail = require('../utils/sendEmail');
// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

router.get('/', verifyAccessToken, async (req, res) => {
  try {
    const admins = await Admin.find().populate('user', 'name'); // Get admin.user.name
    res.json(admins);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch admins' });
  }
});

// POST /api/salary/admins/:id/pay - create Razorpay order and mark as paid
router.post('/:id/pay', verifyAccessToken, async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id);
    if (!admin) return res.status(404).json({ error: 'Admin not found' });

    const currentMonth = new Date().getMonth();
    if (admin.paidForMonth === currentMonth) {
      return res.status(400).json({ error: 'Already paid for this month' });
    }

    const amountRs = admin.salary;
    const shortReceipt = `sal_${admin._id.toString().slice(-6)}_${Date.now().toString().slice(-6)}`;

    const order = await razorpay.orders.create({
      amount: amountRs * 100,
      currency: 'INR',
      receipt: shortReceipt,
    });

    // Save temporary orderId to admin for reference
    admin.lastOrderId = order.id;
    await admin.save();

    res.json({ orderId: order.id, amount: order.amount, adminName: admin.name });
  } catch (err) {
    console.error("ERROR in /:id/pay route:", err);
    res.status(500).json({ error: 'Payment initiation failed' });
  }
});

// OPTIONAL: POST /api/salary/admins/:id/verify - verify payment after frontend checkout

router.post('/:id/verify', verifyAccessToken, async (req, res) => {
  const { paymentId, orderId, signature } = req.body;

  try {
    const admin = await Admin.findById(req.params.id).populate('user');

    if (!admin || admin.lastOrderId !== orderId) {
      return res.status(400).json({ error: 'Invalid order reference' });
    }

    admin.paidForMonth = new Date().getMonth();
    admin.lastPaymentId = paymentId;
    await admin.save();

    // ✅ Generate PDF and send email
    const filePath = await generateReceiptPDF(admin.user.name, admin.salary * 100, admin._id.toString(), paymentId);
    await sendReceiptEmail(
      admin.user.email,
      'Cybernaut LMS Salary Receipt',
      `<p>Hi ${admin.user.name},<br>Your salary has been credited. Please find your receipt attached.</p>`,
      filePath
    );

    res.json({ message: 'Payment verified, receipt sent' });
  } catch (err) {
    console.error('Verification failed:', err);
    res.status(500).json({ error: 'Verification failed' });
  }
});


router.post("/:adminId/invoice", verifyAccessToken, async (req, res) => {
  const { adminName, email, amount } = req.body;

  try {
    const invoice = await razorpay.invoices.create({
      type: "invoice",
      description: `Salary payment for ${adminName}`,
      customer: {
        name: adminName,
        email: email,
      },
      line_items: [
        {
          name: "Monthly Salary",
          amount: amount, // in paise
          currency: "INR",
          quantity: 1,
        },
      ],
      notes: {
        payment_status: "Paid via Razorpay Order",
        issued_for: "Salary",
        issued_by: "LMS System",
      },
      currency: "INR",
    });

    await Admin.findByIdAndUpdate(req.params.adminId, {
      invoiceId: invoice.id,
    });

    res.json(invoice);
  } catch (err) {
    console.error("Invoice creation error:", err.response?.data || err);
    res.status(500).json({ error: err.response?.data || err.message });
  }
});

// GET /api/salary/invoice/:invoiceId
router.get("/invoice/:invoiceId", verifyAccessToken, async (req, res) => {
  try {
    const invoice = await razorpay.invoices.fetch(req.params.invoiceId);
    res.redirect(invoice.short_url);
  } catch (err) {
    console.error("Error fetching invoice:", err);
    res.status(500).json({ message: "Failed to fetch invoice" });
  }
});

router.get('/stats/payments', verifyAccessToken, async (req, res) => {
  try {
    const payments = await razorpay.payments.all({ count: 100 });
    const currmonth = new Date().getMonth();
    const admin = await Admin.find({paidForMonth:{$lt:currmonth}});
    const success = payments.items.filter(p => p.status === 'captured').length;
    const failed = payments.items.filter(p => p.status === 'failed').length;
    const pending =admin.length;
    const totalAmount = payments.items.reduce((sum, p) => sum + (p.status === 'captured' ? p.amount : 0), 0);

    res.json({
      totalRevenue: totalAmount / 100,
      successfulPayments: success,
      failedPayments: failed,
      pendingPayments: pending
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch payment stats' });
  }
});

router.get('/recent-transactions', verifyAccessToken, async (req, res) => {
  const count = parseInt(req.query.count) || 5;
  try {
    const transactions = await razorpay.payments.all({ count });
    res.json(transactions);
  } catch (err) {
    console.error("Error fetching transactions:", err);
    res.status(500).json({ error: "Failed to fetch recent transactions" });
  }
});


module.exports = router;
