const UserRole = require('../models/user_role.model');
const RoleAction = require('../models/role_action.model');
const UserActionOverride = require('../models/user_action_override.model');
const Action = require('../models/action.model');
const StudentProfile = require('../models/student_profile.model');

/**
 * Check if user has permission to perform an action on a resource
 * 
 * Flow:
 * 1. Get user's roles from user_role
 * 2. Get actions from role_action for those roles
 * 3. Check user_action_override (override takes precedence)
 * 4. Return true if allowed, false otherwise
 * 
 * @param {string|ObjectId} userId - User ID
 * @param {string} resource - Resource name (e.g., 'activity', 'student')
 * @param {string} actionCode - Action code (e.g., 'VIEW', 'CREATE', 'UPDATE', 'DELETE')
 * @param {string|ObjectId} orgUnitId - Optional: specific org unit context
 * @returns {Promise<boolean>} - true if user has permission, false otherwise
 */
async function hasPermission(userId, resource, actionCode, orgUnitId = null) {
  try {
    // Find the action by resource and action code
    const action = await Action.findOne({ 
      resource, 
      action_code: actionCode.toUpperCase(),
      is_active: true 
    });

    if (!action) {
      console.log(`Action not found: ${resource}.${actionCode}`);
      return false;
    }

    // Step 1: Check user_action_override first (highest priority)
    const override = await UserActionOverride.checkOverride(userId, action._id);
    
    if (override !== null) {
      // Override exists: true = granted, false = revoked
      return override;
    }

    // Step 2: Check role-based permissions
    // Get user's roles (scoped by orgUnitId if provided)
    let userRoles = await UserRole.getRolesForUser(userId, orgUnitId);
    
    // Fallback: if requesting with orgUnitId but no roles found, try global roles (orgUnitId = null)
    if ((!userRoles || userRoles.length === 0) && orgUnitId) {
      userRoles = await UserRole.getRolesForUser(userId, null);
    }
    
    if (!userRoles || userRoles.length === 0) {
      console.log(`No roles found for user: ${userId}`);
      return false;
    }

    // Check if any of the user's roles has this action
    for (const userRole of userRoles) {
      if (!userRole.role_id) continue;

      const roleActions = await RoleAction.find({ 
        role_id: userRole.role_id._id,
        action_id: action._id 
      });

      if (roleActions && roleActions.length > 0) {
        return true; // Found at least one role with this action
      }
    }

    return false; // No permission found
  } catch (error) {
    console.error('Error in hasPermission:', error);
    return false;
  }
}

/**
 * Get all actions a user can perform on a resource
 * 
 * @param {string|ObjectId} userId - User ID
 * @param {string} resource - Resource name
 * @param {string|ObjectId} orgUnitId - Optional: specific org unit context
 * @returns {Promise<Array<string>>} - Array of action codes the user can perform
 */
async function getUserActions(userId, resource, orgUnitId = null) {
  try {
    const actionsSet = new Set();

    // Step 1: Get actions from roles
    const userRoles = await UserRole.getRolesForUser(userId, orgUnitId);
    
    if (userRoles && userRoles.length > 0) {
      for (const userRole of userRoles) {
        if (!userRole.role_id) continue;

        const roleActions = await RoleAction.find({ 
          role_id: userRole.role_id._id 
        }).populate('action_id');

        for (const roleAction of roleActions) {
          if (roleAction.action_id && 
              roleAction.action_id.resource === resource &&
              roleAction.action_id.is_active) {
            actionsSet.add(roleAction.action_id.action_code);
          }
        }
      }
    }

    // Step 2: Apply user overrides (can add or remove actions)
    const overrides = await UserActionOverride.getOverridesForUser(userId);
    
    for (const override of overrides) {
      if (override.action_id && override.action_id.resource === resource) {
        if (override.is_granted) {
          actionsSet.add(override.action_id.action_code);
        } else {
          actionsSet.delete(override.action_id.action_code);
        }
      }
    }

    return Array.from(actionsSet);
  } catch (error) {
    console.error('Error in getUserActions:', error);
    return [];
  }
}

/**
 * Check if a student is a class monitor
 * 
 * @param {string|ObjectId} userId - User ID
 * @returns {Promise<boolean>} - true if user is a class monitor, false otherwise
 */
async function isClassMonitor(userId) {
  try {
    const studentProfile = await StudentProfile.findOne({ 
      user_id: userId,
      isClassMonitor: true 
    });

    return !!studentProfile;
  } catch (error) {
    console.error('Error in isClassMonitor:', error);
    return false;
  }
}

/**
 * Get all permissions for a user (grouped by resource)
 * 
 * @param {string|ObjectId} userId - User ID
 * @param {string|ObjectId} orgUnitId - Optional: specific org unit context
 * @returns {Promise<Object>} - Object with resources as keys and arrays of action codes as values
 */
async function getAllUserPermissions(userId, orgUnitId = null) {
  try {
    const permissionsByResource = {};

    // Get all actions from roles
    const userRoles = await UserRole.getRolesForUser(userId, orgUnitId);
    
    if (userRoles && userRoles.length > 0) {
      for (const userRole of userRoles) {
        if (!userRole.role_id) continue;

        const roleActions = await RoleAction.find({ 
          role_id: userRole.role_id._id 
        }).populate('action_id');

        for (const roleAction of roleActions) {
          if (roleAction.action_id && roleAction.action_id.is_active) {
            const resource = roleAction.action_id.resource;
            if (!permissionsByResource[resource]) {
              permissionsByResource[resource] = new Set();
            }
            permissionsByResource[resource].add(roleAction.action_id.action_code);
          }
        }
      }
    }

    // Apply user overrides
    const overrides = await UserActionOverride.getOverridesForUser(userId);
    
    for (const override of overrides) {
      if (override.action_id) {
        const resource = override.action_id.resource;
        if (!permissionsByResource[resource]) {
          permissionsByResource[resource] = new Set();
        }
        
        if (override.is_granted) {
          permissionsByResource[resource].add(override.action_id.action_code);
        } else {
          permissionsByResource[resource].delete(override.action_id.action_code);
        }
      }
    }

    // Convert Sets to Arrays
    const result = {};
    for (const [resource, actionsSet] of Object.entries(permissionsByResource)) {
      result[resource] = Array.from(actionsSet);
    }

    return result;
  } catch (error) {
    console.error('Error in getAllUserPermissions:', error);
    return {};
  }
}

/**
 * Check if user has any of the specified permissions
 * 
 * @param {string|ObjectId} userId - User ID
 * @param {Array<{resource: string, action: string}>} permissions - Array of permission requirements
 * @param {string|ObjectId} orgUnitId - Optional: specific org unit context
 * @returns {Promise<boolean>} - true if user has at least one of the permissions
 */
async function hasAnyPermission(userId, permissions, orgUnitId = null) {
  try {
    for (const perm of permissions) {
      const allowed = await hasPermission(userId, perm.resource, perm.action, orgUnitId);
      if (allowed) return true;
    }
    return false;
  } catch (error) {
    console.error('Error in hasAnyPermission:', error);
    return false;
  }
}

/**
 * Check if user has all of the specified permissions
 * 
 * @param {string|ObjectId} userId - User ID
 * @param {Array<{resource: string, action: string}>} permissions - Array of permission requirements
 * @param {string|ObjectId} orgUnitId - Optional: specific org unit context
 * @returns {Promise<boolean>} - true if user has all of the permissions
 */
async function hasAllPermissions(userId, permissions, orgUnitId = null) {
  try {
    for (const perm of permissions) {
      const allowed = await hasPermission(userId, perm.resource, perm.action, orgUnitId);
      if (!allowed) return false;
    }
    return true;
  } catch (error) {
    console.error('Error in hasAllPermissions:', error);
    return false;
  }
}

module.exports = {
  hasPermission,
  getUserActions,
  isClassMonitor,
  getAllUserPermissions,
  hasAnyPermission,
  hasAllPermissions
};

