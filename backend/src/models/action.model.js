const mongoose = require('mongoose');

const actionSchema = new mongoose.Schema({
  permission_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Permission' 
  },
  resource: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  action_code: { 
    type: String, 
    required: true,
    uppercase: true,
    trim: true
  },
  action_name: { 
    type: String, 
    required: true 
  },
  description: String,
  is_active: { 
    type: Boolean, 
    default: true 
  }
}, { timestamps: true });

// Compound unique index on permission_id + action_code
actionSchema.index({ permission_id: 1, action_code: 1 }, { unique: true });
// Index for quick permission checks
actionSchema.index({ resource: 1, action_code: 1 });
actionSchema.index({ is_active: 1 });

module.exports = mongoose.model('Action', actionSchema, 'action');

