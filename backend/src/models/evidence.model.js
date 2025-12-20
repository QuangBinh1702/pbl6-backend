// Mongoose model cho minh chứng hoạt động ngoài trường
const mongoose = require('mongoose');

const evidenceSchema = new mongoose.Schema({
  student_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'StudentProfile', 
    required: true 
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  file_url: {
    type: String,
    required: true
  },
  submitted_at: { 
    type: Date, 
    default: Date.now 
  },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  },
  verified_at: Date,
  self_point: {
    type: Number,
    default: 0
  },
  faculty_point: {
    type: Number,
    default: 0
  },
  approved_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejection_reason: String,
  feedback: String,
  activity_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Activity'
  }
}, { timestamps: false });

// Index for faster queries
evidenceSchema.index({ student_id: 1 });
evidenceSchema.index({ status: 1 });
evidenceSchema.index({ submitted_at: -1 });
evidenceSchema.index({ activity_id: 1 });
evidenceSchema.index({ approved_by: 1 });

// 🆕 Auto-update pvcd_record when evidence is saved
// Calculates total_point = Σ(Attendance.points_earned) + Σ(Evidence.faculty_point when approved)
evidenceSchema.post('save', async function(doc) {
  try {
    // Skip if no student_id
    if (!doc.student_id) {
      return;
    }

    // Lazy load to avoid circular dependencies
    const PvcdRecord = require('./pvcd_record.model');
    const Attendance = require('./attendance.model');

    // Get year from submitted_at (when evidence was submitted)
    const year = new Date(doc.submitted_at).getFullYear();

    // Validate year is valid
    if (isNaN(year) || year < 1900 || year > 2100) {
      throw new Error(`Invalid year: ${year}`);
    }

    // 1️⃣ Get all attendances for this student in this year (by scanned_at)
    const attendances = await Attendance.find({
      student_id: doc.student_id,
      scanned_at: {
        $gte: new Date(`${year}-01-01`),
        $lt: new Date(`${year + 1}-01-01`)
      }
    }).lean();

    // Sum points (FINAL TOTAL POINTS per activity, not points_earned which is just latest scan)
    let attendancePoints = 0;
    attendances.forEach(att => {
      // Use 'points' field which is the FINAL/TOTAL points for the activity
      attendancePoints += parseFloat(att.points) || 0;
    });

    // 2️⃣ Get all approved evidences for this student in this year (by submitted_at)
    const approvedEvidences = await this.constructor.find({
      student_id: doc.student_id,
      status: 'approved',
      submitted_at: {
        $gte: new Date(`${year}-01-01`),
        $lt: new Date(`${year + 1}-01-01`)
      }
    }).lean();

    // Sum faculty_point from approved evidences
    let evidencePoints = 0;
    approvedEvidences.forEach(ev => {
      evidencePoints += parseFloat(ev.faculty_point) || 0;
    });

    // 3️⃣ Total = Attendance + Approved Evidence
    const totalPoints = attendancePoints + evidencePoints;

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
        year: year
      },
      {
        student_id: doc.student_id,
        year: year,
        total_point: totalPoints
      },
      { upsert: true, new: true, runValidators: true }
    );
  } catch (err) {
    console.error('Error updating pvcd_record from evidence:', err.message);
    // Don't throw - we don't want to fail the evidence save
  }
});

module.exports = mongoose.model('Evidence', evidenceSchema, 'evidence');
