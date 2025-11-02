const mongoose = require('mongoose');

const orgUnitSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  type: { 
    type: String, 
    required: true 
  },
  leader_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'StaffProfile' 
  }
}, { timestamps: false });

// Index for faster queries
orgUnitSchema.index({ type: 1 });

module.exports = mongoose.model('OrgUnit', orgUnitSchema, 'org_unit');