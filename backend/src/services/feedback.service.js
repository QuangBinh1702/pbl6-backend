// Feedback Service - User feedback collection and management
const ChatbotFeedback = require('../models/chatbot_feedback.model');
const ChatbotMessage = require('../models/chatbot_message.model');

class FeedbackService {
  /**
   * Submit feedback for an answer
   */
  async submitFeedback(data, userId) {
    try {
      const { messageId, rating, issue, suggestion, isHelpful } = data;

      // Validation
      if (!messageId || !rating) {
        throw new Error('Message ID and rating are required');
      }

      if (rating < 1 || rating > 5) {
        throw new Error('Rating must be between 1 and 5');
      }

      // Get the original message to extract context
      const message = await ChatbotMessage.findById(messageId).lean();
      if (!message) {
        throw new Error('Message not found');
      }

      // Create feedback
      const feedback = new ChatbotFeedback({
        messageId,
        userId,
        tenantId: message.tenantId,
        query: message.query,
        answer: message.answer,
        source: message.source,
        rating,
        issue: issue || null,
        suggestion: suggestion || null,
        isHelpful: isHelpful !== undefined ? isHelpful : (rating >= 4)
      });

      await feedback.save();

      // Update message with feedback reference
      await ChatbotMessage.findByIdAndUpdate(
        messageId,
        { hasFeedback: true }
      );

      return feedback;
    } catch (err) {
      console.error('Error submitting feedback:', err.message);
      throw err;
    }
  }

  /**
   * Get feedback for a message
   */
  async getFeedback(messageId) {
    try {
      return await ChatbotFeedback.findOne({ messageId }).lean();
    } catch (err) {
      console.error('Error getting feedback:', err.message);
      throw err;
    }
  }

  /**
   * List all feedback (admin)
   */
  async listFeedback(tenantId, options = {}) {
    try {
      const { limit = 20, page = 1, rating, source, issue } = options;
      const skip = (page - 1) * limit;

      const filter = { tenantId };
      if (rating) filter.rating = parseInt(rating);
      if (source) filter.source = source;
      if (issue) filter.issue = issue;

      const [feedbacks, total] = await Promise.all([
        ChatbotFeedback.find(filter)
          .sort({ timestamp: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        ChatbotFeedback.countDocuments(filter)
      ]);

      return {
        data: feedbacks,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      };
    } catch (err) {
      console.error('Error listing feedback:', err.message);
      return {
        data: [],
        pagination: { total: 0, page: 1, limit: 20, pages: 0 }
      };
    }
  }

  /**
   * Get feedback summary for a document
   */
  async getDocumentFeedbackSummary(documentId) {
    try {
      const feedbacks = await ChatbotFeedback.find({
        'source': 'rag'
      }).lean();

      // Filter for this document (would need messageId lookup)
      // For now, return aggregated stats
      const stats = {
        totalFeedback: feedbacks.length,
        avgRating: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        topIssues: [],
        helpfulCount: 0
      };

      if (feedbacks.length === 0) return stats;

      feedbacks.forEach(f => {
        stats.avgRating += f.rating;
        stats.ratingDistribution[f.rating]++;
        if (f.isHelpful) stats.helpfulCount++;
      });

      stats.avgRating = Math.round((stats.avgRating / feedbacks.length) * 100) / 100;

      // Get top issues
      const issueMap = {};
      feedbacks.forEach(f => {
        if (f.issue) {
          issueMap[f.issue] = (issueMap[f.issue] || 0) + 1;
        }
      });

      stats.topIssues = Object.entries(issueMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([issue, count]) => ({ issue, count }));

      return stats;
    } catch (err) {
      console.error('Error getting document feedback summary:', err.message);
      return {
        totalFeedback: 0,
        avgRating: 0,
        ratingDistribution: {},
        topIssues: [],
        helpfulCount: 0
      };
    }
  }

  /**
   * Get suggestions for improvement
   */
  async getSuggestions(tenantId, limit = 20) {
    try {
      const suggestions = await ChatbotFeedback.find({
        tenantId,
        suggestion: { $exists: true, $ne: null }
      })
        .sort({ timestamp: -1 })
        .limit(limit)
        .select('suggestion query source timestamp rating')
        .lean();

      return suggestions;
    } catch (err) {
      console.error('Error getting suggestions:', err.message);
      return [];
    }
  }

  /**
   * Get issues report
   */
  async getIssuesReport(tenantId) {
    try {
      const feedbacks = await ChatbotFeedback.find({
        tenantId,
        issue: { $exists: true, $ne: null }
      }).lean();

      const issueMap = {};
      feedbacks.forEach(f => {
        if (!issueMap[f.issue]) {
          issueMap[f.issue] = {
            issue: f.issue,
            count: 0,
            avgRating: 0,
            examples: []
          };
        }
        issueMap[f.issue].count++;
        issueMap[f.issue].avgRating += f.rating;
        if (issueMap[f.issue].examples.length < 3) {
          issueMap[f.issue].examples.push({
            query: f.query,
            source: f.source,
            rating: f.rating
          });
        }
      });

      // Calculate averages
      Object.values(issueMap).forEach(issue => {
        issue.avgRating = Math.round((issue.avgRating / issue.count) * 100) / 100;
      });

      return Object.values(issueMap)
        .sort((a, b) => b.count - a.count);
    } catch (err) {
      console.error('Error getting issues report:', err.message);
      return [];
    }
  }
}

module.exports = new FeedbackService();
