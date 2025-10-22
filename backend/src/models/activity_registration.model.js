const mongoose = require('mongoose');

const activityRegistrationSchema = new mongoose.Schema({
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
  registered_at: { 
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled'],
    default: 'pending'
  },
  approval_note: String,
  approved_by: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User'
  },
  approved_at: Date
}, { timestamps: true });

// Index for faster queries
activityRegistrationSchema.index({ activity_id: 1 });
activityRegistrationSchema.index({ student_id: 1 });
activityRegistrationSchema.index({ status: 1 });

// Prevent duplicate registrations
activityRegistrationSchema.index({ activity_id: 1, student_id: 1 }, { unique: true });

module.exports = mongoose.model('ActivityRegistration', activityRegistrationSchema, 'activity_registration');

