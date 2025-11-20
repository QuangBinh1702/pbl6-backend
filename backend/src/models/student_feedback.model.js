const mongoose = require('mongoose');

const studentFeedbackSchema = new mongoose.Schema({
  activity_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Activity',
    required: true
  },
  student_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'StudentProfile',
    required: true
  },
  comment: { 
    type: String,
    trim: true
  },
  rating: { 
    type: Number,
    min: 1,
    max: 5
  },
  submitted_at: { 
    type: Date,
    default: Date.now
  }
}, { timestamps: false });

// Index for faster queries (composite index covers both single-field queries for performance)
studentFeedbackSchema.index({ student_id: 1 });
studentFeedbackSchema.index({ submitted_at: -1 });

// Prevent duplicate feedback from same student for same activity (also serves as index for activity_id)
studentFeedbackSchema.index({ activity_id: 1, student_id: 1 }, { unique: true });

module.exports = mongoose.model('StudentFeedback', studentFeedbackSchema, 'student_feedback');

