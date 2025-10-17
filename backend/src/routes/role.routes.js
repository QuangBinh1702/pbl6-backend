const express = require('express');
const router = express.Router();
const roleController = require('../controllers/role.controller');
const auth = require('../middlewares/auth.middleware');
const role = require('../middlewares/role.middleware');

// Lấy tất cả vai trò
router.get('/', auth, role(['admin', 'ctsv']), roleController.getAllRoles);

// Lấy vai trò theo ID
router.get('/:id', auth, role(['admin', 'ctsv']), roleController.getRoleById);

// Lấy vai trò theo tên
router.get('/name/:name', auth, role(['admin', 'ctsv']), roleController.getRoleByName);

// Lấy người dùng theo vai trò
router.get('/:id/users', auth, role(['admin', 'ctsv']), roleController.getUsersByRole);

// Tạo vai trò mới
router.post('/', auth, role(['admin']), roleController.createRole);

// Cập nhật vai trò
router.put('/:id', auth, role(['admin']), roleController.updateRole);

// Xóa vai trò
router.delete('/:id', auth, role(['admin']), roleController.deleteRole);

// Thêm quyền vào vai trò
router.post('/:id/permissions', auth, role(['admin']), roleController.addPermission);

// Xóa quyền khỏi vai trò
router.delete('/:id/permissions', auth, role(['admin']), roleController.removePermission);

module.exports = router;


