const express = require('express');
const router = express.Router();
const evidenceController = require('../controllers/evidence.controller');

const auth = require('../middlewares/auth.middleware');
const role = require('../middlewares/role.middleware');
// Quản lý minh chứng hoạt động ngoài trường
router.get('/', auth, role(['admin', 'ctsv', 'khoa', 'loptruong']), evidenceController.getAllEvidences); // Danh sách minh chứng
router.get('/:id', auth, evidenceController.getEvidenceById); // Chi tiết minh chứng
router.post('/', auth, role(['student']), evidenceController.createEvidence); // Tạo minh chứng
router.put('/:id', auth, evidenceController.updateEvidence); // Cập nhật minh chứng
router.put('/:id/approve', auth, role(['ctsv', 'khoa', 'loptruong']), evidenceController.approveEvidence); // Duyệt minh chứng
router.put('/:id/reject', auth, role(['ctsv', 'khoa', 'loptruong']), evidenceController.rejectEvidence); // Từ chối minh chứng
router.delete('/:id', auth, role(['admin', 'ctsv']), evidenceController.deleteEvidence); // Xóa minh chứng

module.exports = router;
