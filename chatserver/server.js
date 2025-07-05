require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

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

const server = http.createServer(app);
const io = socketIO(server, {
  cors: { 
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

const PORT = 5006;
const LOG_DIR = path.join(__dirname, 'chat_logs');

if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR);

function getLogPath(room) {
  const parts = room.split('/');

  // Rule 1: Admin ↔ SuperAdmin
  if (parts.length === 2 && parts[0] === 'admins') {
    const adminName = parts[1];
    const dir = path.join(LOG_DIR, 'admins');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return path.join(dir, `${adminName}.txt`);
  }

  // Rule 2: Student ↔ Admin
  // Format: course / batch / admins / adminName / students / studentName
  if (
    parts.length === 6 &&
    parts[2] === 'admins' &&
    parts[4] === 'students'
  ) {
    const [course, batch, , adminName, , studentName] = parts;
    const dir = path.join(LOG_DIR, course, batch, 'admins', adminName, 'students');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return path.join(dir, `${studentName}.txt`);
  }

  // Rule 3: Forum Chat
if (parts.length === 4 && parts[2] === 'forum' && parts[3] === 'general') {
  const course = parts[0];
  const batch = parts[1];
  const dir = path.join(LOG_DIR, course, batch, 'forum');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, 'general.txt');
}


  console.warn(`⚠️ Invalid room format: ${room}`);
  return null;
}



function loadChat(room) {
  const file = getLogPath(room);
  if (!file) return [];
  return fs.existsSync(file)
    ? fs.readFileSync(file, 'utf8').split('\n').filter(Boolean)
    : [];
}

function saveChat(room, message) {
  const file = getLogPath(room);
  if (!file) return;
  fs.appendFileSync(file, message + '\n');
}

io.on('connection', socket => {
  socket.on('joinRoom', ({ name, room }) => {
    socket.join(room);
    socket.emit('chatHistory', loadChat(room));
  });

  socket.on('message', ({ name, room, message }) => {
    const msg = `${name}: ${message}`;
    saveChat(room, msg);
    io.to(room).emit('message', msg);
  });

  socket.on('leaveRoom', ({ room }) => {
    socket.leave(room);
  });
});

const decodeBatch = (name) => decodeURIComponent(name);

// ✅ API to fetch chat participants (students) for a given batch/module
app.get('/chatrooms/:course/:batch/:module/students', (req, res) => {
  const { course, batch, module } = req.params;
  const dirPath = path.join(LOG_DIR, course, batch, module, 'students');

  if (!fs.existsSync(dirPath)) return res.json([]);

  const students = fs.readdirSync(dirPath)
    .filter(file => file.endsWith('.txt'))
    .map(file => file.replace('.txt', ''));

  res.json(students);
});

// ✅ Get list of students under a specific admin in a batch
app.get('/chatrooms/:course/:batch/admins/:admin/students', (req, res) => {
  const { course, batch, admin } = req.params;
  const adminName = encodeURIComponent(admin.trim());
  const dirPath = path.join(LOG_DIR, course, batch, 'admins', adminName,'students');
  console.log(dirPath);
  if (!fs.existsSync(dirPath)) {
    console.log("Empty");
    return res.json([]);
  }

  const students = fs.readdirSync(dirPath)
    .filter(file => file.endsWith('.txt'))
    .map(file => file.replace('.txt', ''));
  console.log("Students : "+students);
  res.json(students);
});


app.get('/chatrooms/metadata/:batch', (req, res) => {
  const raw = req.params.batch;
  const batch = decodeBatch(raw); // Decode URL-encoded string like "Full%20Stack%20Development"
  
  try {
    const courseDirs = fs.readdirSync(path.join(LOG_DIR));
    for (const course of courseDirs) {
      
      const coursePath = path.join(LOG_DIR, course);
      if (!fs.statSync(coursePath).isDirectory()) continue;

      const batchPath = path.join(coursePath, batch);
      if (fs.existsSync(batchPath) && fs.statSync(batchPath).isDirectory()) {
        const forumPath = path.join(batchPath, 'forum');
        const modules = fs.existsSync(forumPath)
          ? fs.readdirSync(forumPath).filter(mod =>
              fs.statSync(path.join(forumPath, mod)).isDirectory()
            )
          : [];
        console.log({course,modules});
        return res.json({ course, modules });
      }
    }

    return res.status(404).json({ message: "Batch not found" });
  } catch (err) {
    console.error("Metadata fetch error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.get('/chatrooms/admins', (req, res) => {

  const dirPath = path.join(LOG_DIR, 'admins');

  if (!fs.existsSync(dirPath)) {
    return res.json([]);
  }

  const files = fs.readdirSync(dirPath)
    .filter(file => file.endsWith('.txt'))
    .map(file => file.replace('.txt', ''));
  res.json(files);
});

// ✅ Get batches inside a course
app.get('/chatrooms/:course', (req, res) => {
  const course = decodeURIComponent(req.params.course);
  const coursePath = path.join(LOG_DIR, course);
  
  if (!fs.existsSync(coursePath)) return res.status(404).json([]);

  const batches = fs.readdirSync(coursePath).filter(entry => {
    const fullPath = path.join(coursePath, entry);
    return fs.statSync(fullPath).isDirectory();
  });
  res.json(batches);
});


app.get('/chatrooms', (req, res) => {
  if (!fs.existsSync(LOG_DIR)) return res.json([]);

  const batches = fs.readdirSync(LOG_DIR).filter(entry => {
    const fullPath = path.join(LOG_DIR, entry);
    return fs.statSync(fullPath).isDirectory();
  });

  res.json(batches);
});


const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');

    // ✅ Import model AFTER connection is established
    const User = require('./models/User');

    // ✅ Register the route after DB is ready
    app.get('/chatrooms/admins/status', async (req, res) => {
      try {
        const admins = await User.find({ role: 'admin' }, 'name activeToken');
        const statuses = admins.map(admin => ({
          name: admin.name,
          online: !!admin.activeToken
        }));
        res.json(statuses);
      } catch (err) {
        console.error("Error fetching admin statuses:", err);
        res.status(500).json({ error: "Server error" });
      }
    });

    // ✅ Start server after DB is connected
    server.listen(PORT, () => {
      console.log(`✅ Chat server listening on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
  });
