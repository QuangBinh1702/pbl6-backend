const mongoose = require('mongoose');

const pvcdRecordSchema = new mongoose.Schema({
  student_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'StudentProfile', 
    required: true 
  },
  year: { 
    type: Number, 
    required: true,
    min: 1900,
    max: 2100,
    validate: {
      validator: function(value) {
        return Number.isInteger(value) && value >= 1900 && value <= 2100;
      },
      message: 'Year must be a 4-digit number between 1900 and 2100'
    }
  },
  start_year: Date,
  end_year: Date,
  total_point: { 
    type: Number, 
    default: 0,
    min: 0,
    validate: {
      validator: function(value) {
        return value >= 0;
      },
      message: 'Total point must be >= 0'
    }
  }
}, { timestamps: false });

// Validate: year is numeric and valid
pvcdRecordSchema.pre('save', function(next) {
  // Validate year format
  if (!Number.isInteger(this.year) || this.year < 1900 || this.year > 2100) {
    return next(new Error(`Year must be a 4-digit number (1900-2100), got: ${this.year}`));
  }

  // Validate: end_year must be after start_year
  if (this.start_year && this.end_year) {
    if (this.end_year <= this.start_year) {
      return next(new Error('End year must be after start year'));
    }
  }
  
  next();
});

// ❌ DISABLED: total_point now calculated by Evidence post-save hook
// This ensures consistency: year = Evidence.submitted_at year, and only uses faculty_point from approved evidences
// pvcdRecordSchema.pre('save', async function(next) { ... });

// Index for faster queries
pvcdRecordSchema.index({ student_id: 1 });
pvcdRecordSchema.index({ year: 1 });

// ✅ Unique compound index to prevent duplicate records for same student + year
pvcdRecordSchema.index({ student_id: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('PvcdRecord', pvcdRecordSchema, 'pvcd_record');