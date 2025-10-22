const express = require('express');
const router = express.Router();
const roleController = require('../controllers/role.controller');
const auth = require('../middlewares/auth.middleware');
const { checkPermission } = require('../middlewares/check_permission.middleware');

// Lấy tất cả vai trò (admin/staff can view)
router.get('/', 
  auth, 
  checkPermission('role', 'READ'),
  roleController.getAllRoles
);

// Lấy vai trò theo ID
router.get('/:id', 
  auth, 
  checkPermission('role', 'READ'),
  roleController.getRoleById
);

// Lấy vai trò theo tên
router.get('/name/:name', 
  auth, 
  checkPermission('role', 'READ'),
  roleController.getRoleByName
);

// Lấy người dùng theo vai trò
router.get('/:id/users', 
  auth, 
  checkPermission('role', 'READ'),
  roleController.getUsersByRole
);

// Tạo vai trò mới (admin only)
router.post('/', 
  auth, 
  checkPermission('role', 'CREATE'),
  roleController.createRole
);

// Cập nhật vai trò (admin only)
router.put('/:id', 
  auth, 
  checkPermission('role', 'UPDATE'),
  roleController.updateRole
);

// Xóa vai trò (admin only)
router.delete('/:id', 
  auth, 
  checkPermission('role', 'DELETE'),
  roleController.deleteRole
);

// Thêm quyền vào vai trò (admin only)
router.post('/:id/permissions', 
  auth, 
  checkPermission('role', 'UPDATE'),
  roleController.addPermission
);

// Xóa quyền khỏi vai trò (admin only)
router.delete('/:id/permissions', 
  auth, 
  checkPermission('role', 'UPDATE'),
  roleController.removePermission
);

module.exports = router;
