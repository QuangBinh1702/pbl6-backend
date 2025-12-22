const express = require('express');
const router = express.Router();
const pvcdRecordController = require('../controllers/pvcd_record.controller');
const auth = require('../middlewares/auth.middleware');
const { checkPermission } = require('../middlewares/check_permission.middleware');

// Lấy tất cả bản ghi PVCD (admin/staff/teacher)
router.get('/', 
  auth, 
  checkPermission('pvcd_record', 'READ'),
  pvcdRecordController.getAllPvcdRecords
);

// Lấy bản ghi PVCD theo ID
router.get('/:id', 
  auth, 
  checkPermission('pvcd_record', 'READ'),
  pvcdRecordController.getPvcdRecordById
);

// Lấy bản ghi PVCD theo sinh viên (student can view own record)
router.get('/student/:studentId', 
  auth, 
  pvcdRecordController.getPvcdRecordsByStudent
);

// Lấy bản ghi PVCD theo năm
router.get('/year/:year', 
  auth, 
  checkPermission('pvcd_record', 'READ'),
  pvcdRecordController.getPvcdRecordsByYear
);

// Tạo bản ghi PVCD mới (admin/staff)
router.post('/', 
  auth, 
  checkPermission('pvcd_record', 'CREATE'),
  pvcdRecordController.createPvcdRecord
);

// Cập nhật bản ghi PVCD (admin/staff)
router.put('/:id', 
  auth, 
  checkPermission('pvcd_record', 'UPDATE'),
  pvcdRecordController.updatePvcdRecord
);

// Xóa bản ghi PVCD (admin only)
router.delete('/:id', 
  auth, 
  checkPermission('pvcd_record', 'DELETE'),
  pvcdRecordController.deletePvcdRecord
);

// 🆕 Recalculate all PVCD total_point from existing evidences (admin only)
router.post('/admin/recalculate-all', 
  auth, 
  checkPermission('pvcd_record', 'UPDATE'),
  pvcdRecordController.recalculateAllPvcdPoints
);

module.exports = router;
