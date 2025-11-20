const express = require('express');
const router = express.Router();
const authenticateToken = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');
const chatbotController = require('../controllers/chatbot.controller');

// Middleware: Kiểm tra người dùng đã login
router.use(authenticateToken);

// Gửi ảnh → trích text + tìm quy định (hỗ trợ upload file + URL)
router.post('/analyze-image', upload.single('image'), chatbotController.analyzeImageAndRespond);

// Hỏi câu hỏi văn bản
router.post('/ask', chatbotController.answerQuestion);

// Lấy lịch chat của user
router.get('/history', chatbotController.getChatHistory);

// Lấy danh sách quy định (có filter + search)
router.get('/regulations', chatbotController.getRegulations);

module.exports = router;
