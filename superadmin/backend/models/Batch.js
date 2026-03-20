const mongoose = require("mongoose");

const batchSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  batchName: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  status: {
    type: String,
    enum: ["upcoming", "active", "completed"],
    default: "upcoming"
  },
  admins: [{
    module: { type: String, required: true },
    admin: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    ifCompleted: { type: Boolean, default: false },
    completedAt: { type: Date }
  }],
  completionDetails: {
    completedAt: { type: Date },
    completedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    completionNote: { type: String }
  }
}, { timestamps: true });

// Index for faster queries
batchSchema.index({ status: 1 });
batchSchema.index({ "admins.ifCompleted": 1 });
batchSchema.index({ startDate: 1 });

// Virtual to check if all modules are completed
batchSchema.virtual("isFullyCompleted").get(function () {
  return this.admins.every(admin => admin.ifCompleted === true);
});

// Virtual to get completion percentage
batchSchema.virtual("completionPercentage").get(function () {
  if (this.admins.length === 0) return 0;
  const completed = this.admins.filter(a => a.ifCompleted).length;
  return Math.round((completed / this.admins.length) * 100);
});

// Method to check and update batch status
batchSchema.methods.updateStatus = async function () {
  const today = new Date();
  const startDate = new Date(this.startDate);
  
  // Update status based on start date
  if (startDate <= today && this.status === "upcoming") {
    this.status = "active";
  }
  
  // Check if all modules are completed
  const allModulesCompleted = this.admins.every(admin => admin.ifCompleted === true);
  
  if (allModulesCompleted && this.status !== "completed") {
    this.status = "completed";
    this.endDate = new Date();
  }
  
  return this.save();
};

// Pre-save middleware to auto-update status
batchSchema.pre('save', async function(next) {
  const today = new Date();
  const startDate = new Date(this.startDate);
  
  // Update status based on start date
  if (startDate <= today && this.status === "upcoming") {
    this.status = "active";
  }
  
  // Check if all modules are completed
  const allModulesCompleted = this.admins.every(admin => admin.ifCompleted === true);
  
  if (allModulesCompleted && this.status !== "completed") {
    this.status = "completed";
    this.endDate = new Date();
  }
  
  next();
});

module.exports = mongoose.model("Batch", batchSchema);