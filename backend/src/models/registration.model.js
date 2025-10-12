// Mongoose model cho đăng ký hoạt động
const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  activity: { type: mongoose.Schema.Types.ObjectId, ref: 'Activity' },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'attended', 'confirmed'], default: 'pending' },
  attended: { type: Boolean, default: false },
  attendanceTime: Date,
  qrCode: String, // Mã QR điểm danh
  evidence: { type: mongoose.Schema.Types.ObjectId, ref: 'Evidence' }, // Minh chứng hoạt động ngoài
  confirmedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Người xác nhận minh chứng
  confirmedAt: Date,
  feedback: { type: mongoose.Schema.Types.ObjectId, ref: 'Feedback' },
  // ...other fields...
}, { timestamps: true });

module.exports = mongoose.model('Registration', registrationSchema);
