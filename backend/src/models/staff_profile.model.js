const mongoose = require('mongoose');

const staffProfileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  staff_number: { type: String, required: true, unique: true },
  full_name: String,
  date_of_birth: Date,
  gender: String,
  email: String,
  phone: String,
  org_unit: { type: mongoose.Schema.Types.ObjectId, ref: 'OrgUnit' },
  contact_address: String
}, { timestamps: true });

module.exports = mongoose.model('StaffProfile', staffProfileSchema);