const express = require('express');
const router = express.Router();
const staffProfileController = require('../controllers/staff_profile.controller');
const auth = require('../middlewares/auth.middleware');
const { checkPermission } = require('../middlewares/check_permission.middleware');

// Lấy tất cả hồ sơ cán bộ (admin/staff)
router.get('/', 
  auth, 
  checkPermission('staff_profile', 'READ'),
  staffProfileController.getAllStaffProfiles
);

// Lấy hồ sơ cán bộ theo ID
router.get('/:id', 
  auth, 
  checkPermission('staff_profile', 'READ'),
  staffProfileController.getStaffProfileById
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

// Tạo hồ sơ cán bộ mới (admin/staff)
router.post('/', 
  auth, 
  checkPermission('staff_profile', 'CREATE'),
  staffProfileController.createStaffProfile
);

// Cập nhật hồ sơ cán bộ
router.put('/:id', 
  auth, 
  checkPermission('staff_profile', 'UPDATE'),
  staffProfileController.updateStaffProfile
);

// Xóa hồ sơ cán bộ (admin only)
router.delete('/:id', 
  auth, 
  checkPermission('staff_profile', 'DELETE'),
  staffProfileController.deleteStaffProfile
);

module.exports = router;
