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

// ❌ DISABLED: total_point now calculated by Evidence post-save hook
// This ensures consistency: year = Evidence.submitted_at year, and only uses faculty_point from approved evidences
// attendanceSchema.post('save', async function(doc) { ... });

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

// 🆕 AUTO-UPDATE PVCD when attendance is deleted
attendanceSchema.post('findOneAndDelete', async function(doc) {
  try {
    if (!doc || !doc.student_id) return;

    const PvcdRecord = require('./pvcd_record.model');
    const year = new Date(doc.scanned_at).getFullYear();

    // Recalculate PVCD record after deletion
    const attendances = await this.constructor.find({
      student_id: doc.student_id,
      scanned_at: {
        $gte: new Date(`${year}-01-01`),
        $lt: new Date(`${year + 1}-01-01`)
      }
    }).lean();

    // Sum remaining attendance points
    let attendancePoints = 0;
    attendances.forEach(att => {
      attendancePoints += parseFloat(att.points) || 0;
    });

    // Get approved evidences for this year
    const Evidence = require('./evidence.model');
    const approvedEvidences = await Evidence.find({
      student_id: doc.student_id,
      status: 'approved',
      submitted_at: {
        $gte: new Date(`${year}-01-01`),
        $lt: new Date(`${year + 1}-01-01`)
      }
    }).lean();

    let evidencePoints = 0;
    approvedEvidences.forEach(ev => {
      evidencePoints += parseFloat(ev.faculty_point) || 0;
    });

    // Update PVCD record
    const totalPoints = attendancePoints + evidencePoints;
    await PvcdRecord.findOneAndUpdate(
      { student_id: doc.student_id, year: year },
      { 
        student_id: doc.student_id, 
        year: year, 
        total_point: totalPoints 
      },
      { upsert: true, new: true }
    );

    console.log(`[PVCD Auto-Update] Deleted attendance for student ${doc.student_id}: total_point recalculated to ${totalPoints}`);
  } catch (err) {
    console.error('Error updating pvcd_record after attendance deletion:', err.message);
  }
});

module.exports = mongoose.model('Attendance', attendanceSchema, 'attendance');