const express = require('express');
const router = express.Router();
const orgUnitController = require('../controllers/org_unit.controller');
const auth = require('../middlewares/auth.middleware');
const role = require('../middlewares/role.middleware');

// Lấy tất cả đơn vị tổ chức
router.get('/', auth, orgUnitController.getAllOrgUnits);

// Lấy đơn vị tổ chức theo ID
router.get('/:id', auth, orgUnitController.getOrgUnitById);

// Lấy đơn vị tổ chức theo loại
router.get('/type/:type', auth, orgUnitController.getOrgUnitsByType);

// Lấy danh sách cán bộ của đơn vị
router.get('/:id/staff', auth, orgUnitController.getOrgUnitStaff);

// Tạo đơn vị tổ chức mới
router.post('/', auth, role(['admin', 'ctsv']), orgUnitController.createOrgUnit);

// Cập nhật đơn vị tổ chức
router.put('/:id', auth, role(['admin', 'ctsv']), orgUnitController.updateOrgUnit);

// Xóa đơn vị tổ chức
router.delete('/:id', auth, role(['admin', 'ctsv']), orgUnitController.deleteOrgUnit);

// Đặt trưởng đơn vị
router.put('/:id/set-leader', auth, role(['admin', 'ctsv']), orgUnitController.setLeader);

module.exports = router;


