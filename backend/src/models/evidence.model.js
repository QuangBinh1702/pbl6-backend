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

module.exports = mongoose.model('Evidence', evidenceSchema, 'evidence');
