const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    meetlink: String,
    assignmentlink: String,
    assignmentS3Url: { type: String, default: "" },
    batch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
      required: true,
    },
    module: { type: String, required: true },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    day: { type: Number, required: true },
  },
  { timestamps: true },
);

//  Enforce unique day per batch
noteSchema.index({ batch: 1, day: 1 }, { unique: true });

module.exports = mongoose.model("Note", noteSchema);
