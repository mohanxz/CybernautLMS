const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  dob: Date,
  phone: String,
  salary: Number,
  specialisation: [String],
  upi: String,
  paidForMonth: { type: Number, default: -1 }, // -1 means never paid, otherwise month index (0-11)
  department: String,
  lastOrderId: { type: String },
  lastPaymentId: { type: String },
  invoiceId: { type: String },
  courseStatus: { 
    type: String, 
    enum: ['pending', 'in-progress', 'completed'], 
    default: 'pending' 
  },
  courseCompletionDate: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Admin', adminSchema);