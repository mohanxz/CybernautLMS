const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: {
    A: { type: String, required: true },
    B: { type: String, required: true },
    C: { type: String, required: true },
    D: { type: String, required: true },
  },
  answer: { type: String, enum: ['A', 'B', 'C', 'D'], required: true }
});

const studentMarkSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  projectMarks: { type: Number, default: -1 },
  theoryMarks: { type: Number, default: -1 }
});

const batchEvaluationSchema = new mongoose.Schema({
  batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true },
  module: { type: String, required: true },
  projectS3Url: { type: String, default: "" },
  studentMarks: [studentMarkSchema],
  questions: [questionSchema]
}, { timestamps: true });


module.exports = mongoose.model("BatchEvaluation", batchEvaluationSchema);
