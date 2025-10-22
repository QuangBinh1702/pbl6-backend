const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  student_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'StudentProfile', 
    required: true 
  },
  activity_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Activity', 
    required: true 
  },
  scanned_at: { 
    type: Date, 
    default: Date.now 
  },
  status: { 
    type: String, 
    default: 'present' 
  },
  verified: { 
    type: Boolean, 
    default: false 
  },
  verified_at: Date,
  points: Number,
  feedback: String,
  feedback_time: Date
}, { timestamps: true });

// Index for faster queries
attendanceSchema.index({ student_id: 1 });
attendanceSchema.index({ activity_id: 1 });
attendanceSchema.index({ scanned_at: -1 });

module.exports = mongoose.model('Attendance', attendanceSchema);