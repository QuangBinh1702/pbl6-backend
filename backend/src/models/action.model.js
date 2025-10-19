const mongoose = require('mongoose');

const actionSchema = new mongoose.Schema({
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
  resource: { 
    type: String, 
    required: true,
    trim: true
  },
  description: String,
  is_active: { 
    type: Boolean, 
    default: true 
  }
}, { timestamps: true });

// Compound unique index on resource + action_code (same action can exist for different resources)
actionSchema.index({ resource: 1, action_code: 1 }, { unique: true });
actionSchema.index({ is_active: 1 });

module.exports = mongoose.model('Action', actionSchema);

