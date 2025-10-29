const express = require('express');
const router = express.Router();
const facultyController = require('../controllers/faculty.controller');
const auth = require('../middlewares/auth.middleware');
const { checkPermission } = require('../middlewares/check_permission.middleware');

// Lấy tất cả khoa (public)
router.get('/', 
  facultyController.getAllFaculties
);

// Lấy khoa theo ID (public)
router.get('/:id', 
  facultyController.getFacultyById
);

// Lấy danh sách lớp của khoa (public)
router.get('/:id/classes', 
  facultyController.getFacultyClasses
);

// Tạo khoa mới (admin/staff)
router.post('/', 
  auth, 
  checkPermission('faculty', 'CREATE'),
  facultyController.createFaculty
);

// Cập nhật khoa (admin/staff)
router.put('/:id', 
  auth, 
  checkPermission('faculty', 'UPDATE'),
  facultyController.updateFaculty
);

// Xóa khoa (admin only)
router.delete('/:id', 
  auth, 
  checkPermission('faculty', 'DELETE'),
  facultyController.deleteFaculty
);

module.exports = router;
