const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activity.controller');

const auth = require('../middlewares/auth.middleware');
const role = require('../middlewares/role.middleware');
const permit = require('../middlewares/permission.middleware');
// Quản lý hoạt động
router.get('/', activityController.getAllActivities); // Danh sách hoạt động
router.get('/:id', auth, activityController.getActivityById); // Chi tiết hoạt động
router.post('/', auth, role(['ctsv', 'doantruong', 'hoisv', 'khoa', 'clb', 'admin']), permit('activity:create'), activityController.createActivity); // Tạo hoạt động
router.put('/:id', auth, role(['ctsv', 'doantruong', 'hoisv', 'khoa', 'clb', 'admin']), permit('activity:update'), activityController.updateActivity); // Sửa hoạt động
router.delete('/:id', auth, role(['ctsv', 'doantruong', 'hoisv', 'khoa', 'clb', 'admin']), permit('activity:delete'), activityController.deleteActivity); // Xóa/hủy hoạt động
router.put('/:id/approve', auth, role(['doantruong', 'ctsv', 'admin']), permit('activity:approve'), activityController.approveActivity); // Duyệt hoạt động
router.put('/:id/reject', auth, role(['doantruong', 'ctsv']), activityController.rejectActivity); // Từ chối hoạt động
router.put('/:id/complete', auth, role(['ctsv', 'doantruong', 'khoa', 'clb']), activityController.completeActivity); // Kết thúc hoạt động
// Đăng ký, điểm danh, xác nhận
router.post('/:id/register', auth, role(['student']), permit('activity:register'), activityController.registerActivity); // Đăng ký tham gia
router.put('/:id/attendance', auth, permit('attendance:scan'), activityController.attendanceActivity); // Điểm danh
router.put('/:id/confirm', auth, role(['ctsv', 'doantruong', 'khoa', 'loptruong']), activityController.confirmActivity); // Xác nhận kết quả
// ...

module.exports = router;
