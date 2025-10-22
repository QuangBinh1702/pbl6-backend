const mongoose = require('mongoose');

const userActionOverrideSchema = new mongoose.Schema({
  user_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true
  },
  user_role_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'UserRole'
  },
  action_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Action',
    required: true
  },
  is_granted: { 
    type: Boolean, 
    required: true,
    default: true
  },
  note: String,
  granted_by: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User'
  },
  granted_at: Date
}, { timestamps: true });

// Compound index to prevent duplicate user-action pairs
userActionOverrideSchema.index({ user_id: 1, action_id: 1 }, { unique: true });

// Static method to get all overrides for a user
userActionOverrideSchema.statics.getOverridesForUser = async function(userId) {
  return this.find({ user_id: userId })
    .populate('action_id')
    .populate('granted_by')
    .exec();
};

// Static method to check if user has specific override
userActionOverrideSchema.statics.checkOverride = async function(userId, actionId) {
  const override = await this.findOne({ 
    user_id: userId, 
    action_id: actionId 
  });
  
  if (!override) return null; // No override
  return override.is_granted; // true = granted, false = revoked
};

module.exports = mongoose.model('UserActionOverride', userActionOverrideSchema);

