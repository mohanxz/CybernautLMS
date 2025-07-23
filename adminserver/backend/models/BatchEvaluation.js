const mongoose = require("mongoose");

const studentMarkSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  projectMarks: { type: Number, default: -1 },
  theoryMarks: { type: Number, default: -1 }
});

const batchEvaluationSchema = new mongoose.Schema({
  batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true, unique: true },
  projectS3Url: { type: String, default: "" },
  theoryS3Url: { type: String, default: "" },
  studentMarks: [studentMarkSchema]
}, { timestamps: true });

module.exports = mongoose.model("BatchEvaluation", batchEvaluationSchema);
