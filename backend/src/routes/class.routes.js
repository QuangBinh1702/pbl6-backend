const express = require('express');
const router = express.Router();
const classController = require('../controllers/class.controller');
const auth = require('../middlewares/auth.middleware');
const role = require('../middlewares/role.middleware');

// Lấy tất cả lớp học
router.get('/', auth, classController.getAllClasses);

// Lấy lớp học theo ID
router.get('/:id', auth, classController.getClassById);

// Lấy danh sách lớp theo khoa
router.get('/faculty/:facultyId/classes', auth, classController.getClassesByFaculty);

// Lấy danh sách lớp theo khóa
router.get('/cohort/:cohortId/classes', auth, classController.getClassesByCohort);

// Lấy danh sách sinh viên trong lớp
router.get('/:id/students', auth, classController.getClassStudents);

// Tạo lớp học mới
router.post('/', auth, role(['admin', 'ctsv']), classController.createClass);

// Cập nhật lớp học
router.put('/:id', auth, role(['admin', 'ctsv']), classController.updateClass);

// Xóa lớp học
router.delete('/:id', auth, role(['admin', 'ctsv']), classController.deleteClass);

module.exports = router;


