const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendance.controller');
const auth = require('../middlewares/auth.middleware');
const role = require('../middlewares/role.middleware');

// Lấy tất cả điểm danh
router.get('/', auth, role(['admin', 'ctsv', 'teacher']), attendanceController.getAllAttendances);

// Lấy điểm danh theo ID
router.get('/:id', auth, attendanceController.getAttendanceById);

// Lấy điểm danh theo hoạt động
router.get('/activity/:activityId', auth, attendanceController.getAttendancesByActivity);

// Lấy điểm danh theo sinh viên
router.get('/student/:studentId', auth, attendanceController.getAttendancesByStudent);

// Tạo điểm danh mới
router.post('/', auth, role(['admin', 'ctsv', 'teacher', 'union']), attendanceController.createAttendance);

// Cập nhật điểm danh
router.put('/:id', auth, role(['admin', 'ctsv', 'teacher', 'union']), attendanceController.updateAttendance);

// Xóa điểm danh
router.delete('/:id', auth, role(['admin', 'ctsv', 'teacher', 'union']), attendanceController.deleteAttendance);

// Xác minh điểm danh
router.put('/:id/verify', auth, role(['admin', 'ctsv', 'teacher', 'union']), attendanceController.verifyAttendance);

// Thêm phản hồi
router.put('/:id/feedback', auth, attendanceController.addFeedback);

// Quét mã QR điểm danh
router.post('/scan-qr', auth, attendanceController.scanQRCode);

module.exports = router;


