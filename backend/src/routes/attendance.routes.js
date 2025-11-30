const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendance.controller');
const attendanceSessionController = require('../controllers/attendance_session.controller');
const auth = require('../middlewares/auth.middleware');
const { checkPermission } = require('../middlewares/check_permission.middleware');

// PHASE 2: Get master data (Classes & Faculties from database) - PUBLIC, no auth needed
router.get('/master-data',
  attendanceController.getMasterData
);

// Lấy tất cả điểm danh (admin/staff/teacher)
router.get('/', 
  auth, 
  checkPermission('attendance', 'READ'),
  attendanceController.getAllAttendances
);

// ====== SPECIFIC ROUTES (phải trước /:id) ======

// PHASE 2: Get rejection reasons (before /:id routes)
router.get('/rejection-reasons',
  auth,
  attendanceController.getRejectionReasons
);

// PHASE 2: Get pending attendances (Admin view) - before /:id
router.get('/pending',
  auth,
  checkPermission('attendance', 'READ'),
  attendanceController.getPendingAttendances
);

// PHASE 2: Export pending attendances to Excel - before /:id
router.get('/export-pending',
  auth,
  checkPermission('attendance', 'READ'),
  attendanceController.exportPendingAttendances
);

// ====== PHASE 2.5: ON-DEMAND QR MANAGEMENT (before /:id) ======

// Generate new QR code (admin/staff)
router.post('/generate-qr',
  auth,
  checkPermission('activity', 'CREATE'),
  attendanceController.generateQRCode
);

// Get all QR codes for an activity
router.get('/activity/:activity_id/qr-codes',
  auth,
  checkPermission('attendance', 'READ'),
  attendanceController.getQRCodesForActivity
);

// Delete old QR codes
router.delete('/activity/:activity_id/qr-codes',
  auth,
  checkPermission('activity', 'DELETE'),
  attendanceController.deleteOldQRCodes
);

// Quét mã QR điểm danh (students scan QR) - before /:id
router.post('/scan-qr', 
  auth, 
  checkPermission('attendance', 'SCAN'),
  attendanceController.scanQRCode
);

// 🆕 Validate QR Code (check if expired/active) - PUBLIC, no auth needed
router.post('/validate-qr',
  attendanceController.validateQRCode
);

// Lấy danh sách phản hồi chờ duyệt theo khoa - before /:id
router.get('/faculty/:facultyId/pending-feedbacks',
  auth,
  checkPermission('attendance', 'READ'),
  attendanceController.getPendingFeedbacksByFaculty
);

// Lấy danh sách sinh viên tham gia với thống kê (số lần điểm danh, điểm,...)
router.get('/activity/:activityId/students-stats', 
  auth,
  checkPermission('attendance', 'READ'),
  attendanceController.getStudentsWithStatsByActivity
);

// Lấy điểm danh theo hoạt động
router.get('/activity/:activityId', 
  auth,
  checkPermission('attendance', 'READ'),
  attendanceController.getAttendancesByActivity
);

// Lấy điểm danh theo sinh viên (own data - no permission check)
router.get('/student/:studentId', 
  auth, 
  attendanceController.getAttendancesByStudent
);

// Lấy phản hồi của sinh viên cho một hoạt động cụ thể
router.get('/student/:studentId/activity/:activityId', 
  auth,
  attendanceController.getAttendanceByStudentAndActivity
);

// Lấy danh sách hoạt động đã tham gia theo sinh viên (dựa vào attendance)
router.get('/student/:studentId/activities', 
  auth,
  attendanceController.getAttendedActivitiesByStudent
);

// ====== PHASE 2: POST ROUTES (before generic /:id) ======

// PHASE 2: Submit attendance (Student submits for approval)
router.post('/submit-attendance',
  auth,
  checkPermission('attendance', 'SCAN'),
  attendanceController.submitAttendance
);

// Tạo điểm danh mới
router.post('/', 
  auth, 
  checkPermission('attendance', 'SCAN'),
  attendanceController.createAttendance
);

// ====== GENERIC ROUTES (/:id routes) ======

// Lấy điểm danh theo ID
router.get('/:id', 
  auth, 
  checkPermission('attendance', 'READ'),
  attendanceController.getAttendanceById
);

// PHASE 2: Approve attendance (Admin approval) - /:id/approve before /:id
router.put('/:id/approve',
  auth,
  checkPermission('attendance', 'VERIFY'),
  attendanceController.approveAttendance
);

// PHASE 2: Reject attendance (Admin rejection) - /:id/reject before /:id
router.put('/:id/reject',
  auth,
  checkPermission('attendance', 'VERIFY'),
  attendanceController.rejectAttendance
);

// Xác minh điểm danh
router.put('/:id/verify', 
  auth, 
  checkPermission('attendance', 'VERIFY'),
  attendanceController.verifyAttendance
);

// Thêm phản hồi (own attendance - no permission check)
router.put('/:id/feedback', 
  auth, 
  attendanceController.addFeedback
);

// Sinh viên gửi phản hồi về điểm
router.post('/:attendanceId/submit-feedback', 
  auth,
  attendanceController.submitFeedback
);

// Staff duyệt phản hồi và cập nhật điểm
router.put('/:attendanceId/approve-feedback', 
  auth,
  checkPermission('attendance', 'VERIFY'),
  attendanceController.approveFeedback
);

// Cập nhật điểm danh
router.put('/:id', 
  auth, 
  checkPermission('attendance', 'VERIFY'),
  attendanceController.updateAttendance
);

// Xóa điểm danh (admin only via user:DELETE)
router.delete('/:id', 
  auth, 
  checkPermission('user', 'DELETE'),
  attendanceController.deleteAttendance
);

// ============================================
// ATTENDANCE SESSIONS ROUTES
// ============================================

// Tạo attendance sessions cho hoạt động
router.post('/activity/:id/sessions',
  auth,
  checkPermission('activity', 'CREATE'),
  attendanceSessionController.createAttendanceSessions
);

// Lấy attendance sessions của hoạt động
router.get('/activity/:id/sessions',
  auth,
  checkPermission('activity', 'READ'),
  attendanceSessionController.getAttendanceSessions
);

// Lấy QR code của một session
router.get('/session/:sessionId/qr',
  auth,
  checkPermission('attendance', 'READ'),
  attendanceSessionController.getSessionQRCode
);

// Cập nhật attendance session
router.put('/session/:sessionId',
  auth,
  checkPermission('activity', 'UPDATE'),
  attendanceSessionController.updateAttendanceSession
);

// Xóa attendance session
router.delete('/session/:sessionId',
  auth,
  checkPermission('activity', 'DELETE'),
  attendanceSessionController.deleteAttendanceSession
);

// ============================================
// ATTENDANCE CONFIG ROUTES
// ============================================

// Cập nhật attendance configuration cho hoạt động
router.put('/activity/:id/config',
  auth,
  checkPermission('activity', 'UPDATE'),
  attendanceSessionController.updateAttendanceConfig
);

module.exports = router;
