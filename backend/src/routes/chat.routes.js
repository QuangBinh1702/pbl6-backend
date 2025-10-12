const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');

router.get('/:activityId', chatController.getActivityChats); // Lấy tin nhắn nhóm sự kiện
router.post('/:activityId', chatController.sendActivityChat); // Gửi tin nhắn nhóm
// ...

module.exports = router;
