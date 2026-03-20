const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },

    batch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
      required: true,
    },

    module: {
      type: String,
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    month: {
      type: Number,
      required: true,
    },

    year: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "paid"],
      default: "pending",
    },

    paymentMethod: {
      type: String,
      enum: ["upi", "bank", "cash"],
      default: "upi",
    },

    transactionId: String,

    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    paidAt: Date,
  },
  {
    timestamps: true,
  },
);

paymentSchema.index(
  { admin: 1, batch: 1, module: 1, month: 1, year: 1 },
  { unique: true },
);

module.exports = mongoose.model("Payment", paymentSchema);
