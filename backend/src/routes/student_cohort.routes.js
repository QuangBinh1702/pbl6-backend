const express = require('express');
const router = express.Router();
const studentCohortController = require('../controllers/student_cohort.controller');
const auth = require('../middlewares/auth.middleware');
const role = require('../middlewares/role.middleware');

// Lấy tất cả sinh viên-khóa
router.get('/', auth, role(['admin', 'ctsv', 'teacher']), studentCohortController.getAllStudentCohorts);

// Lấy sinh viên-khóa theo ID
router.get('/:id', auth, studentCohortController.getStudentCohortById);

// Lấy sinh viên-khóa theo sinh viên
router.get('/student/:studentId', auth, studentCohortController.getStudentCohortsByStudent);

// Lấy sinh viên-khóa theo khóa
router.get('/cohort/:cohortId', auth, studentCohortController.getStudentCohortsByCohort);

// Tạo sinh viên-khóa mới
router.post('/', auth, role(['admin', 'ctsv']), studentCohortController.createStudentCohort);

// Cập nhật sinh viên-khóa
router.put('/:id', auth, role(['admin', 'ctsv']), studentCohortController.updateStudentCohort);

// Xóa sinh viên-khóa
router.delete('/:id', auth, role(['admin', 'ctsv']), studentCohortController.deleteStudentCohort);

module.exports = router;


