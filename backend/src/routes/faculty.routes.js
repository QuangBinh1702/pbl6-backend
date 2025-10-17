const express = require('express');
const router = express.Router();
const facultyController = require('../controllers/faculty.controller');
const auth = require('../middlewares/auth.middleware');
const role = require('../middlewares/role.middleware');

// Lấy tất cả khoa
router.get('/', auth, facultyController.getAllFaculties);

// Lấy khoa theo ID
router.get('/:id', auth, facultyController.getFacultyById);

// Lấy danh sách lớp của khoa
router.get('/:id/classes', auth, facultyController.getFacultyClasses);

// Tạo khoa mới
router.post('/', auth, role(['admin', 'ctsv']), facultyController.createFaculty);

// Cập nhật khoa
router.put('/:id', auth, role(['admin', 'ctsv']), facultyController.updateFaculty);

// Xóa khoa
router.delete('/:id', auth, role(['admin', 'ctsv']), facultyController.deleteFaculty);

module.exports = router;


