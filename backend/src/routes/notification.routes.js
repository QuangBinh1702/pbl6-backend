const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');

router.post('/', notificationController.createNotification); // Gửi thông báo
router.get('/:userId', notificationController.getUserNotifications); // Lấy thông báo
// ...

module.exports = router;
