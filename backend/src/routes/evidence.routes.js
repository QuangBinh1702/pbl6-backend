const express = require('express');
const router = express.Router();
const evidenceController = require('../controllers/evidence.controller');

const auth = require('../middlewares/auth.middleware');
const { checkPermission } = require('../middlewares/check_permission.middleware');

// Quản lý minh chứng hoạt động ngoài trường

// Danh sách minh chứng (admin/staff/teacher can view)
router.get('/', 
  auth, 
  checkPermission('evidence', 'READ'),
  evidenceController.getAllEvidences
);

// Danh sách minh chứng theo studentId (authenticated)
router.get('/student/:studentId', 
  auth,
  evidenceController.getEvidencesByStudent
);

// Chi tiết minh chứng
router.get('/:id', 
  auth, 
  evidenceController.getEvidenceById
);

// Tạo minh chứng (student submit evidence)
router.post('/', 
  auth, 
  checkPermission('evidence', 'SUBMIT'),
  evidenceController.createEvidence
);

// Cập nhật minh chứng (own evidence - no permission check)
router.put('/:id', 
  auth, 
  evidenceController.updateEvidence
);

// Duyệt minh chứng (staff/teacher)
router.put('/:id/approve', 
  auth, 
  checkPermission('evidence', 'APPROVE'),
  evidenceController.approveEvidence
);

// Từ chối minh chứng (staff/teacher)
router.put('/:id/reject', 
  auth, 
  checkPermission('evidence', 'REJECT'),
  evidenceController.rejectEvidence
);

// Xóa minh chứng (admin/staff)
router.delete('/:id', 
  auth, 
  checkPermission('evidence', 'DELETE'),
  evidenceController.deleteEvidence
);

module.exports = router;
