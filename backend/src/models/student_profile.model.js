const mongoose = require('mongoose');

const studentProfileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  student_number: { type: String, required: true, unique: true },
  full_name: String,
  date_of_birth: Date,
  gender: String,
  email: String,
  phone: String,
  enrollment_year: Number,
  class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
  contact_address: String,
  isClassMonitor: Boolean
}, { timestamps: true });

module.exports = mongoose.model('StudentProfile', studentProfileSchema);