const mongoose = require('mongoose');

const studentProfileSchema = new mongoose.Schema({
  user_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  student_number: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true
  },
  full_name: {
    type: String,
    trim: true
  },
  date_of_birth: Date,
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  phone: String,
  enrollment_year: Number,
  class_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Class' 
  },
  student_image: String,
  contact_address: String,
  isClassMonitor: { 
    type: Boolean, 
    default: false 
  }
}, { timestamps: true });

// Index for faster queries
studentProfileSchema.index({ user_id: 1 });
studentProfileSchema.index({ student_number: 1 });
studentProfileSchema.index({ class_id: 1 });
studentProfileSchema.index({ isClassMonitor: 1 });

module.exports = mongoose.model('StudentProfile', studentProfileSchema);