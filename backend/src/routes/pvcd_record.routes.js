const express = require('express');
const router = express.Router();
const pvcdRecordController = require('../controllers/pvcd_record.controller');
const auth = require('../middlewares/auth.middleware');
const role = require('../middlewares/role.middleware');

// Lấy tất cả bản ghi PVCD
router.get('/', auth, role(['admin', 'ctsv', 'teacher']), pvcdRecordController.getAllPvcdRecords);

// Lấy bản ghi PVCD theo ID
router.get('/:id', auth, pvcdRecordController.getPvcdRecordById);

// Lấy bản ghi PVCD theo sinh viên
router.get('/student/:studentId', auth, pvcdRecordController.getPvcdRecordsByStudent);

// Lấy bản ghi PVCD theo năm
router.get('/year/:year', auth, role(['admin', 'ctsv', 'teacher']), pvcdRecordController.getPvcdRecordsByYear);

// Tạo bản ghi PVCD mới
router.post('/', auth, role(['admin', 'ctsv']), pvcdRecordController.createPvcdRecord);

// Cập nhật bản ghi PVCD
router.put('/:id', auth, role(['admin', 'ctsv']), pvcdRecordController.updatePvcdRecord);

// Cập nhật điểm
router.put('/:id/points', auth, role(['admin', 'ctsv']), pvcdRecordController.updatePoints);

// Xóa bản ghi PVCD
router.delete('/:id', auth, role(['admin', 'ctsv']), pvcdRecordController.deletePvcdRecord);

module.exports = router;


