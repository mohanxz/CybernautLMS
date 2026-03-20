const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require("dotenv");

dotenv.config();

const homeRoutes = require('./routes/homeroute.js');
const userRoutes = require('./routes/userroute.js');
const adminRoutes = require('./routes/adminroute.js');
const salaryRoutes = require('./routes/salaryroute.js');
const studentsRoutes = require('./routes/studentroute.js');
const testRoutes = require('./routes/testroute.js');
const courseRoutes = require('./routes/courseroute.js');
const batchRoutes = require('./routes/batchroute.js');
const uploadRoutes = require('./routes/uploadroute.js');
const systemRoutes = require("./routes/system.js");
const settingsRoutes = require("./routes/settingsroute.js");
const certificateRoutes = require("./routes/certificateroute.js");

const app = express();

/* ---------------------- */
/* CORS CONFIG */
/* ---------------------- */

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://cybernaut-lms-v2.onrender.com',
];

app.use(cors({
  origin: function (origin, callback) {

    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }

  },

  credentials: true,

  methods: [
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "OPTIONS"
  ],

  allowedHeaders: [
    "Content-Type",
    "Authorization"
  ]

}));

app.use(express.json());

/* ---------------------- */
/* DATABASE */
/* ---------------------- */

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB connected"))
.catch(err => console.error(err));


/* ---------------------- */
/* ROUTES */
/* ---------------------- */

app.use('/api/users', userRoutes);
app.use('/api/stats', homeRoutes);
app.use('/api/admins', adminRoutes);
app.use('/api/salary', salaryRoutes);
app.use('/api/students', studentsRoutes);
app.use("/api/tests", testRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api/upload', uploadRoutes);
app.use("/api/system", systemRoutes);
app.use('/api/settings', settingsRoutes);
app.use("/api/certificates", certificateRoutes);


/* ---------------------- */
/* SERVER */
/* ---------------------- */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});