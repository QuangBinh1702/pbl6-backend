const mongoose = require('mongoose');

const roleActionSchema = new mongoose.Schema({
  role_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Role',
    required: true
  },
  action_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Action',
    required: true
  },
  is_granted: { 
    type: Boolean, 
    default: true
  }
}, { timestamps: true });

// Compound index to prevent duplicate role-action pairs
roleActionSchema.index({ role_id: 1, action_id: 1 }, { unique: true });

// Static method to get all actions for a role
roleActionSchema.statics.getActionsForRole = async function(roleId) {
  return this.find({ role_id: roleId })
    .populate('action_id')
    .exec();
};

// Static method to get all roles that have a specific action
roleActionSchema.statics.getRolesWithAction = async function(actionId) {
  return this.find({ action_id: actionId })
    .populate('role_id')
    .exec();
};

module.exports = mongoose.model('RoleAction', roleActionSchema, 'role_action');

