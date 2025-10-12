// Mongoose model cho phản hồi
const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  content: String,
  type: { type: String, enum: ['activity', 'system', 'other'], default: 'activity' },
  target: { type: mongoose.Schema.Types.ObjectId, refPath: 'targetModel' },
  targetModel: { type: String, enum: ['Activity', 'User', 'System'], default: 'Activity' },
  resolved: { type: Boolean, default: false },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolvedAt: Date,
  note: String,
  // ...other fields...
}, { timestamps: true });

module.exports = mongoose.model('Feedback', feedbackSchema);
