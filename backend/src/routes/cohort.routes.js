const express = require('express');
const router = express.Router();
const cohortController = require('../controllers/cohort.controller');
const auth = require('../middlewares/auth.middleware');
const { checkPermission } = require('../middlewares/check_permission.middleware');

// Lấy tất cả khóa học (all users can view)
router.get('/', 
  auth, 
  checkPermission('cohort', 'READ'),
  cohortController.getAllCohorts
);

// Lấy khóa học theo ID
router.get('/:id', 
  auth, 
  checkPermission('cohort', 'READ'),
  cohortController.getCohortById
);

// Lấy khóa học theo năm
router.get('/year/:year', 
  auth, 
  checkPermission('cohort', 'READ'),
  cohortController.getCohortByYear
);

// Lấy danh sách lớp của khóa
router.get('/:id/classes', 
  auth, 
  checkPermission('cohort', 'READ'),
  cohortController.getCohortClasses
);

// Lấy danh sách sinh viên của khóa
router.get('/:id/students', 
  auth, 
  checkPermission('cohort', 'READ'),
  cohortController.getCohortStudents
);

// Tạo khóa học mới (admin/staff)
router.post('/', 
  auth, 
  checkPermission('cohort', 'CREATE'),
  cohortController.createCohort
);

// Cập nhật khóa học (admin/staff)
router.put('/:id', 
  auth, 
  checkPermission('cohort', 'UPDATE'),
  cohortController.updateCohort
);

// Xóa khóa học (admin only)
router.delete('/:id', 
  auth, 
  checkPermission('cohort', 'DELETE'),
  cohortController.deleteCohort
);

module.exports = router;
