require("dotenv").config();
const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();

const PORT = process.env.PORT || 5006;
const LOG_DIR = path.join(__dirname, "chat_logs");
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : ["http://localhost:5173"];

// CORS for Express
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

const server = http.createServer(app);

// CORS for Socket.IO
const io = socketIO(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS (socket.io)"));
      }
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
});

if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR);

const ChatMessage = require("./models/ChatMessage");

io.on("connection", (socket) => {
  socket.on("joinRoom", async ({ name, room }) => {
    socket.join(room);
    try {
      const messages = await ChatMessage.find({ chatroom: room }).sort({
        timestamp: 1,
      });
      const formatted = messages.map((m) => `${m.name}: ${m.message}`);
      socket.emit("chatHistory", formatted);
    } catch (err) {
      console.error("Error fetching chat history:", err);
      socket.emit("chatHistory", []);
    }
  });

  socket.on("message", async ({ name, room, message }) => {
    try {
      const chatMsg = new ChatMessage({
        name,
        chatroom: room,
        message,
        role: "student",
      });
      await chatMsg.save();
      io.to(room).emit("message", `${name}: ${message}`);
    } catch (err) {
      console.error("Error saving message:", err);
    }
  });

  socket.on("leaveRoom", ({ room }) => {
    socket.leave(room);
  });
});

const decodeBatch = (name) => decodeURIComponent(name);

// --- All API routes below ---
app.get("/chatrooms/:course/:batch/:module/students", (req, res) => {
  const { course, batch, module } = req.params;
  const dirPath = path.join(LOG_DIR, course, batch, module, "students");
  if (!fs.existsSync(dirPath)) return res.json([]);
  const students = fs
    .readdirSync(dirPath)
    .filter((file) => file.endsWith(".txt"))
    .map((file) => file.replace(".txt", ""));
  res.json(students);
});

app.get("/chatrooms/:course/:batch/admins/:admin/students", (req, res) => {
  const { course, batch, admin } = req.params;
  const adminName = encodeURIComponent(admin.trim());
  const dirPath = path.join(
    LOG_DIR,
    course,
    batch,
    "admins",
    adminName,
    "students",
  );
  if (!fs.existsSync(dirPath)) return res.json([]);
  const students = fs
    .readdirSync(dirPath)
    .filter((file) => file.endsWith(".txt"))
    .map((file) => file.replace(".txt", ""));
  res.json(students);
});

app.get("/chatrooms/metadata/:batch", (req, res) => {
  const raw = req.params.batch;
  const batch = decodeBatch(raw);
  try {
    const courseDirs = fs.readdirSync(LOG_DIR);
    for (const course of courseDirs) {
      const coursePath = path.join(LOG_DIR, course);
      if (!fs.statSync(coursePath).isDirectory()) continue;
      const batchPath = path.join(coursePath, batch);
      if (fs.existsSync(batchPath) && fs.statSync(batchPath).isDirectory()) {
        const forumPath = path.join(batchPath, "forum");
        const modules = fs.existsSync(forumPath)
          ? fs
              .readdirSync(forumPath)
              .filter((mod) =>
                fs.statSync(path.join(forumPath, mod)).isDirectory(),
              )
          : [];
        return res.json({ course, modules });
      }
    }
    return res.status(404).json({ message: "Batch not found" });
  } catch (err) {
    console.error("Metadata fetch error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/chatrooms/admins", (req, res) => {
  const dirPath = path.join(LOG_DIR, "admins");
  if (!fs.existsSync(dirPath)) return res.json([]);
  const files = fs
    .readdirSync(dirPath)
    .filter((file) => file.endsWith(".txt"))
    .map((file) => file.replace(".txt", ""));
  res.json(files);
});

app.get("/chatrooms/:course", (req, res) => {
  const course = decodeURIComponent(req.params.course);
  const coursePath = path.join(LOG_DIR, course);
  if (!fs.existsSync(coursePath)) return res.status(404).json([]);
  const batches = fs
    .readdirSync(coursePath)
    .filter((entry) => fs.statSync(path.join(coursePath, entry)).isDirectory());
  res.json(batches);
});

app.get("/chatrooms", (req, res) => {
  if (!fs.existsSync(LOG_DIR)) return res.json([]);
  const batches = fs
    .readdirSync(LOG_DIR)
    .filter((entry) => fs.statSync(path.join(LOG_DIR, entry)).isDirectory());
  res.json(batches);
});

app.get("/students/:course/:batch/:admin", async (req, res) => {
  try {
    const { course, batch, admin } = req.params;
    const encodedAdmin = encodeURIComponent(admin.trim());
    const prefix = `${course}/${batch}/admins/${encodedAdmin}/students/`;
    const messages = await ChatMessage.find({
      chatroom: { $regex: `^${prefix}` },
    }).lean();
    const students = [
      ...new Set(
        messages.map((msg) =>
          decodeURIComponent(msg.chatroom.replace(prefix, "").split("/")[0]),
        ),
      ),
    ];
    res.json(students);
  } catch (err) {
    console.error("Error fetching student list:", err);
    res.status(500).send("Server error");
  }
});

// MongoDB Connection + Admin Status Route
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log(" Connected to MongoDB");
    const User = require("./models/User");

    app.get("/chatrooms/admins/status", async (req, res) => {
      try {
        const admins = await User.find({ role: "admin" }, "name activeToken");
        const statuses = admins.map((admin) => ({
          name: admin.name,
          online: !!admin.activeToken,
        }));
        res.json(statuses);
      } catch (err) {
        console.error("Error fetching admin statuses:", err);
        res.status(500).json({ error: "Server error" });
      }
    });

    server.listen(PORT, () => {
      console.log(` Chat server listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
  });
