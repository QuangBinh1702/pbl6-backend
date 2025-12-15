// Advanced Analytics Service - Chatbot performance metrics
const ChatbotMessage = require('../models/chatbot_message.model');
const ChatbotDocument = require('../models/chatbot_document.model');
const ChatbotFeedback = require('../models/chatbot_feedback.model');

class AnalyticsService {
  /**
   * Get detailed retrieval metrics
   */
  async getRetrievalMetrics(tenantId, timeRange = 'day') {
    try {
      const dateFilter = this._getDateFilter(timeRange);

      // Get all RAG responses
      const ragMessages = await ChatbotMessage.find({
        tenantId,
        source: 'rag',
        timestamp: dateFilter
      }).lean();

      if (ragMessages.length === 0) {
        return {
          totalRetrievals: 0,
          avgRelevanceScore: 0,
          avgDocumentsRetrieved: 0,
          topDocuments: [],
          bottomPerformingQueries: []
        };
      }

      // Calculate metrics
      const totalScore = ragMessages.reduce((sum, m) => sum + (m.scores?.ragScore || 0), 0);
      const avgScore = totalScore / ragMessages.length;

      const totalDocs = ragMessages.reduce((sum, m) => sum + (m.retrievedDocIds?.length || 0), 0);
      const avgDocs = totalDocs / ragMessages.length;

      // Most retrieved documents
      const docCounts = {};
      ragMessages.forEach(m => {
        m.retrievedDocIds?.forEach(docId => {
          docCounts[docId] = (docCounts[docId] || 0) + 1;
        });
      });

      const topDocuments = Object.entries(docCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([docId, count]) => ({ documentId: docId, retrievalCount: count }));

      // Worst performing queries (low confidence)
      const bottomPerformingQueries = ragMessages
        .sort((a, b) => (a.scores?.ragScore || 0) - (b.scores?.ragScore || 0))
        .slice(0, 10)
        .map(m => ({
          query: m.query,
          confidence: m.scores?.ragScore,
          timestamp: m.timestamp
        }));

      return {
        totalRetrievals: ragMessages.length,
        avgRelevanceScore: Math.round(avgScore * 100) / 100,
        avgDocumentsRetrieved: Math.round(avgDocs * 100) / 100,
        topDocuments,
        bottomPerformingQueries
      };
    } catch (err) {
      console.error('Error getting retrieval metrics:', err.message);
      return {
        totalRetrievals: 0,
        avgRelevanceScore: 0,
        avgDocumentsRetrieved: 0,
        topDocuments: [],
        bottomPerformingQueries: []
      };
    }
  }

  /**
   * Get answer quality metrics (feedback-based)
   */
  async getAnswerQualityMetrics(tenantId, timeRange = 'day') {
    try {
      const dateFilter = this._getDateFilter(timeRange);

      const feedbacks = await ChatbotFeedback.find({
        tenantId,
        timestamp: dateFilter
      }).lean();

      if (feedbacks.length === 0) {
        return {
          totalFeedback: 0,
          positivePercentage: 0,
          avgRating: 0,
          commonIssues: []
        };
      }

      const positive = feedbacks.filter(f => f.rating >= 4).length;
      const totalRating = feedbacks.reduce((sum, f) => sum + f.rating, 0);

      // Common issues
      const issues = {};
      feedbacks.forEach(f => {
        if (f.issue) {
          issues[f.issue] = (issues[f.issue] || 0) + 1;
        }
      });

      const commonIssues = Object.entries(issues)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([issue, count]) => ({ issue, count }));

      return {
        totalFeedback: feedbacks.length,
        positivePercentage: Math.round((positive / feedbacks.length) * 100),
        avgRating: Math.round((totalRating / feedbacks.length) * 100) / 100,
        commonIssues
      };
    } catch (err) {
      console.error('Error getting answer quality metrics:', err.message);
      return {
        totalFeedback: 0,
        positivePercentage: 0,
        avgRating: 0,
        commonIssues: []
      };
    }
  }

  /**
   * Get comprehensive analytics dashboard
   */
  async getDashboard(tenantId, timeRange = 'day') {
    try {
      const dateFilter = this._getDateFilter(timeRange);

      // Get all messages
      const messages = await ChatbotMessage.find({
        tenantId,
        timestamp: dateFilter
      }).lean();

      // Get feedback
      const feedbacks = await ChatbotFeedback.find({
        tenantId,
        timestamp: dateFilter
      }).lean();

      // Basic stats
      const stats = {
        totalQueries: messages.length,
        timeRange,
        bySource: { rule: 0, rag: 0, fallback: 0 },
        avgResponseTime: 0,
        avgScores: { ruleScore: 0, ragScore: 0 },
        feedbackStats: {
          total: feedbacks.length,
          avgRating: 0,
          positivePercentage: 0
        }
      };

      // Calculate source distribution
      messages.forEach(m => {
        if (stats.bySource[m.source] !== undefined) {
          stats.bySource[m.source]++;
        }
      });

      // Response time average
      if (messages.length > 0) {
        const totalTime = messages.reduce((sum, m) => sum + (m.responseTime || 0), 0);
        stats.avgResponseTime = Math.round(totalTime / messages.length);

        const totalRuleScore = messages.reduce((sum, m) => sum + (m.scores?.ruleScore || 0), 0);
        stats.avgScores.ruleScore = Math.round((totalRuleScore / messages.length) * 100) / 100;

        const totalRagScore = messages.reduce((sum, m) => sum + (m.scores?.ragScore || 0), 0);
        stats.avgScores.ragScore = Math.round((totalRagScore / messages.length) * 100) / 100;
      }

      // Feedback stats
      if (feedbacks.length > 0) {
        const avgRating = feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length;
        const positive = feedbacks.filter(f => f.rating >= 4).length;
        stats.feedbackStats.avgRating = Math.round(avgRating * 100) / 100;
        stats.feedbackStats.positivePercentage = Math.round((positive / feedbacks.length) * 100);
      }

      // Get advanced metrics
      const retrieval = await this.getRetrievalMetrics(tenantId, timeRange);
      const quality = await this.getAnswerQualityMetrics(tenantId, timeRange);

      return {
        ...stats,
        retrievalMetrics: retrieval,
        answerQualityMetrics: quality
      };
    } catch (err) {
      console.error('Error getting dashboard:', err.message);
      throw err;
    }
  }

  /**
   * Get trending topics
   */
  async getTrendingTopics(tenantId, limit = 10) {
    try {
      const topics = await ChatbotMessage.aggregate([
        { $match: { tenantId } },
        {
          $group: {
            _id: null,
            queries: { $push: '$query' }
          }
        }
      ]);

      if (!topics[0]) return [];

      // Extract keywords from queries
      const keywordMap = {};
      topics[0].queries.forEach(query => {
        const words = query.toLowerCase().split(/\s+/);
        words.forEach(word => {
          if (word.length > 3) {
            keywordMap[word] = (keywordMap[word] || 0) + 1;
          }
        });
      });

      return Object.entries(keywordMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([topic, count]) => ({ topic, count }));
    } catch (err) {
      console.error('Error getting trending topics:', err.message);
      return [];
    }
  }

  /**
   * Get document performance
   */
  async getDocumentPerformance(tenantId, timeRange = 'day') {
    try {
      const dateFilter = this._getDateFilter(timeRange);

      const messages = await ChatbotMessage.find({
        tenantId,
        source: 'rag',
        timestamp: dateFilter
      }).lean();

      const docPerformance = {};

      messages.forEach(m => {
        m.retrievedDocIds?.forEach(docId => {
          if (!docPerformance[docId]) {
            docPerformance[docId] = {
              documentId: docId,
              retrievalCount: 0,
              avgConfidence: 0,
              totalConfidence: 0
            };
          }
          docPerformance[docId].retrievalCount++;
          docPerformance[docId].totalConfidence += m.scores?.ragScore || 0;
        });
      });

      // Calculate average confidence
      Object.values(docPerformance).forEach(doc => {
        if (doc.retrievalCount > 0) {
          doc.avgConfidence = Math.round((doc.totalConfidence / doc.retrievalCount) * 100) / 100;
        }
        delete doc.totalConfidence;
      });

      return Object.values(docPerformance)
        .sort((a, b) => b.retrievalCount - a.retrievalCount)
        .slice(0, 20);
    } catch (err) {
      console.error('Error getting document performance:', err.message);
      return [];
    }
  }

  /**
   * Helper: get date filter
   */
  _getDateFilter(timeRange) {
    const now = new Date();
    const startDate = new Date();

    switch (timeRange) {
      case 'hour':
        startDate.setHours(startDate.getHours() - 1);
        break;
      case 'day':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      default:
        startDate.setDate(startDate.getDate() - 1);
    }

    return { $gte: startDate, $lte: now };
  }
}

module.exports = new AnalyticsService();
