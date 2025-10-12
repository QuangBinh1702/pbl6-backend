const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');

const auth = require('../middlewares/auth.middleware');
const role = require('../middlewares/role.middleware');
// Quản lý tài khoản
router.get('/', auth, role(['admin', 'ctsv']), userController.getAllUsers); // Lấy danh sách người dùng
router.get('/:id', auth, userController.getUserById); // Lấy chi tiết người dùng
router.post('/', auth, role(['admin', 'ctsv']), userController.createUser); // Tạo tài khoản (admin, ctsv)
router.put('/:id', auth, userController.updateUser); // Cập nhật thông tin
router.delete('/:id', auth, role(['admin', 'ctsv']), userController.deleteUser); // Xóa tài khoản
router.put('/:id/lock', auth, role(['admin', 'ctsv']), userController.lockUser); // Khóa tài khoản
router.put('/:id/unlock', auth, role(['admin', 'ctsv']), userController.unlockUser); // Mở khóa tài khoản
router.put('/:id/role', auth, role(['admin', 'ctsv']), userController.updateRole); // Phân quyền
// Quản lý minh chứng ngoài trường
router.get('/:id/evidences', auth, userController.getUserEvidences);
// ...

module.exports = router;
