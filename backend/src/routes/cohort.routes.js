const express = require('express');
const router = express.Router();
const cohortController = require('../controllers/cohort.controller');
const auth = require('../middlewares/auth.middleware');
const { checkPermission } = require('../middlewares/check_permission.middleware');

// Lấy tất cả khóa học (public)
router.get('/', 
  cohortController.getAllCohorts
);

// Lấy khóa học theo ID (public)
router.get('/:id', 
  cohortController.getCohortById
);

// Lấy khóa học theo năm (public)
router.get('/year/:year', 
  cohortController.getCohortByYear
);

// Lấy danh sách lớp của khóa (public)
router.get('/:id/classes', 
  cohortController.getCohortClasses
);

// Lấy danh sách sinh viên của khóa (public)
router.get('/:id/students', 
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
