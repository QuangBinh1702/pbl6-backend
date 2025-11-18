const mongoose = require('mongoose');

const pvcdRecordSchema = new mongoose.Schema({
  student_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'StudentProfile', 
    required: true 
  },
  year: { 
    type: Number, 
    required: true 
  },
  start_year: Date,
  end_year: Date,
  total_point: { 
    type: Number, 
    default: 0,
    min: 0,
    max: 100,
    validate: {
      validator: function(value) {
        return value >= 0 && value <= 100;
      },
      message: 'Total point must be between 0 and 100'
    }
  }
}, { timestamps: false });

// Validate: end_year must be after start_year
pvcdRecordSchema.pre('save', function(next) {
  if (this.start_year && this.end_year) {
    if (this.end_year <= this.start_year) {
      next(new Error('End year must be after start year'));
      return;
    }
  }
  next();
});

// Calculate total_point from attendance points
pvcdRecordSchema.pre('save', async function(next) {
  try {
    // Skip if student_id is not set
    if (!this.student_id) {
      return next();
    }

    // Lazy load to avoid circular dependencies
    const Attendance = require('./attendance.model');
    
    // Get all attendance records for this student, only if attendance has points
    const attendances = await Attendance.find({ 
      student_id: this.student_id,
      points: { $exists: true, $ne: null }
    })
      .populate('activity_id')
      .lean();
    
    // Filter attendance by year and sum points
    let totalPoints = 0;
    attendances.forEach(att => {
      if (att.activity_id && att.activity_id.start_time && att.points) {
        const activityYear = new Date(att.activity_id.start_time).getFullYear();
        if (activityYear === this.year) {
          totalPoints += parseFloat(att.points) || 0;
        }
      }
    });
    
    // Ensure total_point doesn't exceed 100 and is a valid number
    this.total_point = Math.min(Math.max(totalPoints, 0), 100);
    next();
  } catch (err) {
    next(err);
  }
});

// Index for faster queries
pvcdRecordSchema.index({ student_id: 1 });
pvcdRecordSchema.index({ year: 1 });

module.exports = mongoose.model('PvcdRecord', pvcdRecordSchema, 'pvcd_record');