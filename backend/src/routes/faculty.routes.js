const express = require('express');
const router = express.Router();
const facultyController = require('../controllers/faculty.controller');
const auth = require('../middlewares/auth.middleware');
const { checkPermission } = require('../middlewares/check_permission.middleware');

// Lấy tất cả khoa (all users can view)
router.get('/', 
  auth, 
  checkPermission('faculty', 'READ'),
  facultyController.getAllFaculties
);

// Lấy khoa theo ID
router.get('/:id', 
  auth, 
  checkPermission('faculty', 'READ'),
  facultyController.getFacultyById
);

// Lấy danh sách lớp của khoa
router.get('/:id/classes', 
  auth, 
  checkPermission('faculty', 'READ'),
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
