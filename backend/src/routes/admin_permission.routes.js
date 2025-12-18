const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middleware');
const { checkPermission } = require('../middlewares/check_permission.middleware');
const {
  buildUserPermissionMatrix,
  getAvailablePermissionsForUser,
  grantPermissionToUser,
  revokePermissionFromUser,
  deletePermissionOverride,
  applyPermissionChanges
} = require('../utils/permission_admin.util');

/**
 * GET /api/admin/permissions/users/:userId
 * View all permissions for a user with matrix view
 * Shows: roles, available actions, overrides, and final effective permissions
 */
router.get('/users/:userId', async (req, res) => {
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
 */
router.get('/users/:userId/available', async (req, res) => {
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
 */
router.post('/users/:userId/grant/:actionId', async (req, res) => {
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
 */
router.post('/users/:userId/revoke/:actionId', async (req, res) => {
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
 */
router.delete('/users/:userId/override/:actionId', async (req, res) => {
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
router.patch('/users/:userId/apply-changes', auth, async (req, res) => {
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

module.exports = router;
