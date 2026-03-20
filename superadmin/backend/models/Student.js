const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },

  batch: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Batch", 
    required: true 
  },

  phone: { 
    type: String, 
    required: true 
  },

  address: { 
    type: String, 
    default: "N/A"
  },

  dob: { 
    type: Date, 
    required: true 
  },

  certificate: { 
    type: Boolean, 
    default: false 
  },

  rollNo: { 
    type: Number, 
    required: true,
    unique: true   // ⭐ prevents duplicate roll numbers
  }

}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);