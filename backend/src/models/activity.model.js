// Mongoose model cho Activity
const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  type: { type: String, enum: ['school', 'faculty', 'club', 'volunteer', 'external'], default: 'school' }, // Loại hoạt động
  organizer: { type: String }, // Đơn vị tổ chức
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  time: Date,
  location: String,
  points: { type: Number, default: 0 },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'cancelled', 'completed'], default: 'pending' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  evidences: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Evidence' }],
  attendanceList: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Registration' }],
  feedbacks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Feedback' }],
  report: String, // Báo cáo tổng kết
  certificateTemplate: String, // Mẫu giấy chứng nhận
  // ...other fields...
}, { timestamps: true });

module.exports = mongoose.model('Activity', activitySchema);
