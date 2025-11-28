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
  
  // ← PHASE 2.5: Track which QR was scanned (replaces session_id)
  qr_code_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'QRCode',
    sparse: true
  },
  
  // ← OLD: Track multiple sessions (keep for backward compatibility)
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
  
  // ← PHASE 2: Student submitted info for approval
  student_info: {
    student_id_number: {
      type: String,
      validate: /^\d{5,6}$/,  // 5-6 digits (MSSV)
      sparse: true
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,  // Reference to Class model
      ref: 'Class',
      sparse: true
    },
    faculty: {
      type: mongoose.Schema.Types.ObjectId,  // Reference to Falcuty model
      ref: 'Falcuty',
      sparse: true
    },
    phone: {
      type: String,
      validate: /^(0|\+84)\d{9,10}$/,  // Vietnamese phone format
      sparse: true
    },
    notes: {
      type: String,
      maxlength: 500
    },
    submitted_at: {
      type: Date,
      default: Date.now
    }
  },

  // ← PHASE 2.5: Track mismatches and warnings
  student_info_flags: {
    class_mismatch: {
      type: Boolean,
      default: false,
      index: true  // Fast queries for mismatches
    },
    registered_class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      sparse: true
    },
    student_in_system: {
      type: Boolean,
      default: false
    }
  },

  // ← UPDATED: Calculated status based on attendance config
  status: { 
    type: String,
    enum: ['present', 'absent', 'partial', 'pending', 'approved', 'rejected'],
    default: 'pending',
    index: true  // Fast queries for pending/approved
  },
  
  scanned_at: { 
    type: Date, 
    default: Date.now 
  },
  verified: { 
    type: Boolean, 
    default: false 
  },
  
  // ← PHASE 2: Approval workflow fields
  verified_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'  // Staff/Admin who verified
  },
  verified_at: Date,
  
  rejection_reason: {
    type: String,
    enum: ['MISSING_INFO', 'INVALID_CLASS', 'DUPLICATE', 'NOT_PARTICIPANT', 'OUT_OF_TIME', 'NO_EVIDENCE', 'INVALID_PHONE'],
    sparse: true
  },
  
  verified_comment: String,  // Notes from staff
  
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

// ← PHASE 2: Performance indexes for approval workflow
attendanceSchema.index({ student_id: 1 });
attendanceSchema.index({ activity_id: 1 });
attendanceSchema.index({ activity_id: 1, status: 1 });  // ← Query pending by activity
attendanceSchema.index({ activity_id: 1, 'attendance_sessions.session_id': 1 });  // ← By session
attendanceSchema.index({ verified_at: -1 });  // ← Sort by verification date
attendanceSchema.index({ 'student_info.class': 1 });  // ← Filter by class
attendanceSchema.index({ 'student_info.faculty': 1 });  // ← Filter by faculty
attendanceSchema.index({ scanned_at: -1 });

module.exports = mongoose.model('Attendance', attendanceSchema, 'attendance');