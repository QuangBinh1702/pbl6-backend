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
    enum: ['male', 'female', 'other', 'Nam', 'Nữ']
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
}, { 
  timestamps: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual fields: derive falcuty_id and cohort_id from populated class
studentProfileSchema.virtual('falcuty_id').get(function deriveFacultyId() {
  return this.class_id && this.class_id.falcuty_id ? this.class_id.falcuty_id : undefined;
});

studentProfileSchema.virtual('cohort_id').get(function deriveCohortId() {
  return this.class_id && this.class_id.cohort_id ? this.class_id.cohort_id : undefined;
});

// Index for faster queries (student_number already has unique index)
studentProfileSchema.index({ user_id: 1 });
studentProfileSchema.index({ class_id: 1 });
studentProfileSchema.index({ isClassMonitor: 1 });

module.exports = mongoose.model('StudentProfile', studentProfileSchema, 'student_profile');