const express = require('express');
const router = express.Router();
const permissionController = require('../controllers/permission.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { checkPermission } = require('../middlewares/check_permission.middleware');

// ============================================
// PERMISSION MANAGEMENT ROUTES
// ============================================

/**
 * @route   GET /api/permissions
 * @desc    Lấy tất cả permissions
 * @query   is_active (boolean), search (string)
 * @access  Private (cần đăng nhập)
 */
router.get(
  '/',
  authMiddleware,
  permissionController.getAllPermissions
);

/**
 * @route   GET /api/permissions/:id
 * @desc    Lấy chi tiết một permission
 * @access  Private
 */
router.get(
  '/:id',
  authMiddleware,
  permissionController.getPermissionById
);

/**
 * @route   POST /api/permissions
 * @desc    Tạo permission mới
 * @body    { name_per, description, resource, action, details }
 * @access  Private (Admin only - cần permission quản lý hệ thống)
 */
router.post(
  '/',
  authMiddleware,
  // Uncomment khi đã có permission system hoàn chỉnh
  // checkPermission('SYSTEM_MANAGEMENT', 'CREATE'),
  permissionController.createPermission
);

/**
 * @route   PUT /api/permissions/:id
 * @desc    Cập nhật permission
 * @access  Private (Admin only)
 */
router.put(
  '/:id',
  authMiddleware,
  // checkPermission('SYSTEM_MANAGEMENT', 'UPDATE'),
  permissionController.updatePermission
);

/**
 * @route   DELETE /api/permissions/:id
 * @desc    Xóa permission (soft delete)
 * @access  Private (Admin only)
 */
router.delete(
  '/:id',
  authMiddleware,
  // checkPermission('SYSTEM_MANAGEMENT', 'DELETE'),
  permissionController.deletePermission
);

/**
 * @route   POST /api/permissions/:id/details
 * @desc    Thêm action detail vào permission
 * @body    { action_name, action_code, check_action, description }
 * @access  Private (Admin only)
 */
router.post(
  '/:id/details',
  authMiddleware,
  // checkPermission('SYSTEM_MANAGEMENT', 'UPDATE'),
  permissionController.addPermissionDetail
);

// ============================================
// USER PERMISSION ROUTES
// ============================================

/**
 * @route   GET /api/permissions/users/:userId
 * @desc    Lấy tất cả permissions của user
 * @query   onlyValid (boolean) - mặc định true
 * @access  Private
 */
router.get(
  '/users/:userId',
  authMiddleware,
  permissionController.getUserPermissions
);

/**
 * @route   POST /api/permissions/users/:userId/grant/:permissionId
 * @desc    Gán permission cho user
 * @body    { expires_at, notes }
 * @access  Private (Admin only)
 */
router.post(
  '/users/:userId/grant/:permissionId',
  authMiddleware,
  // checkPermission('USER_MANAGEMENT', 'GRANT_PERMISSION'),
  permissionController.grantPermissionToUser
);

/**
 * @route   POST /api/permissions/users/:userId/revoke/:permissionId
 * @desc    Thu hồi permission của user
 * @access  Private (Admin only)
 */
router.post(
  '/users/:userId/revoke/:permissionId',
  authMiddleware,
  // checkPermission('USER_MANAGEMENT', 'REVOKE_PERMISSION'),
  permissionController.revokePermissionFromUser
);

/**
 * @route   GET /api/permissions/users/:userId/check/:permissionId
 * @desc    Kiểm tra user có permission không
 * @access  Private
 */
router.get(
  '/users/:userId/check/:permissionId',
  authMiddleware,
  permissionController.checkUserPermission
);

// ============================================
// MAINTENANCE ROUTES
// ============================================

/**
 * @route   POST /api/permissions/cleanup
 * @desc    Cleanup expired permissions
 * @access  Private (Admin only)
 */
router.post(
  '/cleanup',
  authMiddleware,
  // checkPermission('SYSTEM_MANAGEMENT', 'MAINTENANCE'),
  permissionController.cleanupExpiredPermissions
);

module.exports = router;


