const express = require('express');
const router = express.Router();
const evidenceController = require('../controllers/evidence.controller');

const auth = require('../middlewares/auth.middleware');
const { checkPermission, checkPermissionOrClassMonitor } = require('../middlewares/check_permission.middleware');

// Quản lý minh chứng hoạt động ngoài trường

// 🔴 ROUTES CHUYÊN BIỆT (phải nằm trước routes với :id để tránh nhầm lẫn)

// Lấy minh chứng đã duyệt cho trang kết quả điểm của sinh viên (staff/admin hoặc sinh viên xem của mình)
router.get('/approved/my-evidences', 
  auth,
  evidenceController.getMyApprovedEvidences
);

// Lấy minh chứng đã duyệt của một sinh viên cụ thể (staff/admin hoặc sinh viên xem của mình)
router.get('/approved/:studentId', 
  auth,
  evidenceController.getApprovedEvidencesForStudent
);

// 🟢 ROUTES CHUNG (nằm sau routes chuyên biệt)

// Danh sách minh chứng (admin/staff can view)
router.get('/', 
  auth, 
  checkPermission('evidence', 'READ'),
  evidenceController.getAllEvidences
);

// Danh sách minh chứng theo khoa (admin/staff)
router.get('/faculty/:facultyId', 
  auth,
  checkPermission('evidence', 'READ'),
  evidenceController.getEvidencesByFaculty
);

// Danh sách minh chứng theo classId (admin/staff/class monitor)
router.get('/class/:classId', 
  auth,
  checkPermission('evidence', 'READ'),
  evidenceController.getEvidencesByClass
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

// Duyệt minh chứng (staff)
router.put('/:id/approve', 
  auth, 
  checkPermissionOrClassMonitor('evidence', 'APPROVE'),
  evidenceController.approveEvidence
);

// Từ chối minh chứng (staff)
router.put('/:id/reject', 
  auth, 
  checkPermissionOrClassMonitor('evidence', 'REJECT'),
  evidenceController.rejectEvidence
);

// Xóa minh chứng (admin/staff)
router.delete('/:id', 
  auth, 
  checkPermission('evidence', 'DELETE'),
  evidenceController.deleteEvidence
);

module.exports = router;
