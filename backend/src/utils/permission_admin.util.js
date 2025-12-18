const UserRole = require('../models/user_role.model');
const RoleAction = require('../models/role_action.model');
const UserActionOverride = require('../models/user_action_override.model');
const Action = require('../models/action.model');
const Role = require('../models/role.model');
const User = require('../models/user.model');

/**
 * Build a comprehensive permission matrix for a user
 * Shows what permissions user has via roles, overrides, and final effective state
 * 
 * @param {string|ObjectId} userId - User ID
 * @param {string|ObjectId} orgUnitId - Optional: specific org unit context
 * @returns {Promise<Object>} - Permission matrix with roles and permissions
 */
async function buildUserPermissionMatrix(userId, orgUnitId = null) {
  try {
    // 1) Load all active actions
    const allActions = await Action.find({ is_active: true })
      .sort({ resource: 1, action_code: 1 });

    if (!allActions || allActions.length === 0) {
      throw new Error('No actions found in database');
    }

    // 2) Load user and their roles
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    let userRoles = await UserRole.getRolesForUser(userId, orgUnitId);
    
    // Fallback: if requesting with orgUnitId but no roles found, try global roles
    if ((!userRoles || userRoles.length === 0) && orgUnitId) {
      userRoles = await UserRole.getRolesForUser(userId, null);
    }

    const roleIds = (userRoles || [])
      .filter(ur => ur.role_id)
      .map(ur => ur.role_id._id);

    // 3) Load role_actions for those roles
    const roleActions = roleIds.length
      ? await RoleAction.find({ role_id: { $in: roleIds } })
          .populate('action_id')
      : [];

    const actionsGrantedByRoles = new Set(
      roleActions
        .filter(ra => ra.action_id && ra.action_id.is_active)
        .map(ra => String(ra.action_id._id))
    );

    // 4) Load all overrides for this user
    const overrides = await UserActionOverride
      .find({ user_id: userId })
      .populate('action_id')
      .populate('granted_by', 'username name');

    const overridesByActionId = new Map();
    for (const ov of overrides) {
      if (!ov.action_id) continue;
      overridesByActionId.set(String(ov.action_id._id), ov);
    }

    // 5) Build matrix per action
    const matrix = allActions.map(action => {
      const id = String(action._id);
      const viaRoles = actionsGrantedByRoles.has(id);
      const override = overridesByActionId.get(id) || null;
      const overrideType = override == null
        ? null
        : (override.is_granted ? 'grant' : 'revoke');

      // Final decision: override if present, else role-based
      const effective = override != null ? override.is_granted : viaRoles;

      return {
        action_id: action._id,
        resource: action.resource,
        action_code: action.action_code,
        action_name: action.action_name,
        description: action.description,
        viaRoles,
        overrideType,       // 'grant' | 'revoke' | null
        overrideId: override?._id || null,
        overrideNote: override?.note || null,
        grantedByName: override?.granted_by?.name || override?.granted_by?.username || null,
        grantedAt: override?.granted_at || null,
        effective
      };
    });

    return {
      success: true,
      userId,
      user: {
        id: user._id,
        username: user.username,
        name: user.name
      },
      orgUnitId: orgUnitId || null,
      roles: (userRoles || []).map(ur => ({
        user_role_id: ur._id,
        role_id: ur.role_id?._id,
        role_name: ur.role_id?.name,
        role_description: ur.role_id?.description,
        org_unit_id: ur.org_unit_id
      })),
      permissions: matrix,
      summary: {
        totalActions: matrix.length,
        effectiveCount: matrix.filter(p => p.effective).length,
        overrideCount: matrix.filter(p => p.overrideType).length,
        grantedCount: matrix.filter(p => p.overrideType === 'grant').length,
        revokedCount: matrix.filter(p => p.overrideType === 'revoke').length
      }
    };
  } catch (error) {
    console.error('buildUserPermissionMatrix error:', error);
    throw error;
  }
}

/**
 * Get available permissions for a user based on their roles
 * Only shows actions that come from at least one of user's roles
 * 
 * @param {string|ObjectId} userId - User ID
 * @param {string|ObjectId} orgUnitId - Optional: specific org unit context
 * @returns {Promise<Array>} - Available actions for this user
 */
async function getAvailablePermissionsForUser(userId, orgUnitId = null) {
  try {
    let userRoles = await UserRole.getRolesForUser(userId, orgUnitId);
    
    if ((!userRoles || userRoles.length === 0) && orgUnitId) {
      userRoles = await UserRole.getRolesForUser(userId, null);
    }

    if (!userRoles || userRoles.length === 0) {
      return [];
    }

    const roleIds = userRoles.map(r => r.role_id._id);

    // Get all actions that are assigned to any of the user's roles
    const roleActions = await RoleAction.find({ role_id: { $in: roleIds } })
      .populate('action_id');

    const uniqueActionIds = new Set(
      roleActions
        .filter(ra => ra.action_id && ra.action_id.is_active)
        .map(ra => String(ra.action_id._id))
    );

    const availableActions = await Action.find({
      _id: { $in: Array.from(uniqueActionIds) },
      is_active: true
    }).sort({ resource: 1, action_code: 1 });

    return availableActions;
  } catch (error) {
    console.error('getAvailablePermissionsForUser error:', error);
    throw error;
  }
}

/**
 * Grant a permission to a user
 * 
 * @param {string|ObjectId} userId - User ID
 * @param {string|ObjectId} actionId - Action ID
 * @param {string|ObjectId} grantedByUserId - Admin user ID who granted
 * @param {string} note - Optional note/reason
 * @returns {Promise<Object>} - Result of grant operation
 */
async function grantPermissionToUser(userId, actionId, grantedByUserId, note = null) {
  try {
    // Validate action exists
    const action = await Action.findById(actionId);
    if (!action) {
      throw new Error('Action not found');
    }

    // Validate user exists
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Check if permission already comes from a role
    const userRoles = await UserRole.getRolesForUser(userId);
    const roleIds = (userRoles || []).map(r => r.role_id._id);
    
    const hasViaRole = roleIds.length > 0 && await RoleAction.findOne({
      role_id: { $in: roleIds },
      action_id: actionId
    });

    if (hasViaRole) {
      // Permission already granted via role
      // Remove any DENY override if exists
      await UserActionOverride.deleteOne({
        user_id: userId,
        action_id: actionId
      });
      return {
        success: true,
        message: 'Permission already granted via role',
        actionTaken: 'REMOVED_DENY_OVERRIDE'
      };
    }

    // Check for existing override
    const existingOverride = await UserActionOverride.findOne({
      user_id: userId,
      action_id: actionId
    });

    if (existingOverride) {
      if (existingOverride.is_granted) {
        return {
          success: true,
          message: 'Permission already granted to user',
          actionTaken: 'NONE'
        };
      } else {
        // Change from DENY to GRANT
        existingOverride.is_granted = true;
        existingOverride.granted_at = new Date();
        existingOverride.granted_by = grantedByUserId;
        existingOverride.note = note;
        await existingOverride.save();
        return {
          success: true,
          message: 'Permission granted to user',
          actionTaken: 'OVERRIDE_CHANGED',
          override: existingOverride
        };
      }
    }

    // Create new GRANT override
    const newOverride = new UserActionOverride({
      user_id: userId,
      action_id: actionId,
      is_granted: true,
      note,
      granted_at: new Date(),
      granted_by: grantedByUserId
    });

    await newOverride.save();

    return {
      success: true,
      message: 'Permission granted to user',
      actionTaken: 'CREATED_OVERRIDE',
      override: newOverride
    };
  } catch (error) {
    console.error('grantPermissionToUser error:', error);
    throw error;
  }
}

/**
 * Revoke a permission from a user
 * 
 * @param {string|ObjectId} userId - User ID
 * @param {string|ObjectId} actionId - Action ID
 * @param {string|ObjectId} grantedByUserId - Admin user ID who revoked
 * @param {string} note - Optional note/reason
 * @returns {Promise<Object>} - Result of revoke operation
 */
async function revokePermissionFromUser(userId, actionId, grantedByUserId, note = null) {
  try {
    // Validate action exists
    const action = await Action.findById(actionId);
    if (!action) {
      throw new Error('Action not found');
    }

    // Validate user exists
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const existingOverride = await UserActionOverride.findOne({
      user_id: userId,
      action_id: actionId
    });

    if (existingOverride) {
      if (!existingOverride.is_granted) {
        return {
          success: true,
          message: 'Permission already denied to user',
          actionTaken: 'NONE'
        };
      } else {
        // Change from GRANT to REVOKE
        existingOverride.is_granted = false;
        existingOverride.granted_at = new Date();
        existingOverride.granted_by = grantedByUserId;
        existingOverride.note = note;
        await existingOverride.save();
        return {
          success: true,
          message: 'Permission revoked from user',
          actionTaken: 'OVERRIDE_CHANGED',
          override: existingOverride
        };
      }
    }

    // Create new DENY override
    const newOverride = new UserActionOverride({
      user_id: userId,
      action_id: actionId,
      is_granted: false,
      note,
      granted_at: new Date(),
      granted_by: grantedByUserId
    });

    await newOverride.save();

    return {
      success: true,
      message: 'Permission revoked from user',
      actionTaken: 'CREATED_OVERRIDE',
      override: newOverride
    };
  } catch (error) {
    console.error('revokePermissionFromUser error:', error);
    throw error;
  }
}

/**
 * Delete an override (revert to role-based permissions)
 * 
 * @param {string|ObjectId} userId - User ID
 * @param {string|ObjectId} actionId - Action ID
 * @returns {Promise<Object>} - Result of delete operation
 */
async function deletePermissionOverride(userId, actionId) {
  try {
    const result = await UserActionOverride.deleteOne({
      user_id: userId,
      action_id: actionId
    });

    if (result.deletedCount === 0) {
      return {
        success: false,
        message: 'No override found to delete'
      };
    }

    return {
      success: true,
      message: 'Override removed, reverted to role-based permissions',
      actionTaken: 'DELETED'
    };
  } catch (error) {
    console.error('deletePermissionOverride error:', error);
    throw error;
  }
}

/**
 * Apply multiple permission changes at once
 * 
 * @param {string|ObjectId} userId - User ID
 * @param {Array<{actionId: string, desiredEffective: boolean}>} changes - Changes to apply
 * @param {string|ObjectId} grantedByUserId - Admin user ID
 * @returns {Promise<Object>} - Results with updated matrix
 */
async function applyPermissionChanges(userId, changes, grantedByUserId) {
  try {
    const results = [];

    for (const change of changes) {
      const { actionId, desiredEffective, note } = change;

      try {
        // Get current state
        const matrix = await buildUserPermissionMatrix(userId);
        const currentPermission = matrix.permissions.find(p => String(p.action_id) === String(actionId));

        if (!currentPermission) {
          results.push({
            actionId,
            success: false,
            message: 'Action not found'
          });
          continue;
        }

        const currentViaRoles = currentPermission.viaRoles;

        if (desiredEffective === currentViaRoles && !currentPermission.overrideType) {
          // No change needed
          results.push({
            actionId,
            success: true,
            message: 'No change needed',
            actionTaken: 'NONE'
          });
          continue;
        }

        if (desiredEffective === currentViaRoles && currentPermission.overrideType) {
          // Delete override to fall back to roles
          const deleteResult = await deletePermissionOverride(userId, actionId);
          results.push({
            actionId,
            ...deleteResult
          });
          continue;
        }

        if (desiredEffective) {
          // Grant
          const grantResult = await grantPermissionToUser(userId, actionId, grantedByUserId, note);
          results.push({
            actionId,
            ...grantResult
          });
        } else {
          // Revoke
          const revokeResult = await revokePermissionFromUser(userId, actionId, grantedByUserId, note);
          results.push({
            actionId,
            ...revokeResult
          });
        }
      } catch (err) {
        results.push({
          actionId,
          success: false,
          message: err.message
        });
      }
    }

    // Return updated matrix
    const updatedMatrix = await buildUserPermissionMatrix(userId);

    return {
      success: true,
      changes: results,
      updatedMatrix
    };
  } catch (error) {
    console.error('applyPermissionChanges error:', error);
    throw error;
  }
}

module.exports = {
  buildUserPermissionMatrix,
  getAvailablePermissionsForUser,
  grantPermissionToUser,
  revokePermissionFromUser,
  deletePermissionOverride,
  applyPermissionChanges
};
