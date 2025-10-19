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
}, { timestamps: true });

// Index for faster queries
studentFeedbackSchema.index({ activity_id: 1 });
studentFeedbackSchema.index({ student_id: 1 });
studentFeedbackSchema.index({ submitted_at: -1 });

// Prevent duplicate feedback from same student for same activity
studentFeedbackSchema.index({ activity_id: 1, student_id: 1 }, { unique: true });

module.exports = mongoose.model('StudentFeedback', studentFeedbackSchema);

