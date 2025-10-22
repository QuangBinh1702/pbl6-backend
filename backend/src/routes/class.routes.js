const express = require('express');
const router = express.Router();
const classController = require('../controllers/class.controller');
const auth = require('../middlewares/auth.middleware');
const { checkPermission } = require('../middlewares/check_permission.middleware');

// Lấy tất cả lớp học (all users can view)
router.get('/', 
  auth, 
  checkPermission('class', 'READ'),
  classController.getAllClasses
);

// Lấy lớp học theo ID
router.get('/:id', 
  auth, 
  checkPermission('class', 'READ'),
  classController.getClassById
);

// Lấy danh sách lớp theo khoa
router.get('/faculty/:facultyId/classes', 
  auth,
  checkPermission('class', 'READ'),
  classController.getClassesByFaculty
);

// Lấy danh sách lớp theo khóa
router.get('/cohort/:cohortId/classes', 
  auth,
  checkPermission('class', 'READ'),
  classController.getClassesByCohort
);

// Lấy danh sách sinh viên trong lớp
router.get('/:id/students', 
  auth,
  checkPermission('class', 'READ'),
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
