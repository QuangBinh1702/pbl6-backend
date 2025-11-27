const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendance.controller');
const attendanceSessionController = require('../controllers/attendance_session.controller');
const auth = require('../middlewares/auth.middleware');
const { checkPermission } = require('../middlewares/check_permission.middleware');

// Lấy tất cả điểm danh (admin/staff/teacher)
router.get('/', 
  auth, 
  checkPermission('attendance', 'READ'),
  attendanceController.getAllAttendances
);

// ====== SPECIFIC ROUTES (phải trước /:id) ======

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

// ====== GENERIC ROUTES (sau specific routes) ======

// Lấy điểm danh theo ID
router.get('/:id', 
  auth, 
  checkPermission('attendance', 'READ'),
  attendanceController.getAttendanceById
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

// Tạo điểm danh mới
router.post('/', 
  auth, 
  checkPermission('attendance', 'SCAN'),
  attendanceController.createAttendance
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

// Lấy danh sách phản hồi chờ duyệt theo khoa
router.get('/faculty/:facultyId/pending-feedbacks',
  auth,
  checkPermission('attendance', 'READ'),
  attendanceController.getPendingFeedbacksByFaculty
);

// Quét mã QR điểm danh (students scan QR)
router.post('/scan-qr', 
  auth, 
  checkPermission('attendance', 'SCAN'),
  attendanceController.scanQRCode
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
