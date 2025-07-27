const mongoose = require("mongoose");

const batchSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  batchName: { type: String, required: true },
  startDate: { type: Date, required: true },
  admins: [{
    module: { type: String, required: true },
    admin: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    ifCompleted: { type: Boolean, default: false }  // <-- added field
  }]
}, { timestamps: true });

module.exports = mongoose.model("Batch", batchSchema);
