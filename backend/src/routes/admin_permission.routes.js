const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middleware');
const { checkPermission } = require('../middlewares/check_permission.middleware');
const User = require('../models/user.model');
const UserRole = require('../models/user_role.model');
const Role = require('../models/role.model');
const OrgUnit = require('../models/org_unit.model');
const StaffProfile = require('../models/staff_profile.model');
const StudentProfile = require('../models/student_profile.model');
const {
  buildUserPermissionMatrix,
  getAvailablePermissionsForUser,
  grantPermissionToUser,
  revokePermissionFromUser,
  deletePermissionOverride,
  applyPermissionChanges
} = require('../utils/permission_admin.util');

/**
 * GET /api/admin/permissions/lookup-user/:identifier
 * Lookup user by username, student_number, or staff_number and get their permissions grouped by role
 * PROTECTED: Requires permission:update (admin only)
 */
router.get('/lookup-user/:identifier', auth, checkPermission('permission', 'update'), async (req, res) => {
  try {
    const { identifier } = req.params;

    // Try to find user by username first
    let user = await User.findOne({ username: identifier });
    
    // If not found, try student_number
    if (!user) {
      const StudentProfile = require('../models/student_profile.model');
      const studentProfile = await StudentProfile.findOne({ student_number: identifier });
      if (studentProfile) {
        user = await User.findById(studentProfile.user_id);
      }
    }
    
    // If still not found, try staff_number
    if (!user) {
      const staffProfile = await StaffProfile.findOne({ staff_number: identifier });
      if (staffProfile) {
        user = await User.findById(staffProfile.user_id);
      }
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng với username, MSSV, hoặc mã cán bộ này'
      });
    }

    const matrix = await buildUserPermissionMatrix(user._id);

    return res.json({
      success: true,
      data: matrix
    });
  } catch (error) {
    console.error('GET /lookup-user/:identifier error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/admin/permissions/users/:userId
 * View all permissions for a user with matrix view
 * Shows: roles, available actions, overrides, and final effective permissions
 * PROTECTED: Requires permission:update (admin only)
 */
router.get('/users/:userId', auth, checkPermission('permission', 'update'), async (req, res) => {
  try {
    const { userId } = req.params;
    const { orgUnitId } = req.query;

    const matrix = await buildUserPermissionMatrix(userId, orgUnitId || null);

    return res.json({
      success: true,
      data: matrix
    });
  } catch (error) {
    console.error('GET /users/:userId error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/admin/permissions/users/:userId/available
 * Get only available permissions for a user (based on their roles)
 * Used to show what permissions CAN be managed for this user
 * PROTECTED: Requires permission:update (admin only)
 */
router.get('/users/:userId/available', auth, checkPermission('permission', 'update'), async (req, res) => {
  try {
    const { userId } = req.params;
    const { orgUnitId } = req.query;

    const availableActions = await getAvailablePermissionsForUser(userId, orgUnitId || null);

    return res.json({
      success: true,
      data: {
        userId,
        availableActions,
        count: availableActions.length
      }
    });
  } catch (error) {
    console.error('GET /available error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/admin/permissions/users/:userId/grant/:actionId
 * Grant a specific permission to a user
 * PROTECTED: Requires permission:update (admin only)
 */
router.post('/users/:userId/grant/:actionId', auth, checkPermission('permission', 'update'), async (req, res) => {
  try {
    const { userId, actionId } = req.params;
    const { note } = req.body;
    const grantedByUserId = req.user._id; // Assuming auth middleware sets req.user

    const result = await grantPermissionToUser(userId, actionId, grantedByUserId, note);

    // Get updated matrix
    const updatedMatrix = await buildUserPermissionMatrix(userId);

    return res.json({
      success: true,
      data: {
        result,
        updatedMatrix
      }
    });
  } catch (error) {
    console.error('POST /grant error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/admin/permissions/users/:userId/revoke/:actionId
 * Revoke a specific permission from a user
 * PROTECTED: Requires permission:update (admin only)
 */
router.post('/users/:userId/revoke/:actionId', auth, checkPermission('permission', 'update'), async (req, res) => {
  try {
    const { userId, actionId } = req.params;
    const { note } = req.body;
    const grantedByUserId = req.user._id;

    const result = await revokePermissionFromUser(userId, actionId, grantedByUserId, note);

    // Get updated matrix
    const updatedMatrix = await buildUserPermissionMatrix(userId);

    return res.json({
      success: true,
      data: {
        result,
        updatedMatrix
      }
    });
  } catch (error) {
    console.error('POST /revoke error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * DELETE /api/admin/permissions/users/:userId/override/:actionId
 * Delete an override (revert to role-based permissions)
 * PROTECTED: Requires permission:update (admin only)
 */
router.delete('/users/:userId/override/:actionId', auth, checkPermission('permission', 'update'), async (req, res) => {
  try {
    const { userId, actionId } = req.params;

    const result = await deletePermissionOverride(userId, actionId);

    // Get updated matrix
    const updatedMatrix = await buildUserPermissionMatrix(userId);

    return res.json({
      success: true,
      data: {
        result,
        updatedMatrix
      }
    });
  } catch (error) {
    console.error('DELETE /override error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * PATCH /api/admin/permissions/users/:userId/apply-changes
 * Apply multiple permission changes at once
 * Body: {
 *   "changes": [
 *     { "actionId": "...", "desiredEffective": true, "note": "..." },
 *     { "actionId": "...", "desiredEffective": false, "note": "..." }
 *   ]
 * }
 */
router.patch('/users/:userId/apply-changes', auth, checkPermission('permission', 'update'), async (req, res) => {
  try {
    const { userId } = req.params;
    const { changes } = req.body;
    const grantedByUserId = req.user._id;

    if (!Array.isArray(changes)) {
      return res.status(400).json({
        success: false,
        message: 'changes must be an array'
      });
    }

    const result = await applyPermissionChanges(userId, changes, grantedByUserId);

    return res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('PATCH /apply-changes error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/admin/permissions/org-units
 * Get all org units for staff role assignment dropdown
 * PROTECTED: Requires permission:update (admin only)
 */
router.get('/org-units', auth, checkPermission('permission', 'update'), async (req, res) => {
  try {
    const orgUnits = await OrgUnit.find()
      .select('_id name description type')
      .sort({ name: 1 });

    return res.json({
      success: true,
      data: orgUnits
    });
  } catch (error) {
    console.error('GET /org-units error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/admin/permissions/positions
 * Get common positions for staff role assignment
 * PROTECTED: Requires permission:update (admin only)
 */
router.get('/positions', auth, checkPermission('permission', 'update'), async (req, res) => {
  try {
    // Return common positions in Vietnamese universities
    const positions = [
      'Chủ nhiệm',
      'Phó chủ nhiệm',
      'Trưởng ban',
      'Phó ban',
      'Thành viên',
      'Cố vấn',
      'Ủy viên',
      'Thư ký'
    ];

    return res.json({
      success: true,
      data: positions
    });
  } catch (error) {
    console.error('GET /positions error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/admin/permissions/users/:userId/add-role
 * Add a role to a user (e.g., add staff role to student)
 * Body: {
 *   "roleName": "staff",
 *   "orgUnitId": "...",  // required for staff role
 *   "position": "Chủ nhiệm"  // required for staff role
 * }
 * PROTECTED: Requires permission:update (admin only)
 */
router.post('/users/:userId/add-role', auth, checkPermission('permission', 'update'), async (req, res) => {
  try {
    const { userId } = req.params;
    const { roleName, orgUnitId, position } = req.body;

    // Validate user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Validate role exists
    const role = await Role.findOne({ name: roleName });
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    // Staff role requires org_unit_id and position
    if (roleName === 'staff') {
      if (!orgUnitId) {
        return res.status(400).json({
          success: false,
          message: 'orgUnitId is required for staff role'
        });
      }
      if (!position) {
        return res.status(400).json({
          success: false,
          message: 'position is required for staff role'
        });
      }
    }

    // Validate org unit exists if provided
    if (orgUnitId) {
      const orgUnit = await OrgUnit.findById(orgUnitId);
      if (!orgUnit) {
        return res.status(404).json({
          success: false,
          message: 'Org unit not found'
        });
      }
    }

    // Check if user already has this role with this org unit
    const existingRole = await UserRole.findOne({
      user_id: userId,
      role_id: role._id,
      org_unit_id: orgUnitId || null
    });

    if (existingRole) {
      return res.status(400).json({
        success: false,
        message: 'User already has this role'
      });
    }

    // Add role to user
    const newUserRole = new UserRole({
      user_id: userId,
      role_id: role._id,
      org_unit_id: orgUnitId || null
    });

    await newUserRole.save();

    // If staff role, create/update staff profile
    if (roleName === 'staff') {
      let staffProfile = await StaffProfile.findOne({ user_id: userId });
      
      if (staffProfile) {
        // Update existing profile
        staffProfile.org_unit_id = orgUnitId;
        staffProfile.position = position;
        await staffProfile.save();
      } else {
        // Create new profile
        const staffNumber = `STAFF${Date.now()}`; // Generate unique staff number
        staffProfile = new StaffProfile({
          user_id: userId,
          staff_number: staffNumber,
          full_name: user.name || user.username,
          org_unit_id: orgUnitId,
          position: position
        });
        await staffProfile.save();
      }
    }

    // Return updated permission matrix
    const updatedMatrix = await buildUserPermissionMatrix(userId);

    return res.json({
      success: true,
      message: `Added ${roleName} role to user`,
      data: {
        userRole: newUserRole,
        updatedMatrix
      }
    });
  } catch (error) {
    console.error('POST /add-role error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
