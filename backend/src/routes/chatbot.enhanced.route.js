const express = require('express');
const router = express.Router();
const authenticateToken = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');
const chatbotController = require('../controllers/chatbot.enhanced.controller');

// ==================== PUBLIC ROUTES (no auth needed) ====================
// Nếu cần open để demo, bỏ comment ở đây

// 1. Upload ảnh + sinh suggested questions (AUTH FIRST, then UPLOAD)
router.post(
  '/analyze-image',
  authenticateToken,
  (req, res, next) => {
    console.log('✅ Auth passed');
    next();
  },
  upload.single('image'),
  (req, res, next) => {
    console.log('✅ Multer passed, file:', req.file ? req.file.filename : 'NO FILE');
    next();
  },
  chatbotController.analyzeImageAndGetSuggestions
);

// ==================== PROTECTED ROUTES (auth required) ====================
router.use(authenticateToken);

// Debug middleware
router.use((req, res, next) => {
  console.log('🔵 Chatbot Request:', req.method, req.path);
  next();
});

// 2. Hỏi bất kì (smart routing: regulation, activity, attendance, info)
router.post('/ask-anything', chatbotController.askAnything);

// 3. Lấy hoạt động của user
router.get('/my-activities', chatbotController.getMyActivities);

// 4. Lấy điểm danh & PVCD của user
router.get('/my-attendance', chatbotController.getMyAttendance);

// 5. Lấy thông tin sinh viên của user
router.get('/my-info', chatbotController.getMyInfo);

// 6. Lấy lịch chat
router.get('/history', chatbotController.getChatHistory);

// 7. Submit feedback
router.post('/feedback', chatbotController.submitFeedback);

module.exports = router;
