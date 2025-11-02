const mongoose = require('mongoose');

const userRoleSchema = new mongoose.Schema({
  user_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true
  },
  role_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Role',
    required: true
  },
  org_unit_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'OrgUnit'
  }
}, { timestamps: false });

// Index for faster queries
userRoleSchema.index({ user_id: 1 });
userRoleSchema.index({ role_id: 1 });
userRoleSchema.index({ user_id: 1, org_unit_id: 1 });

// Static method to get all roles for a user
userRoleSchema.statics.getRolesForUser = async function(userId, orgUnitId = null) {
  const query = { user_id: userId };
  if (orgUnitId) {
    query.org_unit_id = orgUnitId;
  }
  return this.find(query)
    .populate('role_id')
    .populate('org_unit_id')
    .exec();
};

// Static method to check if user has a specific role
userRoleSchema.statics.hasRole = async function(userId, roleName) {
  const userRoles = await this.find({ user_id: userId })
    .populate('role_id')
    .exec();
  
  return userRoles.some(ur => ur.role_id && ur.role_id.name === roleName);
};

module.exports = mongoose.model('UserRole', userRoleSchema, 'user_role');

