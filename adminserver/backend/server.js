require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const noteRoutes = require('./routes/notes');
const adminBatch = require("./routes/adminBatch");
const reportRoutes = require("./routes/reportRoutes");
const adminEvaluation = require("./routes/adminEvaluation");
const assignmentRoutes = require('./routes/assignmentRoutes');
const uploadRoutes = require('./routes/upload'); // adjust path
const adminDashboard = require('./routes/adminDasboard');
const studentRoutes = require('./routes/studentRoutes.js');
const statisticsRoutes = require("./routes/statisticsRoutes");
const settingsRoutes = require('./routes/settingsRoute.js');
const quizRoutes = require('./routes/quiz');
const codingQuestionRoutes = require('./routes/codingQuestion');
const codeEvalRoutes = require('./routes/codeEval');
const batchEvaluationRoutes = require('./routes/batchEvaluation.js');
const s3Urls = require('./routes/s3Urls'); // ✅ Import correct file

const app = express();
const allowedOrigins = [
  'http://localhost:5173'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Admin DB Connected'))
  .catch(console.error);

// Static route to access uploaded files

app.use(uploadRoutes);
app.use('/notes', noteRoutes);
app.use("/api/admin-batches", adminBatch);
app.use("/api/reports", reportRoutes);
app.use("/api/evaluation", adminEvaluation);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/dashboard',adminDashboard);
app.use("/api/students", studentRoutes);
app.use('/api/settings',settingsRoutes);
app.use("/statistics", statisticsRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/coding-questions', codingQuestionRoutes);
app.use('/api/codeEval', codeEvalRoutes);
app.use('/api/batch-evaluation', batchEvaluationRoutes);

app.use('/api', s3Urls); // ✅ Mount at /api

app.listen(5002, () => console.log('Admin server on 5002'));
