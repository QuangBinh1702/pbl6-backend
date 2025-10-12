const mongoose = require('mongoose');

const orgUnitSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true },
  leader: { type: mongoose.Schema.Types.ObjectId, ref: 'StaffProfile' }
});

module.exports = mongoose.model('OrgUnit', orgUnitSchema);