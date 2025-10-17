const express = require('express');
const router = express.Router();
const staffProfileController = require('../controllers/staff_profile.controller');
const auth = require('../middlewares/auth.middleware');
const role = require('../middlewares/role.middleware');

// Lấy tất cả hồ sơ cán bộ
router.get('/', auth, role(['admin', 'ctsv']), staffProfileController.getAllStaffProfiles);

// Lấy hồ sơ cán bộ theo ID
router.get('/:id', auth, staffProfileController.getStaffProfileById);

// Lấy hồ sơ cán bộ theo User ID
router.get('/user/:userId', auth, staffProfileController.getStaffProfileByUserId);

// Lấy hồ sơ cán bộ theo mã cán bộ
router.get('/staff-number/:staffNumber', auth, staffProfileController.getStaffProfileByStaffNumber);

// Lấy danh sách cán bộ theo đơn vị
router.get('/org-unit/:orgUnitId/staff', auth, staffProfileController.getStaffByOrgUnit);

// Tạo hồ sơ cán bộ mới
router.post('/', auth, role(['admin', 'ctsv']), staffProfileController.createStaffProfile);

// Cập nhật hồ sơ cán bộ
router.put('/:id', auth, staffProfileController.updateStaffProfile);

// Xóa hồ sơ cán bộ
router.delete('/:id', auth, role(['admin', 'ctsv']), staffProfileController.deleteStaffProfile);

module.exports = router;


