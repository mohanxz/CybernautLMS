const mongoose = require('mongoose');

const testCaseSchema = new mongoose.Schema({
  input: {
    type: [String],
    required: true,
  },
  expectedOutput: {
    type: String,
    required: true,
  },
  hidden: {
    type: Boolean,
    default: false,
  }
}, { _id: false });

const codingQuestionSchema = new mongoose.Schema({
    noteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Note', required: true },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  language: {
    type: String,
    enum: ['C++', 'Java', 'Python', 'JavaScript'],
    default: 'Python'
  },
  testCases: [testCaseSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('CodingQuestion', codingQuestionSchema);