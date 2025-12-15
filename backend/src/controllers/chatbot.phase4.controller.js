// Phase 4 Chatbot Controller - Advanced features (feedback closure, auto-category, similarity, etc.)
const feedbackClosureService = require('../services/feedbackClosure.service');
const autoCategoryService = require('../services/autoCategory.service');
const similarityService = require('../services/similarity.service');
const bulkImportService = require('../services/bulkImport.service');
const embeddingCacheService = require('../services/embeddingCache.service');
const abTestingService = require('../services/abTesting.service');
const dashboardService = require('../services/dashboard.service');
const fineTuningService = require('../services/fineTuning.service');
const realtime = require('../services/realtime.service');

class ChatbotPhase4Controller {
  /**
   * [Feature 1] Submit admin response to feedback
   */
  async submitAdminResponse(req, res) {
    try {
      const { feedbackId } = req.params;
      const { response, actionTaken, tags } = req.body;
      const userId = req.user._id;

      const result = await feedbackClosureService.submitAdminResponse(
        feedbackId,
        userId,
        response,
        actionTaken,
        tags
      );

      res.status(200).json({
        status: 'success',
        message: 'Admin response submitted',
        data: result
      });
    } catch (err) {
      res.status(400).json({
        status: 'error',
        message: err.message
      });
    }
  }

  /**
   * [Feature 1] Close a feedback issue
   */
  async closeFeedback(req, res) {
    try {
      const { feedbackId } = req.params;
      const { closureReason } = req.body;

      const result = await feedbackClosureService.closeFeedback(feedbackId, closureReason);

      res.status(200).json({
        status: 'success',
        message: 'Feedback closed',
        data: result
      });
    } catch (err) {
      res.status(400).json({
        status: 'error',
        message: err.message
      });
    }
  }

  /**
   * [Feature 1] Get pending feedback for admin review
   */
  async getPendingFeedback(req, res) {
    try {
      const tenantId = req.user.tenantId;
      const { page, limit, priority } = req.query;

      const result = await feedbackClosureService.getPendingFeedback(
        tenantId,
        { page, limit, priority }
      );

      res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (err) {
      res.status(400).json({
        status: 'error',
        message: err.message
      });
    }
  }

  /**
   * [Feature 2] Auto-categorize documents
   */
  async autoCategorizeBulk(req, res) {
    try {
      const tenantId = req.user.tenantId;
      const { categoryFilter } = req.body;

      const result = await autoCategoryService.bulkRecategorize(tenantId, categoryFilter);

      res.status(200).json({
        status: 'success',
        message: 'Documents recategorized',
        data: result
      });
    } catch (err) {
      res.status(400).json({
        status: 'error',
        message: err.message
      });
    }
  }

  /**
   * [Feature 3] Find similar documents
   */
  async findSimilar(req, res) {
    try {
      const { documentId } = req.params;
      const tenantId = req.user.tenantId;

      const similar = await similarityService.findSimilarDocuments(documentId, tenantId);

      res.status(200).json({
        status: 'success',
        data: similar
      });
    } catch (err) {
      res.status(400).json({
        status: 'error',
        message: err.message
      });
    }
  }

  /**
   * [Feature 3] Deduplicate documents
   */
  async deduplicateDocuments(req, res) {
    try {
      const tenantId = req.user.tenantId;
      const { mergeStrategy } = req.body;

      const result = await similarityService.deduplicateDocuments(tenantId, mergeStrategy);

      res.status(200).json({
        status: 'success',
        message: 'Deduplication complete',
        data: result
      });
    } catch (err) {
      res.status(400).json({
        status: 'error',
        message: err.message
      });
    }
  }

  /**
   * [Feature 4] Bulk import documents
   */
  async bulkImport(req, res) {
    try {
      const tenantId = req.user.tenantId;
      const userId = req.user._id;
      const { documents, options } = req.body;

      const result = await bulkImportService.importDocuments(
        documents,
        tenantId,
        userId,
        options
      );

      res.status(200).json({
        status: 'success',
        message: 'Documents imported',
        data: result
      });
    } catch (err) {
      res.status(400).json({
        status: 'error',
        message: err.message
      });
    }
  }

  /**
   * [Feature 4] Bulk import from CSV
   */
  async bulkImportCSV(req, res) {
    try {
      const tenantId = req.user.tenantId;
      const userId = req.user._id;
      const { csvContent, options } = req.body;

      const result = await bulkImportService.importFromCSV(
        csvContent,
        tenantId,
        userId,
        options
      );

      res.status(200).json({
        status: 'success',
        message: 'CSV imported',
        data: result
      });
    } catch (err) {
      res.status(400).json({
        status: 'error',
        message: err.message
      });
    }
  }

  /**
   * [Feature 6] Warmup embedding cache
   */
  async warmupEmbeddingCache(req, res) {
    try {
      const tenantId = req.user.tenantId;
      const { documentIds } = req.body;

      const result = await embeddingCacheService.warmupCache(tenantId, documentIds);

      res.status(200).json({
        status: 'success',
        message: 'Embedding cache warmed up',
        data: result
      });
    } catch (err) {
      res.status(400).json({
        status: 'error',
        message: err.message
      });
    }
  }

  /**
   * [Feature 6] Get cache stats
   */
  async getEmbeddingCacheStats(req, res) {
    try {
      const stats = embeddingCacheService.getStats();

      res.status(200).json({
        status: 'success',
        data: stats
      });
    } catch (err) {
      res.status(400).json({
        status: 'error',
        message: err.message
      });
    }
  }

  /**
   * [Feature 7] Create A/B test
   */
  async createABTest(req, res) {
    try {
      const { name, description, controlVersion, treatmentVersion, splitRatio, startDate, endDate } = req.body;
      const tenantId = req.user.tenantId;

      const experiment = await abTestingService.createExperiment({
        name,
        description,
        tenantId,
        controlVersion,
        treatmentVersion,
        splitRatio,
        startDate,
        endDate
      });

      res.status(201).json({
        status: 'success',
        message: 'A/B test created',
        data: experiment
      });
    } catch (err) {
      res.status(400).json({
        status: 'error',
        message: err.message
      });
    }
  }

  /**
   * [Feature 7] Get A/B test results
   */
  async getABTestResults(req, res) {
    try {
      const { experimentId } = req.params;

      const results = await abTestingService.getExperimentResults(experimentId);

      res.status(200).json({
        status: 'success',
        data: results
      });
    } catch (err) {
      res.status(400).json({
        status: 'error',
        message: err.message
      });
    }
  }

  /**
   * [Feature 8] Get dashboard data
   */
  async getDashboard(req, res) {
    try {
      const tenantId = req.user.tenantId;
      const { timeRange } = req.query;

      const dashboard = await dashboardService.getDashboardData(tenantId, timeRange);

      res.status(200).json({
        status: 'success',
        data: dashboard
      });
    } catch (err) {
      res.status(400).json({
        status: 'error',
        message: err.message
      });
    }
  }

  /**
   * [Feature 8] Get satisfaction summary
   */
  async getSatisfactionSummary(req, res) {
    try {
      const tenantId = req.user.tenantId;
      const { timeRange } = req.query;

      const summary = await dashboardService.getSatisfactionSummary(tenantId, timeRange);

      res.status(200).json({
        status: 'success',
        data: summary
      });
    } catch (err) {
      res.status(400).json({
        status: 'error',
        message: err.message
      });
    }
  }

  /**
   * [Feature 8] Get issue tracking dashboard
   */
  async getIssueTrackingDashboard(req, res) {
    try {
      const tenantId = req.user.tenantId;

      const dashboard = await dashboardService.getIssueTrackingDashboard(tenantId);

      res.status(200).json({
        status: 'success',
        data: dashboard
      });
    } catch (err) {
      res.status(400).json({
        status: 'error',
        message: err.message
      });
    }
  }

  /**
   * [Feature 10] Get fine-tuning candidates
   */
  async getFineTuningCandidates(req, res) {
    try {
      const tenantId = req.user.tenantId;
      const { minFeedbackCount, minNegativeRating, timeRange } = req.query;

      const candidates = await fineTuningService.getFineTuningCandidates(tenantId, {
        minFeedbackCount,
        minNegativeRating,
        timeRange
      });

      res.status(200).json({
        status: 'success',
        data: candidates
      });
    } catch (err) {
      res.status(400).json({
        status: 'error',
        message: err.message
      });
    }
  }

  /**
   * [Feature 10] Analyze document effectiveness
   */
  async analyzeDocumentEffectiveness(req, res) {
    try {
      const tenantId = req.user.tenantId;

      const analysis = await fineTuningService.analyzeDocumentEffectiveness(tenantId);

      res.status(200).json({
        status: 'success',
        data: analysis
      });
    } catch (err) {
      res.status(400).json({
        status: 'error',
        message: err.message
      });
    }
  }

  /**
   * [Feature 10] Get training insights
   */
  async getTrainingInsights(req, res) {
    try {
      const tenantId = req.user.tenantId;

      const insights = await fineTuningService.getTrainingInsights(tenantId);

      res.status(200).json({
        status: 'success',
        data: insights
      });
    } catch (err) {
      res.status(400).json({
        status: 'error',
        message: err.message
      });
    }
  }
}

module.exports = new ChatbotPhase4Controller();
