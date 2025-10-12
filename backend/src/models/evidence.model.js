// Mongoose model cho minh chứng hoạt động ngoài trường
const mongoose = require('mongoose');

const evidenceSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  activityName: String,
  organization: String, // Đơn vị xác nhận
  description: String,
  fileUrl: String, // Link file minh chứng
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  confirmedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  confirmedAt: Date,
  note: String,
}, { timestamps: true });

module.exports = mongoose.model('Evidence', evidenceSchema);
