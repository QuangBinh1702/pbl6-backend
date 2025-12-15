// Dashboard Service - User satisfaction dashboard (Phase 4 - Feature 8)
const ChatbotMessage = require('../models/chatbot_message.model');
const ChatbotFeedback = require('../models/chatbot_feedback.model');
const ChatbotDocument = require('../models/chatbot_document.model');

class DashboardService {
  /**
   * Get comprehensive dashboard data
   */
  async getDashboardData(tenantId, timeRange = 'week') {
    try {
      const dateFilter = this._getDateFilter(timeRange);

      const [messages, feedbacks, documents] = await Promise.all([
        ChatbotMessage.find({ tenantId, timestamp: dateFilter }).lean(),
        ChatbotFeedback.find({ tenantId, timestamp: dateFilter }).lean(),
        ChatbotDocument.find({ tenantId, isActive: true }).lean()
      ]);

      return {
        summary: this._getSummary(messages, feedbacks),
        satisfaction: this._getSatisfactionMetrics(feedbacks),
        sourceDistribution: this._getSourceDistribution(messages),
        responseTimeStats: this._getResponseTimeStats(messages),
        documentPerformance: this._getDocumentPerformance(messages, documents),
        userEngagement: this._getUserEngagement(messages, feedbacks),
        trends: await this._getTrends(tenantId, timeRange)
      };
    } catch (err) {
      console.error('Error getting dashboard data:', err.message);
      throw err;
    }
  }

  /**
   * Get satisfaction summary
   */
  async getSatisfactionSummary(tenantId, timeRange = 'month') {
    try {
      const dateFilter = this._getDateFilter(timeRange);

      const feedbacks = await ChatbotFeedback.find({
        tenantId,
        timestamp: dateFilter
      }).lean();

      if (feedbacks.length === 0) {
        return {
          totalRatings: 0,
          avgRating: 0,
          nps: 0,
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          sentimentBreakdown: { positive: 0, neutral: 0, negative: 0 }
        };
      }

      const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      let totalRating = 0;
      let promoters = 0;
      let detractors = 0;

      feedbacks.forEach(f => {
        distribution[f.rating]++;
        totalRating += f.rating;

        if (f.rating >= 4) promoters++;
        else if (f.rating <= 2) detractors++;
      });

      const avgRating = totalRating / feedbacks.length;
      const nps = ((promoters - detractors) / feedbacks.length) * 100;

      return {
        totalRatings: feedbacks.length,
        avgRating: Math.round(avgRating * 100) / 100,
        nps: Math.round(nps),
        ratingDistribution: distribution,
        sentimentBreakdown: {
          positive: Math.round((promoters / feedbacks.length) * 100),
          neutral: Math.round((((feedbacks.length - promoters - detractors) / feedbacks.length) * 100)),
          negative: Math.round((detractors / feedbacks.length) * 100)
        }
      };
    } catch (err) {
      console.error('Error getting satisfaction summary:', err.message);
      return {};
    }
  }

  /**
   * Get issue tracking dashboard
   */
  async getIssueTrackingDashboard(tenantId) {
    try {
      const feedbacks = await ChatbotFeedback.find({
        tenantId,
        issue: { $exists: true, $ne: null }
      }).lean();

      const issueStats = {};
      const issues = [
        'incomplete', 'inaccurate', 'irrelevant', 'unclear', 
        'outdated', 'too_long', 'too_short', 'wrong_language', 'other'
      ];

      issues.forEach(issue => {
        issueStats[issue] = {
          count: 0,
          avgRating: 0,
          percentage: 0,
          examples: []
        };
      });

      feedbacks.forEach(f => {
        if (f.issue && issueStats[f.issue]) {
          issueStats[f.issue].count++;
          issueStats[f.issue].avgRating += f.rating;

          if (issueStats[f.issue].examples.length < 3) {
            issueStats[f.issue].examples.push({
              query: f.query,
              source: f.source,
              rating: f.rating,
              suggestion: f.suggestion
            });
          }
        }
      });

      const total = feedbacks.length;

      Object.values(issueStats).forEach(stat => {
        if (stat.count > 0) {
          stat.avgRating = Math.round((stat.avgRating / stat.count) * 100) / 100;
          stat.percentage = Math.round((stat.count / total) * 100);
        }
      });

      return Object.entries(issueStats)
        .filter(([_, stat]) => stat.count > 0)
        .sort((a, b) => b[1].count - a[1].count)
        .reduce((acc, [issue, stat]) => {
          acc[issue] = stat;
          return acc;
        }, {});
    } catch (err) {
      console.error('Error getting issue tracking dashboard:', err.message);
      return {};
    }
  }

  /**
   * Get user satisfaction by segment
   */
  async getSatisfactionBySegment(tenantId, segmentBy = 'source') {
    try {
      const feedbacks = await ChatbotFeedback.find({
        tenantId
      }).lean();

      const segments = {};

      feedbacks.forEach(f => {
        const segmentKey = f[segmentBy] || 'unknown';

        if (!segments[segmentKey]) {
          segments[segmentKey] = {
            count: 0,
            totalRating: 0,
            avgRating: 0,
            helpfulCount: 0
          };
        }

        segments[segmentKey].count++;
        segments[segmentKey].totalRating += f.rating;
        if (f.isHelpful) segments[segmentKey].helpfulCount++;
      });

      Object.values(segments).forEach(seg => {
        seg.avgRating = Math.round((seg.totalRating / seg.count) * 100) / 100;
        seg.helpfulPercentage = Math.round((seg.helpfulCount / seg.count) * 100);
        delete seg.totalRating;
      });

      return segments;
    } catch (err) {
      console.error('Error getting satisfaction by segment:', err.message);
      return {};
    }
  }

  /**
   * Helper: get summary metrics
   */
  _getSummary(messages, feedbacks) {
    return {
      totalQueries: messages.length,
      totalFeedback: feedbacks.length,
      feedbackRate: messages.length > 0 ? 
        Math.round((feedbacks.length / messages.length) * 100) : 0,
      avgRating: feedbacks.length > 0 ?
        Math.round((feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length) * 100) / 100 : 0
    };
  }

  /**
   * Helper: get satisfaction metrics
   */
  _getSatisfactionMetrics(feedbacks) {
    if (feedbacks.length === 0) {
      return {
        avgRating: 0,
        positivePercentage: 0,
        satisfiedCount: 0
      };
    }

    const positive = feedbacks.filter(f => f.rating >= 4).length;
    const totalRating = feedbacks.reduce((sum, f) => sum + f.rating, 0);

    return {
      avgRating: Math.round((totalRating / feedbacks.length) * 100) / 100,
      positivePercentage: Math.round((positive / feedbacks.length) * 100),
      satisfiedCount: positive
    };
  }

  /**
   * Helper: get source distribution
   */
  _getSourceDistribution(messages) {
    const dist = { rule: 0, rag: 0, fallback: 0 };

    messages.forEach(m => {
      if (dist[m.source] !== undefined) {
        dist[m.source]++;
      }
    });

    const total = messages.length;
    const result = {};

    Object.entries(dist).forEach(([source, count]) => {
      result[source] = {
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0
      };
    });

    return result;
  }

  /**
   * Helper: get response time stats
   */
  _getResponseTimeStats(messages) {
    if (messages.length === 0) {
      return { avgTime: 0, minTime: 0, maxTime: 0 };
    }

    const times = messages.map(m => m.responseTime || 0);
    const sum = times.reduce((a, b) => a + b, 0);

    return {
      avgTime: Math.round(sum / times.length),
      minTime: Math.min(...times),
      maxTime: Math.max(...times)
    };
  }

  /**
   * Helper: get document performance
   */
  _getDocumentPerformance(messages, documents) {
    const docMap = {};

    messages.forEach(m => {
      m.retrievedDocIds?.forEach(docId => {
        if (!docMap[docId]) {
          docMap[docId] = { retrievalCount: 0 };
        }
        docMap[docId].retrievalCount++;
      });
    });

    const topDocs = Object.entries(docMap)
      .sort((a, b) => b[1].retrievalCount - a[1].retrievalCount)
      .slice(0, 10)
      .map(([docId, stats]) => {
        const doc = documents.find(d => d._id.toString() === docId);
        return {
          documentId: docId,
          title: doc?.title || 'Unknown',
          retrievalCount: stats.retrievalCount
        };
      });

    return topDocs;
  }

  /**
   * Helper: get user engagement
   */
  _getUserEngagement(messages, feedbacks) {
    const userMap = {};

    messages.forEach(m => {
      if (!userMap[m.userId]) {
        userMap[m.userId] = { queries: 0, feedback: 0 };
      }
      userMap[m.userId].queries++;
    });

    feedbacks.forEach(f => {
      if (userMap[f.userId]) {
        userMap[f.userId].feedback++;
      }
    });

    const engagementRates = Object.values(userMap)
      .map(u => u.feedback > 0 ? (u.feedback / u.queries * 100) : 0);

    return {
      activeUsers: Object.keys(userMap).length,
      avgQueriesPerUser: messages.length / Object.keys(userMap).length,
      feedbackParticipationRate: Math.round(
        (Object.values(userMap).filter(u => u.feedback > 0).length / Object.keys(userMap).length) * 100
      )
    };
  }

  /**
   * Helper: get trends
   */
  async _getTrends(tenantId, timeRange) {
    const now = new Date();
    const startDate = new Date();

    if (timeRange === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else {
      startDate.setMonth(startDate.getMonth() - 1);
    }

    const messages = await ChatbotMessage.find({
      tenantId,
      timestamp: { $gte: startDate, $lte: now }
    }).lean();

    const dayMap = {};

    messages.forEach(m => {
      const date = new Date(m.timestamp).toDateString();
      if (!dayMap[date]) {
        dayMap[date] = 0;
      }
      dayMap[date]++;
    });

    return Object.entries(dayMap)
      .sort((a, b) => new Date(a[0]) - new Date(b[0]))
      .map(([date, count]) => ({ date, count }));
  }

  /**
   * Helper: get date filter
   */
  _getDateFilter(timeRange) {
    const now = new Date();
    const startDate = new Date();

    switch (timeRange) {
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
        startDate.setDate(startDate.getDate() - 7);
    }

    return { $gte: startDate, $lte: now };
  }
}

module.exports = new DashboardService();
