const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedback.controller');

router.post('/', feedbackController.createFeedback); // Gửi phản hồi
router.get('/', feedbackController.getAllFeedbacks); // Xem phản hồi
router.put('/:id/resolve', feedbackController.resolveFeedback); // Xử lý phản hồi
// ...

module.exports = router;
