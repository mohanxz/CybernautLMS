require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const Course = require('./models/Course');
const noteRoutes = require('./routes/notes');
const studentRoutes = require('./routes/student');
const settingsRoutes = require('./routes/settings');
const progressRoutes = require('./routes/progress');
const reportRoutes = require('./routes/reports'); // ✅ Added
const quizRoutes = require('./routes/quizroute');
const quizreportRoutes = require('./routes/quizreportroute');
const codingQuestionRoutes = require('./routes/codingQuestion');
const codingRoutes = require('./routes/codingRoutes');
const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000'
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

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Student DB Connected'))
  .catch(console.error);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/notes', noteRoutes);
app.use('/student', studentRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/reports', reportRoutes); // ✅ Added
app.use('/api/quiz',quizRoutes);
app.use('/api/quizreports', quizreportRoutes);
app.use('/api/coding-question', codingQuestionRoutes);
app.use("/api/coding", codingRoutes);

app.listen(5003, () => console.log('Student server on 5003'));