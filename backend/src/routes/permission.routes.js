const express = require('express');
const router = express.Router();
const permissionController = require('../controllers/permission.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { checkPermission } = require('../middlewares/check_permission.middleware');

// ============================================
// PERMISSION & ACTION ROUTES
// ============================================

/**
 * @route   GET /api/permissions
 * @desc    Get all permissions
 * @access  Private
 */
router.get('/',
  authMiddleware,
  permissionController.getAllPermissions
);

/**
 * @route   POST /api/permissions
 * @desc    Create new permission
 * @access  Private (Admin only)
 */
router.post('/',
  authMiddleware,
  checkPermission('permission', 'CREATE'),
  permissionController.createPermission
);

/**
 * @route   GET /api/permissions/actions
 * @desc    Get all actions
 * @query   resource, is_active
 * @access  Private
 */
router.get('/actions',
  authMiddleware,
  permissionController.getAllActions
);

/**
 * @route   POST /api/permissions/actions
 * @desc    Create new action
 * @access  Private (Admin only)
 */
router.post('/actions',
  authMiddleware,
  checkPermission('permission', 'CREATE'),
  permissionController.createAction
);

/**
 * @route   GET /api/permissions/actions/:resource
 * @desc    Get actions by resource
 * @access  Private
 */
router.get('/actions/:resource',
  authMiddleware,
  permissionController.getActionsByResource
);

// ============================================
// USER PERMISSION ROUTES
// ============================================

/**
 * @route   GET /api/permissions/users/:userId/permissions
 * @desc    Get all permissions of a user
 * @access  Private
 */
router.get('/users/:userId/permissions',
  authMiddleware,
  permissionController.getUserPermissions
);

/**
 * @route   GET /api/permissions/users/:userId/actions/:resource
 * @desc    Get user actions for a specific resource
 * @access  Private
 */
router.get('/users/:userId/actions/:resource',
  authMiddleware,
  permissionController.getUserActionsForResource
);

/**
 * @route   POST /api/permissions/users/:userId/check-permission
 * @desc    Check if user has a specific permission
 * @body    { resource, action }
 * @access  Private
 */
router.post('/users/:userId/check-permission',
  authMiddleware,
  permissionController.checkUserPermission
);

// ============================================
// ROLE MANAGEMENT ROUTES
// ============================================

/**
 * @route   GET /api/permissions/roles
 * @desc    Get all roles
 * @access  Private
 */
router.get('/roles',
  authMiddleware,
  permissionController.getAllRoles
);

/**
 * @route   GET /api/permissions/roles/:roleId/actions
 * @desc    Get actions of a role
 * @access  Private
 */
router.get('/roles/:roleId/actions',
  authMiddleware,
  permissionController.getRoleActions
);

/**
 * @route   POST /api/permissions/roles/:roleId/actions
 * @desc    Add action to role
 * @body    { action_id }
 * @access  Private (Admin only)
 */
router.post('/roles/:roleId/actions',
  authMiddleware,
  checkPermission('role', 'UPDATE'),
  permissionController.addActionToRole
);

/**
 * @route   DELETE /api/permissions/roles/:roleId/actions/:actionId
 * @desc    Remove action from role
 * @access  Private (Admin only)
 */
router.delete('/roles/:roleId/actions/:actionId',
  authMiddleware,
  checkPermission('role', 'UPDATE'),
  permissionController.removeActionFromRole
);

// ============================================
// USER PERMISSION MANAGEMENT ROUTES
// ============================================

/**
 * @route   GET /api/permissions/users/username/:username
 * @desc    Get user info and permissions by username
 * @access  Private (Admin only)
 */
router.get('/users/username/:username',
  authMiddleware,
  checkPermission('user', 'READ'),
  permissionController.getUserByUsername
);

/**
 * @route   PUT /api/permissions/users/:userId/permissions
 * @desc    Update user permissions (bulk update actions)
 * @body    { actions: [{ action_id, is_granted }] }
 * @access  Private (Admin only)
 */
router.put('/users/:userId/permissions',
  authMiddleware,
  checkPermission('user', 'UPDATE'),
  permissionController.updateUserPermissions
);

/**
 * @route   POST /api/permissions/users/:userId/assign-org-role
 * @desc    Assign organization role to student
 * @body    { role_id, org_unit_id, position }
 * @access  Private (Admin only)
 */
router.post('/users/:userId/assign-org-role',
  authMiddleware,
  checkPermission('user', 'UPDATE'),
  permissionController.assignOrgRoleToStudent
);

module.exports = router;

