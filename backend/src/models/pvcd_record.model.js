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

// Index for faster queries
pvcdRecordSchema.index({ student_id: 1 });
pvcdRecordSchema.index({ year: 1 });

module.exports = mongoose.model('PvcdRecord', pvcdRecordSchema, 'pvcd_record');