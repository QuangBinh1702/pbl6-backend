// Feedback Closure Service - Admin response & closure workflow (Phase 4 - Feature 1)
const ChatbotFeedback = require('../models/chatbot_feedback.model');
const ChatbotMessage = require('../models/chatbot_message.model');

class FeedbackClosureService {
  /**
   * Submit admin response to a feedback
   */
  async submitAdminResponse(feedbackId, adminId, response, actionTaken, tags = []) {
    try {
      const feedback = await ChatbotFeedback.findById(feedbackId);
      if (!feedback) {
        throw new Error('Feedback not found');
      }

      const updatedFeedback = await ChatbotFeedback.findByIdAndUpdate(
        feedbackId,
        {
          adminNotes: response,
          isReviewed: true,
          adminId,
          reviewedAt: new Date(),
          'adminResponse.actionTaken': actionTaken,
          'adminResponse.tags': tags,
          'adminResponse.timestamp': new Date()
        },
        { new: true }
      );

      return updatedFeedback;
    } catch (err) {
      console.error('Error submitting admin response:', err.message);
      throw err;
    }
  }

  /**
   * Close a feedback issue
   */
  async closeFeedback(feedbackId, closureReason) {
    try {
      const feedback = await ChatbotFeedback.findByIdAndUpdate(
        feedbackId,
        {
          isClosed: true,
          closureReason,
          closedAt: new Date()
        },
        { new: true }
      );

      return feedback;
    } catch (err) {
      console.error('Error closing feedback:', err.message);
      throw err;
    }
  }

  /**
   * Get pending feedback (unreviewed)
   */
  async getPendingFeedback(tenantId, options = {}) {
    try {
      const { limit = 20, page = 1, priority = 'all' } = options;
      const skip = (page - 1) * limit;

      const filter = {
        tenantId,
        isReviewed: false,
        isClosed: { $ne: true }
      };

      // Filter by priority (low rating = high priority)
      if (priority === 'high') {
        filter.rating = { $lte: 2 };
      } else if (priority === 'medium') {
        filter.rating = { $in: [2, 3] };
      } else if (priority === 'low') {
        filter.rating = { $gte: 4 };
      }

      const [feedbacks, total] = await Promise.all([
        ChatbotFeedback.find(filter)
          .sort({ rating: 1, timestamp: 1 })
          .skip(skip)
          .limit(parseInt(limit))
          .populate('userId', 'email name')
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
      console.error('Error getting pending feedback:', err.message);
      return {
        data: [],
        pagination: { total: 0, page: 1, limit: 20, pages: 0 }
      };
    }
  }

  /**
   * Get feedback closure summary
   */
  async getClosureSummary(tenantId, timeRange = 'month') {
    try {
      const dateFilter = this._getDateFilter(timeRange);

      const feedbacks = await ChatbotFeedback.find({
        tenantId,
        timestamp: dateFilter
      }).lean();

      const summary = {
        total: feedbacks.length,
        reviewed: 0,
        closed: 0,
        pending: 0,
        avgTimeToClose: 0,
        closureReasons: {},
        reviewTimeStats: {
          quick: 0, // < 1 hour
          standard: 0, // 1-24 hours
          delayed: 0 // > 24 hours
        }
      };

      let totalClosureTime = 0;
      let closedCount = 0;

      feedbacks.forEach(f => {
        if (f.isReviewed) summary.reviewed++;
        if (f.isClosed) {
          summary.closed++;
          closedCount++;

          if (f.closureReason) {
            summary.closureReasons[f.closureReason] = 
              (summary.closureReasons[f.closureReason] || 0) + 1;
          }

          // Calculate time to close
          if (f.reviewedAt && f.closedAt) {
            const timeToClose = (f.closedAt - f.reviewedAt) / (1000 * 60 * 60);
            totalClosureTime += timeToClose;

            if (timeToClose < 1) summary.reviewTimeStats.quick++;
            else if (timeToClose < 24) summary.reviewTimeStats.standard++;
            else summary.reviewTimeStats.delayed++;
          }
        } else {
          summary.pending++;
        }
      });

      if (closedCount > 0) {
        summary.avgTimeToClose = Math.round((totalClosureTime / closedCount) * 100) / 100;
      }

      return summary;
    } catch (err) {
      console.error('Error getting closure summary:', err.message);
      return {
        total: 0,
        reviewed: 0,
        closed: 0,
        pending: 0,
        avgTimeToClose: 0,
        closureReasons: {},
        reviewTimeStats: { quick: 0, standard: 0, delayed: 0 }
      };
    }
  }

  /**
   * Get closure escalation list
   */
  async getEscalationList(tenantId) {
    try {
      // Feedback not reviewed within 48 hours OR low rating with no response
      const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

      const escalated = await ChatbotFeedback.find({
        tenantId,
        $or: [
          { isReviewed: false, timestamp: { $lt: fortyEightHoursAgo } },
          { rating: { $lte: 1 }, isReviewed: false }
        ]
      })
        .sort({ rating: 1, timestamp: 1 })
        .populate('userId', 'email name')
        .limit(50)
        .lean();

      return escalated;
    } catch (err) {
      console.error('Error getting escalation list:', err.message);
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
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      default:
        startDate.setMonth(startDate.getMonth() - 1);
    }

    return { $gte: startDate, $lte: now };
  }
}

module.exports = new FeedbackClosureService();
