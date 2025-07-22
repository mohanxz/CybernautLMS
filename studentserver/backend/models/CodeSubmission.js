const mongoose = require("mongoose");

const codeSubmissionSchema = new mongoose.Schema({
  noteId: { type: mongoose.Schema.Types.ObjectId, ref: "Note", required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  code: { type: String, required: true },
  language: { type: Number, required: true }, // Store language ID from dropdown
  submittedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("CodeSubmission", codeSubmissionSchema);
