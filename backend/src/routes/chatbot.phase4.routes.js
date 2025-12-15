// Phase 4 Chatbot Routes - Advanced features
const express = require('express');
const router = express.Router();
const authenticateToken = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/rbac.middleware');
const phase4Controller = require('../controllers/chatbot.phase4.controller');

// Phase 4 Features - Admin routes (requires admin role)

// Feature 1: Feedback Closure Workflow
router.post('/feedback/:feedbackId/response', authenticateToken, authorize('admin'), 
  phase4Controller.submitAdminResponse);
router.post('/feedback/:feedbackId/close', authenticateToken, authorize('admin'), 
  phase4Controller.closeFeedback);
router.get('/feedback/pending', authenticateToken, authorize('admin'), 
  phase4Controller.getPendingFeedback);

// Feature 2: Auto-Categorization
router.post('/documents/auto-categorize', authenticateToken, authorize('admin'), 
  phase4Controller.autoCategorizeBulk);

// Feature 3: Similarity Detection & Deduplication
router.get('/documents/:documentId/similar', authenticateToken, 
  phase4Controller.findSimilar);
router.post('/documents/deduplicate', authenticateToken, authorize('admin'), 
  phase4Controller.deduplicateDocuments);

// Feature 4: Bulk Import
router.post('/documents/bulk-import', authenticateToken, authorize('admin'), 
  phase4Controller.bulkImport);
router.post('/documents/bulk-import-csv', authenticateToken, authorize('admin'), 
  phase4Controller.bulkImportCSV);

// Feature 6: Embedding Cache
router.post('/cache/warmup', authenticateToken, authorize('admin'), 
  phase4Controller.warmupEmbeddingCache);
router.get('/cache/stats', authenticateToken, authorize('admin'), 
  phase4Controller.getEmbeddingCacheStats);

// Feature 7: A/B Testing
router.post('/experiments', authenticateToken, authorize('admin'), 
  phase4Controller.createABTest);
router.get('/experiments/:experimentId/results', authenticateToken, 
  phase4Controller.getABTestResults);

// Feature 8: User Satisfaction Dashboard
router.get('/dashboard', authenticateToken, 
  phase4Controller.getDashboard);
router.get('/dashboard/satisfaction', authenticateToken, 
  phase4Controller.getSatisfactionSummary);
router.get('/dashboard/issues', authenticateToken, 
  phase4Controller.getIssueTrackingDashboard);

// Feature 10: Fine-tuning & Training
router.get('/fine-tuning/candidates', authenticateToken, authorize('admin'), 
  phase4Controller.getFineTuningCandidates);
router.get('/documents/analysis/effectiveness', authenticateToken, authorize('admin'), 
  phase4Controller.analyzeDocumentEffectiveness);
router.get('/insights/training', authenticateToken, authorize('admin'), 
  phase4Controller.getTrainingInsights);

module.exports = router;
