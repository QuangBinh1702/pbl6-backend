const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');

const auth = require('../middlewares/auth.middleware');
const { checkPermission } = require('../middlewares/check_permission.middleware');

// Notification routes
// Lấy tất cả thông báo của user hiện tại (có phân trang và filter)
router.get('/', 
  auth, 
  notificationController.getAllNotifications
);

// Lấy số lượng thông báo chưa đọc (MUST be before /:id)
router.get('/unread/count', 
  auth, 
  notificationController.getUnreadCount
);

// Đánh dấu tất cả thông báo là đã đọc (MUST be before /:id)
router.put('/read-all', 
  auth, 
  notificationController.markAllAsRead
);

// Lấy thông báo theo ID
router.get('/:id', 
  auth, 
  notificationController.getNotificationById
);

// Tạo thông báo mới (chỉ admin/staff có quyền)
router.post('/', 
  auth, 
  checkPermission('notification', 'CREATE'), 
  notificationController.createNotification
);

// Cập nhật thông báo (chỉ admin/staff có quyền)
router.put('/:id', 
  auth, 
  checkPermission('notification', 'UPDATE'), 
  notificationController.updateNotification
);

// Xóa thông báo (chỉ admin/staff có quyền)
router.delete('/:id', 
  auth, 
  checkPermission('notification', 'DELETE'), 
  notificationController.deleteNotification
);

// Đánh dấu thông báo là đã đọc
router.put('/:id/read', 
  auth, 
  notificationController.markAsRead
);

module.exports = router;


