const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  module: {
    type: String,
    required: true
  },
  day: {
    type: Number,
    required: true
  },
  marksObtained: {
    type: [Number],
    default: [-2, -2, -2],
    validate: {
      validator: function (v) {
        return v.length === 3;
      },
      message: "marksObtained must be an array of 3 numbers"
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Report", reportSchema);
