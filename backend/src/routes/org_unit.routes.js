const express = require('express');
const router = express.Router();
const orgUnitController = require('../controllers/org_unit.controller');
const auth = require('../middlewares/auth.middleware');
const { checkPermission } = require('../middlewares/check_permission.middleware');

// Lấy tất cả đơn vị tổ chức (public)
router.get('/', 
  orgUnitController.getAllOrgUnits
);

// Lấy đơn vị tổ chức theo ID (public)
router.get('/:id', 
  orgUnitController.getOrgUnitById
);

// Lấy đơn vị tổ chức theo loại (public)
router.get('/type/:type', 
  orgUnitController.getOrgUnitsByType
);

// Lấy danh sách cán bộ của đơn vị (public)
router.get('/:id/staff', 
  orgUnitController.getOrgUnitStaff
);

// Tạo đơn vị tổ chức mới (admin/staff)
router.post('/', 
  auth, 
  checkPermission('org_unit', 'CREATE'),
  orgUnitController.createOrgUnit
);

// Cập nhật đơn vị tổ chức (admin/staff)
router.put('/:id', 
  auth, 
  checkPermission('org_unit', 'UPDATE'),
  orgUnitController.updateOrgUnit
);

// Xóa đơn vị tổ chức (admin only)
router.delete('/:id', 
  auth, 
  checkPermission('org_unit', 'DELETE'),
  orgUnitController.deleteOrgUnit
);

// Đặt trưởng đơn vị (admin/staff)
router.put('/:id/set-leader', 
  auth, 
  checkPermission('org_unit', 'UPDATE'),
  orgUnitController.setLeader
);

module.exports = router;
