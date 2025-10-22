const mongoose = require('mongoose');

const staffProfileSchema = new mongoose.Schema({
  user_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  staff_number: { 
    type: String, 
    required: true, 
    unique: true 
  },
  full_name: String,
  date_of_birth: Date,
  gender: String,
  email: String,
  phone: String,
  org_unit_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'OrgUnit' 
  },
  staff_image: String,
  contact_address: String
}, { timestamps: true });

// Index for faster queries
staffProfileSchema.index({ user_id: 1 });
staffProfileSchema.index({ staff_number: 1 });
staffProfileSchema.index({ org_unit_id: 1 });

module.exports = mongoose.model('StaffProfile', staffProfileSchema, 'staff_profile');