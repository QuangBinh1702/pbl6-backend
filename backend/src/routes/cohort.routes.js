const express = require('express');
const router = express.Router();
const cohortController = require('../controllers/cohort.controller');
const auth = require('../middlewares/auth.middleware');
const role = require('../middlewares/role.middleware');

// Lấy tất cả khóa học
router.get('/', auth, cohortController.getAllCohorts);

// Lấy khóa học theo ID
router.get('/:id', auth, cohortController.getCohortById);

// Lấy khóa học theo năm
router.get('/year/:year', auth, cohortController.getCohortByYear);

// Lấy danh sách lớp của khóa
router.get('/:id/classes', auth, cohortController.getCohortClasses);

// Lấy danh sách sinh viên của khóa
router.get('/:id/students', auth, cohortController.getCohortStudents);

// Tạo khóa học mới
router.post('/', auth, role(['admin', 'ctsv']), cohortController.createCohort);

// Cập nhật khóa học
router.put('/:id', auth, role(['admin', 'ctsv']), cohortController.updateCohort);

// Xóa khóa học
router.delete('/:id', auth, role(['admin', 'ctsv']), cohortController.deleteCohort);

module.exports = router;


