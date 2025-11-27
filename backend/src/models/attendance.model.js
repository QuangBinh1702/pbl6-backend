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
  
  // ← NEW: Track multiple sessions
  attendance_sessions: [{
    session_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AttendanceSession'
    },
    session_number: Number,
    session_name: String,
    scanned_at: Date,
    session_status: {
      type: String,
      enum: ['present', 'absent'],
      default: 'present'
    }
  }],
  
  // ← NEW: Summary fields
  total_sessions_required: {
    type: Number,
    default: 1
  },
  total_sessions_attended: {
    type: Number,
    default: 0
  },
  attendance_rate: {
    type: Number,  // 0.0 - 1.0 (0% - 100%)
    default: 0
  },
  
  // ← UPDATED: Calculated status based on attendance config
  status: { 
    type: String,
    enum: ['present', 'absent', 'partial'],
    default: 'absent' 
  },
  
  scanned_at: { 
    type: Date, 
    default: Date.now 
  },
  verified: { 
    type: Boolean, 
    default: false 
  },
  verified_at: Date,
  
  // ← NEW: Points earned based on calculation
  points_earned: {
    type: Number,
    default: 0
  },
  
  // ← OLD: Kept for backward compatibility
  points: Number,
  
  feedback: String,
  feedback_time: Date,
  feedback_status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: null
  },
  feedback_verified_at: Date
}, { timestamps: false });

// Auto-update pvcd_record when attendance is saved
attendanceSchema.post('save', async function(doc) {
  try {
    // Skip if no student_id or points
    if (!doc.student_id || !doc.points) {
      return;
    }

    // Lazy load to avoid circular dependencies
    const PvcdRecord = require('./pvcd_record.model');

    // Get year from scanned_at
    const year = new Date(doc.scanned_at).getFullYear();
    const yearDate = new Date(`${year}-01-01`);

    // Calculate total points for this student in this year
    const attendances = await this.constructor.find({
      student_id: doc.student_id,
      points: { $exists: true, $ne: null }
    }).lean();

    let totalPoints = 0;
    attendances.forEach(att => {
      if (new Date(att.scanned_at).getFullYear() === year) {
        totalPoints += att.points || 0;
      }
    });

    // Cap at 100
    totalPoints = Math.min(totalPoints, 100);

    // Update or create pvcd_record
    await PvcdRecord.findOneAndUpdate(
      {
        student_id: doc.student_id,
        year: yearDate
      },
      {
        student_id: doc.student_id,
        year: yearDate,
        total_point: totalPoints
      },
      { upsert: true, new: true }
    );
  } catch (err) {
    console.error('Error updating pvcd_record:', err.message);
    // Don't throw - we don't want to fail the attendance save
  }
});

// Index for faster queries
attendanceSchema.index({ student_id: 1 });
attendanceSchema.index({ activity_id: 1 });
attendanceSchema.index({ scanned_at: -1 });

module.exports = mongoose.model('Attendance', attendanceSchema, 'attendance');