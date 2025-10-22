const express = require('express');
const router = express.Router();
const studentCohortController = require('../controllers/student_cohort.controller');
const auth = require('../middlewares/auth.middleware');
const { checkPermission } = require('../middlewares/check_permission.middleware');

// Lấy tất cả sinh viên-khóa (admin/staff/teacher)
router.get('/', 
  auth, 
  checkPermission('student_cohort', 'READ'),
  studentCohortController.getAllStudentCohorts
);

// Lấy sinh viên-khóa theo ID
router.get('/:id', 
  auth, 
  checkPermission('student_cohort', 'READ'),
  studentCohortController.getStudentCohortById
);

// Lấy sinh viên-khóa theo sinh viên
router.get('/student/:studentId', 
  auth, 
  studentCohortController.getStudentCohortsByStudent
);

// Lấy sinh viên-khóa theo khóa
router.get('/cohort/:cohortId', 
  auth, 
  checkPermission('student_cohort', 'READ'),
  studentCohortController.getStudentCohortsByCohort
);

// Tạo sinh viên-khóa mới (admin/staff)
router.post('/', 
  auth, 
  checkPermission('student_cohort', 'CREATE'),
  studentCohortController.createStudentCohort
);

// Cập nhật sinh viên-khóa (admin/staff) - if needed
router.put('/:id', 
  auth, 
  checkPermission('student_cohort', 'CREATE'),
  studentCohortController.updateStudentCohort
);

// Xóa sinh viên-khóa (admin/staff)
router.delete('/:id', 
  auth, 
  checkPermission('student_cohort', 'DELETE'),
  studentCohortController.deleteStudentCohort
);

module.exports = router;
