const express = require('express');
const router = express.Router();
const staffProfileController = require('../controllers/staff_profile.controller');
const auth = require('../middlewares/auth.middleware');
const { checkPermission } = require('../middlewares/check_permission.middleware');
const upload = require('../middlewares/upload.middleware');
const { uploadToCloudinaryMiddleware } = require('../middlewares/upload.middleware');

// Lấy tất cả hồ sơ cán bộ (admin/staff)
router.get('/', 
  auth, 
  checkPermission('staff_profile', 'READ'),
  staffProfileController.getAllStaffProfiles
);

// Lấy danh sách các position (chức vụ) có sẵn - PHẢI đặt trước /:id để tránh conflict
router.get('/positions', 
  auth,
  staffProfileController.getPositions
);

// Lấy hồ sơ cán bộ theo User ID
router.get('/user/:userId', 
  auth, 
  staffProfileController.getStaffProfileByUserId
);

// Lấy hồ sơ cán bộ theo mã cán bộ
router.get('/staff-number/:staffNumber', 
  auth, 
  checkPermission('staff_profile', 'READ'),
  staffProfileController.getStaffProfileByStaffNumber
);

// Lấy hồ sơ cán bộ theo username
router.get('/username/:username', 
  auth, 
  staffProfileController.getStaffProfileByUsername
);

// Lấy danh sách cán bộ theo đơn vị
router.get('/org-unit/:orgUnitId/staff', 
  auth, 
  checkPermission('staff_profile', 'READ'),
  staffProfileController.getStaffByOrgUnit
);

// Lấy hồ sơ cán bộ theo ID - PHẢI đặt cuối cùng để tránh conflict với các route trên
router.get('/:id', 
  auth, 
  checkPermission('staff_profile', 'READ'),
  staffProfileController.getStaffProfileById
);

// Tạo hồ sơ cán bộ mới (admin/staff) - với file upload
router.post('/', 
  auth, 
  checkPermission('staff_profile', 'CREATE'),
  upload.single('staff_image'), // Middleware để upload file ảnh
  uploadToCloudinaryMiddleware, // Tự động upload lên Cloudinary nếu có config
  staffProfileController.createStaffProfile
);

// Cập nhật hồ sơ cán bộ - với file upload
router.put('/:id', 
  auth, 
  checkPermission('staff_profile', 'UPDATE'),
  upload.single('staff_image'), // Middleware để upload file ảnh
  uploadToCloudinaryMiddleware, // Tự động upload lên Cloudinary nếu có config
  staffProfileController.updateStaffProfile
);

// Xóa hồ sơ cán bộ (admin only)
router.delete('/:id', 
  auth, 
  checkPermission('staff_profile', 'DELETE'),
  staffProfileController.deleteStaffProfile
);

module.exports = router;
