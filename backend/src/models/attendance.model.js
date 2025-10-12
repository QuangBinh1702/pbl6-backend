const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentProfile', required: true },
  activity: { type: mongoose.Schema.Types.ObjectId, ref: 'Activity', required: true },
  scanned_at: { type: Date, default: Date.now },
  status: { type: String, default: 'present' },
  verified: { type: Boolean, default: false },
  verified_at: Date,
  points: Number,
  feedback: String,
  feedback_time: Date
});

module.exports = mongoose.model('Attendance', attendanceSchema);