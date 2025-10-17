const express = require('express');
const router = express.Router();
const registrationController = require('../controllers/registration.controller');
const auth = require('../middlewares/auth.middleware');
const role = require('../middlewares/role.middleware');

// Lấy tất cả đăng ký
router.get('/', auth, role(['admin', 'ctsv', 'teacher']), registrationController.getAllRegistrations);

// Lấy đăng ký của tôi
router.get('/my-registrations', auth, registrationController.getMyRegistrations);

// Lấy đăng ký theo hoạt động
router.get('/activity/:activityId', auth, registrationController.getRegistrationsByActivity);

// Lấy đăng ký theo người dùng
router.get('/user/:userId', auth, registrationController.getRegistrationsByUser);

// Lấy đăng ký theo ID
router.get('/:id', auth, registrationController.getRegistrationById);

// Tạo đăng ký mới
router.post('/', auth, registrationController.createRegistration);

// Cập nhật đăng ký
router.put('/:id', auth, registrationController.updateRegistration);

// Xóa đăng ký
router.delete('/:id', auth, registrationController.deleteRegistration);

// Phê duyệt đăng ký
router.put('/:id/approve', auth, role(['admin', 'ctsv', 'teacher', 'union']), registrationController.approveRegistration);

// Từ chối đăng ký
router.put('/:id/reject', auth, role(['admin', 'ctsv', 'teacher', 'union']), registrationController.rejectRegistration);

// Đánh dấu đã tham dự
router.put('/:id/attend', auth, role(['admin', 'ctsv', 'teacher', 'union']), registrationController.markAttended);

// Xác nhận đăng ký
router.put('/:id/confirm', auth, role(['admin', 'ctsv', 'teacher', 'union']), registrationController.confirmRegistration);

module.exports = router;


