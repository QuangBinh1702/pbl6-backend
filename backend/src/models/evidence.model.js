// Mongoose model cho minh chứng hoạt động ngoài trường
const mongoose = require('mongoose');

const evidenceSchema = new mongoose.Schema({
  student_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'StudentProfile', 
    required: true 
  },
  title: String,
  file_url: String,
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
  self_point: Number,
  class_point: Number,
  faculty_point: Number
}, { timestamps: false });

// Index for faster queries
evidenceSchema.index({ student_id: 1 });
evidenceSchema.index({ status: 1 });
evidenceSchema.index({ submitted_at: -1 });

module.exports = mongoose.model('Evidence', evidenceSchema, 'evidence');
