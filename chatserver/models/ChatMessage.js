const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  chatroom: { type: String, required: true }, // same as current `room` value
  message: { type: String, required: true },
  role: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ChatMessage', chatMessageSchema);