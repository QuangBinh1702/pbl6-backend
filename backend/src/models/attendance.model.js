const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  student_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'StudentProfile', 
    required: true  // ✅ Student must exist in system
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

  // 🆕 DYNAMIC QR SCORING: Track scan order and total QR at scan time
  scan_order: {
    type: Number,
    description: "Which scan this is for the student (1st, 2nd, 3rd...)"
  },
  total_qr_at_scan: {
    type: Number,
    description: "Total QR codes that existed when this was scanned"
  },
  
  // ← PHASE 2: Student submitted info for approval
  student_info: {
    student_id_number: {
      type: String,
      validate: /^\d{9}$/,  // 🆕 9 digits (MSSV)
      sparse: true
    },
    student_name: {
      type: String,
      maxlength: 100  // 🆕 Student name from form
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

  // ← UPDATED: Attendance status (only present/absent/partial)
  status: { 
    type: String,
    enum: ['present', 'absent', 'partial'],
    default: 'absent',  // Default to absent (not present) - more realistic
    index: true  // Fast queries for attendance status
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

    // Get year (calendar year) from scanned_at
    const year = new Date(doc.scanned_at).getFullYear();

    // Validate year is a valid 4-digit number
    if (isNaN(year) || year < 1900 || year > 2100) {
      throw new Error(`Invalid year: ${year}`);
    }

    // Calculate total points for this student in this year
    const attendances = await this.constructor.find({
      student_id: doc.student_id,
      points: { $exists: true, $ne: null }
    }).lean();

    let totalPoints = 0;
    attendances.forEach(att => {
      const attYear = new Date(att.scanned_at).getFullYear();
      if (attYear === year) {
        totalPoints += parseFloat(att.points) || 0;
      }
    });

    // Cap at 100
    totalPoints = Math.min(Math.max(totalPoints, 0), 100);

    // Validate student_id exists
    const StudentProfile = require('./student_profile.model');
    const student = await StudentProfile.findById(doc.student_id);
    if (!student) {
      throw new Error(`Student not found: ${doc.student_id}`);
    }

    // Update or create pvcd_record with numeric year
    await PvcdRecord.findOneAndUpdate(
      {
        student_id: doc.student_id,
        year: year  // ✅ Use numeric year, not Date
      },
      {
        student_id: doc.student_id,
        year: year,  // ✅ Use numeric year, not Date
        total_point: totalPoints
      },
      { upsert: true, new: true, runValidators: true }
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
attendanceSchema.index({ verified_at: -1 });  // ← Sort by verification date
attendanceSchema.index({ 'student_info.class': 1 });  // ← Filter by class
attendanceSchema.index({ 'student_info.faculty': 1 });  // ← Filter by faculty
attendanceSchema.index({ scanned_at: -1 });
// 🆕 DYNAMIC QR SCORING: Indexes for counting scans and duplicate detection
attendanceSchema.index({ student_id: 1, activity_id: 1 });  // ← Count scans for student
attendanceSchema.index({ student_id: 1, qr_code_id: 1 });  // ← Detect duplicates

module.exports = mongoose.model('Attendance', attendanceSchema, 'attendance');