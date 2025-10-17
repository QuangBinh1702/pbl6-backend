const express = require('express');
const router = express.Router();
const studentProfileController = require('../controllers/student_profile.controller');
const auth = require('../middlewares/auth.middleware');
const role = require('../middlewares/role.middleware');

// Lấy tất cả hồ sơ sinh viên
router.get('/', auth, role(['admin', 'ctsv', 'teacher']), studentProfileController.getAllStudentProfiles);

// Lấy hồ sơ sinh viên theo ID
router.get('/:id', auth, studentProfileController.getStudentProfileById);

// Lấy hồ sơ sinh viên theo User ID
router.get('/user/:userId', auth, studentProfileController.getStudentProfileByUserId);

// Lấy hồ sơ sinh viên theo mã sinh viên
router.get('/student-number/:studentNumber', auth, studentProfileController.getStudentProfileByStudentNumber);

// Lấy danh sách sinh viên theo lớp
router.get('/class/:classId/students', auth, studentProfileController.getStudentsByClass);

// Tạo hồ sơ sinh viên mới
router.post('/', auth, role(['admin', 'ctsv']), studentProfileController.createStudentProfile);

// Cập nhật hồ sơ sinh viên
router.put('/:id', auth, studentProfileController.updateStudentProfile);

// Xóa hồ sơ sinh viên
router.delete('/:id', auth, role(['admin', 'ctsv']), studentProfileController.deleteStudentProfile);

// Đặt làm lớp trưởng
router.put('/:id/set-monitor', auth, role(['admin', 'ctsv', 'teacher']), studentProfileController.setClassMonitor);

// Hủy lớp trưởng
router.put('/:id/remove-monitor', auth, role(['admin', 'ctsv', 'teacher']), studentProfileController.removeClassMonitor);

module.exports = router;


