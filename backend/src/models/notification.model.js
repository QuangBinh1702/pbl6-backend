// Mongoose model cho thông báo
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  content: String,
  type: { type: String, enum: ['reminder', 'system', 'activity', 'certificate'], default: 'system' },
  activity: { type: mongoose.Schema.Types.ObjectId, ref: 'Activity' },
  read: { type: Boolean, default: false },
  sentAt: Date,
  // ...other fields...
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
