const mongoose = require('mongoose');

const studentCohortSchema = new mongoose.Schema({
  student_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'StudentProfile', 
    required: true 
  },
  cohort_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Cohort', 
    required: true 
  },
  type: { 
    type: String, 
    enum: ['official', 'actual'], 
    default: 'official' 
  }
}, { timestamps: true });

// Index for faster queries
studentCohortSchema.index({ student_id: 1 });
studentCohortSchema.index({ cohort_id: 1 });

module.exports = mongoose.model('StudentCohort', studentCohortSchema);