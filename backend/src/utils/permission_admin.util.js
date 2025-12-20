const UserRole = require('../models/user_role.model');
const RoleAction = require('../models/role_action.model');
const UserActionOverride = require('../models/user_action_override.model');
const Action = require('../models/action.model');
const Role = require('../models/role.model');
const User = require('../models/user.model');
const permissionsConfig = require('../permissions.config');
const staffPermissionsConfig = require('../staff_permissions.config');

/**
 * Determine permission level based on permissions.config.js & staff_permissions.config.js
 * Priority: student > staff-basic > staff-optional > admin-only
 * @param {string} resource - e.g., "activity"
 * @param {string} actionCode - e.g., "APPROVE" or "approve"
 * @returns {string} - "admin-only" | "staff" | "student"
 */
function getPermissionLevel(resource, actionCode) {
  // Build the full permission string in format: resource:action (lowercase)
  const fullPermission = `${resource.toLowerCase()}:${actionCode.toLowerCase()}`;
  
  const isInAdmin = permissionsConfig.admin.includes(fullPermission);
  const isInStudent = permissionsConfig.student.includes(fullPermission);
  
  // Check staff BASIC and OPTIONAL
  const isInStaffBasic = staffPermissionsConfig.basic.includes(fullPermission);
  const isInStaffOptional = staffPermissionsConfig.optional.includes(fullPermission);
  const isInStaff = isInStaffBasic || isInStaffOptional;

  let level;
  
  // Priority 1: If student has it, anyone can toggle
  if (isInStudent) {
    level = 'student';
  }
  // Priority 2: If only staff/admin has it (not student), requires staff role
  else if (isInStaff) {
    level = 'staff';
  }
  // Priority 3: If only admin has it, requires admin role
  else if (isInAdmin) {
    level = 'admin-only';
  }
  // Fallback: treat as student-level if not found anywhere
  else {
    level = 'student';
    console.warn(`⚠️ Permission not found in any config: ${fullPermission}, defaulting to 'student'`);
  }

  return level;
}

/**
 * Build a comprehensive permission matrix for a user
 * Shows what permissions user has via roles, overrides, and final effective state
 * Permissions are grouped by role
 * 
 * @param {string|ObjectId} userId - User ID
 * @param {string|ObjectId} orgUnitId - Optional: specific org unit context
 * @returns {Promise<Object>} - Permission matrix with roles and permissions grouped by role
 */
async function buildUserPermissionMatrix(userId, orgUnitId = null) {
  try {
    // 1) Load all active actions with permission info (for Vietnamese name)
    const allActions = await Action.find({ is_active: true })
      .populate('permission_id', 'name description')
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

    // 3) Load role_actions for those roles, grouped by role
    const roleActionsMap = new Map(); // role_id => Set<action_ids>
    if (roleIds.length > 0) {
      const roleActions = await RoleAction.find({ role_id: { $in: roleIds } })
        .populate('action_id');
      
      roleActions.forEach(ra => {
        if (!ra.action_id || !ra.action_id.is_active) return;
        const roleId = String(ra.role_id);
        if (!roleActionsMap.has(roleId)) {
          roleActionsMap.set(roleId, new Set());
        }
        roleActionsMap.get(roleId).add(String(ra.action_id._id));
      });
    }

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

    // 5) Build permissions grouped by role
    const permissionsByRole = {};
    
    for (const userRole of (userRoles || [])) {
      const roleId = String(userRole.role_id._id);
      const roleName = userRole.role_id.name;
      const roleActionsSet = roleActionsMap.get(roleId) || new Set();
      
      const rolePermissions = allActions.map(action => {
        const id = String(action._id);
        const viaRoles = roleActionsSet.has(id);
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
          permission_name: action.permission_id?.name || action.resource, // Vietnamese name from Permission model
          permission_level: getPermissionLevel(action.resource, action.action_code), // Pass both resource and action_code
          viaRoles,
          overrideType,       // 'grant' | 'revoke' | null
          overrideId: override?._id || null,
          overrideNote: override?.note || null,
          grantedByName: override?.granted_by?.name || override?.granted_by?.username || null,
          grantedAt: override?.granted_at || null,
          effective
        };
      });

      permissionsByRole[roleName] = {
        user_role_id: userRole._id,
        role_id: userRole.role_id._id,
        role_name: roleName,
        role_description: userRole.role_id.description,
        org_unit_id: userRole.org_unit_id,
        permissions: rolePermissions,
        summary: {
          totalActions: rolePermissions.length,
          effectiveCount: rolePermissions.filter(p => p.effective).length,
          overrideCount: rolePermissions.filter(p => p.overrideType).length,
          grantedCount: rolePermissions.filter(p => p.overrideType === 'grant').length,
          revokedCount: rolePermissions.filter(p => p.overrideType === 'revoke').length
        }
      };
    }

    // Get all unique permissions across all roles (for total count)
    const allPermissionsFlat = allActions.map(action => {
      const id = String(action._id);
      const override = overridesByActionId.get(id) || null;
      const effective = override != null ? override.is_granted : false;
      
      return {
        action_id: action._id,
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
      permissionsByRole, // NEW: permissions grouped by role
      summary: {
        totalRoles: userRoles?.length || 0,
        totalActions: allActions.length,
        overrideCount: Array.from(overridesByActionId.values()).length
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
        
        // Verify save was successful
        const savedOverride = await UserActionOverride.findById(existingOverride._id);
        if (!savedOverride || savedOverride.is_granted !== true) {
          throw new Error('Failed to update override in database');
        }
        
        console.log(`✅ Updated override in DB:`, {
          _id: savedOverride._id,
          is_granted: savedOverride.is_granted
        });
        
        return {
          success: true,
          message: 'Permission granted to user',
          actionTaken: 'OVERRIDE_CHANGED',
          override: savedOverride
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
    
    // Verify save was successful
    const savedOverride = await UserActionOverride.findById(newOverride._id);
    if (!savedOverride) {
      throw new Error('Failed to save override to database');
    }
    
    console.log(`✅ Created override in DB:`, {
      _id: savedOverride._id,
      user_id: savedOverride.user_id,
      action_id: savedOverride.action_id,
      is_granted: savedOverride.is_granted
    });

    return {
      success: true,
      message: 'Permission granted to user',
      actionTaken: 'CREATED_OVERRIDE',
      override: savedOverride
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
        
        // Find permission in all roles (permissionsByRole structure)
        let currentPermission = null;
        if (matrix.permissionsByRole) {
          for (const roleName in matrix.permissionsByRole) {
            const roleData = matrix.permissionsByRole[roleName];
            if (roleData.permissions) {
              const perm = roleData.permissions.find(p => String(p.action_id) === String(actionId));
              if (perm) {
                currentPermission = perm;
                break; // Found, stop searching
              }
            }
          }
        }

        if (!currentPermission) {
          results.push({
            actionId,
            success: false,
            message: 'Action not found in user permissions'
          });
          continue;
        }

        // Get current effective state (final result after override)
        const currentEffective = currentPermission.effective;
        const currentViaRoles = currentPermission.viaRoles;
        const hasOverride = currentPermission.overrideType !== null;

        // Check if change is needed
        if (desiredEffective === currentEffective) {
          // No change needed - already in desired state
          results.push({
            actionId,
            success: true,
            message: 'No change needed - already in desired state',
            actionTaken: 'NONE',
            currentEffective,
            desiredEffective
          });
          continue;
        }

        // If desired state matches role-based state, delete override
        if (desiredEffective === currentViaRoles && hasOverride) {
          // Delete override to fall back to role-based permission
          const deleteResult = await deletePermissionOverride(userId, actionId);
          results.push({
            actionId,
            ...deleteResult,
            actionTaken: 'DELETED_OVERRIDE'
          });
          continue;
        }

        if (desiredEffective) {
          // Grant
          const grantResult = await grantPermissionToUser(userId, actionId, grantedByUserId, note);
          console.log(`✅ Grant permission: ${actionId}`, grantResult);
          
          if (!grantResult.success) {
            console.error(`❌ Failed to grant permission: ${actionId}`, grantResult);
          }
          
          results.push({
            actionId,
            ...grantResult
          });
        } else {
          // Revoke
          const revokeResult = await revokePermissionFromUser(userId, actionId, grantedByUserId, note);
          console.log(`✅ Revoke permission: ${actionId}`, revokeResult);
          
          if (!revokeResult.success) {
            console.error(`❌ Failed to revoke permission: ${actionId}`, revokeResult);
          }
          
          results.push({
            actionId,
            ...revokeResult
          });
        }
      } catch (err) {
        console.error(`❌ Error processing change for ${actionId}:`, err);
        results.push({
          actionId,
          success: false,
          message: err.message,
          error: err.stack
        });
      }
    }

    // Check if any changes failed
    const failedChanges = results.filter(r => !r.success);
    if (failedChanges.length > 0) {
      console.warn(`⚠️ ${failedChanges.length} changes failed:`, failedChanges);
    }

    // Return updated matrix (reload from DB to verify)
    const updatedMatrix = await buildUserPermissionMatrix(userId);
    
    console.log(`📊 Updated matrix - Effective permissions:`, 
      updatedMatrix.permissionsByRole?.staff?.permissions
        .filter(p => p.effective)
        .map(p => `${p.resource}:${p.action_code}`)
        .slice(0, 10)
    );

    return {
      success: true,
      changes: results,
      updatedMatrix,
      summary: {
        total: results.length,
        success: results.filter(r => r.success).length,
        failed: failedChanges.length
      }
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
