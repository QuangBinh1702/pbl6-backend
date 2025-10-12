// Mongoose model cho chat nhóm
const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  activity: { type: mongoose.Schema.Types.ObjectId, ref: 'Activity' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  message: String,
  type: { type: String, enum: ['text', 'file'], default: 'text' },
  fileUrl: String,
  // ...other fields...
}, { timestamps: true });

module.exports = mongoose.model('Chat', chatSchema);
