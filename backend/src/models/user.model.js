// Mongoose model cho User
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: [
      'admin', // Quản trị hệ thống
      'ctsv', // Phòng Công tác Sinh viên
      'doantruong', // Đoàn trường
      'hoisv', // Hội sinh viên
      'khoa', // Khoa/Liên chi đoàn
      'clb', // Câu lạc bộ
      'student', // Sinh viên
      'loptruong' // Lớp trưởng
    ],
    default: 'student'
  },
  phone: String,
  class: String, // Lớp
  studentId: { type: String, unique: true, sparse: true },
  isLocked: { type: Boolean, default: false },
  avatar: String,
  department: String, // Khoa/đơn vị
  graduationYear: Number, // Năm tốt nghiệp
  joinedYear: Number, // Năm vào trường
  evidences: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Evidence' }], // Minh chứng hoạt động ngoài
  notifications: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Notification' }],
  // ...other fields...
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
