const express = require('express');
const router = express.Router();
const classController = require('../controllers/class.controller');
const auth = require('../middlewares/auth.middleware');
const { checkPermission } = require('../middlewares/check_permission.middleware');

// Lấy tất cả lớp học (public)
router.get('/', 
  classController.getAllClasses
);

// Lấy lớp học theo ID (public)
router.get('/:id', 
  classController.getClassById
);

// Lấy danh sách lớp theo khoa (public)
router.get('/faculty/:facultyId/classes', 
  classController.getClassesByFaculty
);

// Lấy danh sách lớp theo khóa (public)
router.get('/cohort/:cohortId/classes', 
  classController.getClassesByCohort
);

// Lấy danh sách sinh viên trong lớp (public)
router.get('/:id/students', 
  classController.getClassStudents
);

// Tạo lớp học mới (admin/staff)
router.post('/', 
  auth, 
  checkPermission('class', 'CREATE'),
  classController.createClass
);

// Cập nhật lớp học (admin/staff)
router.put('/:id', 
  auth, 
  checkPermission('class', 'UPDATE'),
  classController.updateClass
);

// Xóa lớp học (admin only)
router.delete('/:id', 
  auth, 
  checkPermission('class', 'DELETE'),
  classController.deleteClass
);

module.exports = router;
