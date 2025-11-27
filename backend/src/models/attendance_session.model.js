// Mongoose model cho Attendance Session
const mongoose = require('mongoose');

const attendanceSessionSchema = new mongoose.Schema({
  activity_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Activity',
    required: true
  },
  session_number: {
    type: Number,
    required: true,
    min: 1
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  start_time: {
    type: Date,
    required: true
  },
  end_time: {
    type: Date,
    required: true
  },
  qr_code: {
    type: String  // Base64-encoded QR code for this session
  },
  required: {
    type: Boolean,
    default: true  // Bắt buộc phải quét session này
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'cancelled'],
    default: 'active'
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, { timestamps: false, collection: 'attendance_session' });

// Index cho faster queries
attendanceSessionSchema.index({ activity_id: 1 });
attendanceSessionSchema.index({ activity_id: 1, session_number: 1 });
attendanceSessionSchema.index({ start_time: 1, end_time: 1 });

module.exports = mongoose.model('AttendanceSession', attendanceSessionSchema);
