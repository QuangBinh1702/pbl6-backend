// Chatbot Routes - Clean API endpoints
const express = require('express');
const router = express.Router();
const authenticateToken = require('../middlewares/auth.middleware');
const chatbotController = require('../controllers/chatbot.controller');

// ============ PUBLIC ENDPOINTS ============
// All require authentication

// Main chatbot endpoint
router.post(
  '/ask-anything',
  authenticateToken,
  chatbotController.askAnything
);

// Image analysis (placeholder for Phase 2+)
router.post(
  '/analyze-image',
  authenticateToken,
  chatbotController.analyzeImage
);

// Get user's chat history
router.get(
  '/history',
  authenticateToken,
  chatbotController.getChatHistory
);

// ============ ADMIN ENDPOINTS ============
// Require authentication + chatbot admin role

// Rules management
router.get(
  '/rules',
  authenticateToken,
  chatbotController.listRules
);

router.post(
  '/rules',
  authenticateToken,
  chatbotController.createRule
);

router.put(
  '/rules/:id',
  authenticateToken,
  chatbotController.updateRule
);

router.delete(
  '/rules/:id',
  authenticateToken,
  chatbotController.deleteRule
);

// Admin testing and monitoring
router.post(
  '/test-query',
  authenticateToken,
  chatbotController.testQuery
);

router.get(
  '/messages',
  authenticateToken,
  chatbotController.listMessages
);

router.get(
  '/analytics',
  authenticateToken,
  chatbotController.getAnalytics
);

// Knowledge base documents management (Phase 2)
router.get(
  '/documents',
  authenticateToken,
  chatbotController.listDocuments
);

router.post(
  '/documents',
  authenticateToken,
  chatbotController.createDocument
);

router.get(
  '/documents/:id',
  authenticateToken,
  chatbotController.getDocument
);

router.put(
  '/documents/:id',
  authenticateToken,
  chatbotController.updateDocument
);

router.delete(
  '/documents/:id',
  authenticateToken,
  chatbotController.deleteDocument
);

// ============ PHASE 3: FEEDBACK & ANALYTICS ============

// Submit feedback for an answer
router.post(
  '/feedback',
  authenticateToken,
  chatbotController.submitFeedback
);

// List all feedback (admin)
router.get(
  '/feedback',
  authenticateToken,
  chatbotController.listFeedback
);

// Advanced analytics dashboard
router.get(
  '/analytics/dashboard',
  authenticateToken,
  chatbotController.getDashboard
);

// Trending topics
router.get(
  '/analytics/trending-topics',
  authenticateToken,
  chatbotController.getTrendingTopics
);

// Document performance metrics
router.get(
  '/analytics/document-performance',
  authenticateToken,
  chatbotController.getDocumentPerformance
);

// Issues report
router.get(
  '/analytics/issues-report',
  authenticateToken,
  chatbotController.getIssuesReport
);

module.exports = router;
